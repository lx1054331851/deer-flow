# Memory 系统改进

本文档说明了 memory 系统在事实注入机制上的近期改进。
## 概览

`format_memory_for_injection` 函数有两项核心改进：
1. **基于相似度的事实召回**：使用 TF-IDF 选择与当前对话最相关的 facts
2. **精确 token 计数**：使用 tiktoken 进行精确计数，替代粗糙的字符估算

## 1. 基于相似度的 Facts 召回

### 问题
原实现仅按 confidence 排序，固定选取前 15 个高置信度 facts，而不考虑其与当前对话的相关性。这会导致无关信息被注入，同时遗漏真正重要的上下文。

### 方案

新实现使用 **TF-IDF（词频-逆文档频率）** 向量化 + 余弦相似度，衡量每个 fact 与当前对话上下文的相关性。
**评分公式**：
```
final_score = (similarity × 0.6) + (confidence × 0.4)
```
- **Similarity（60% 权重）**：fact 内容与当前上下文的余弦相似度
- **Confidence（40% 权重）**：LLM 给出的置信分（0-1）

### 收益

- **上下文感知**：优先选择与用户当前话题相关的 facts
- **动态性**：不同对话主题会浮现不同 facts
- **平衡性**：同时考虑相关度与可靠性
- **回退机制**：当缺少上下文时，平滑回退到仅按 confidence 排序
### 示例

给定 Python、React、Docker 相关 facts：
用户问：*"How should I write Python tests?"*
  - 优先：Python 测试、类型提示、pytest
用户问：*"How to optimize my Next.js app?"*
  - 优先：React/Next.js 经验、性能优化
### 配置

可在 `config.yaml` 中自定义权重（可选）：
```yaml
memory:
  similarity_weight: 0.6  # TF-IDF 相似度权重（0-1）
  confidence_weight: 0.4  # 置信度权重（0-1）
```
**注意**：为获得最佳效果，权重之和建议为 1.0。

## 2. 精确 Token 计数

### 问题

原实现使用简单公式估算 token：
```python
max_chars = max_tokens * 4
```
该方法假设约 4 字符 = 1 token，存在以下问题：
- 对很多语言和内容类型不准确
- 可能过量注入（超过 token 限制）
- 也可能注入不足（浪费可用预算）

### 方案

新实现使用 **tiktoken**，OpenAI 的官方分词库，精确计数：

```python
import tiktoken

def _count_tokens(text: str, encoding_name: str = "cl100k_base") -> int:
  encoding = tiktoken.get_encoding(encoding_name)
  return len(encoding.encode(text))
```
- 使用 `cl100k_base` 编码（适配 GPT-4、GPT-3.5、text-embedding-ada-002）
- 为预算管理提供精确 token 计数
- 若 tiktoken 不可用，会回退到字符估算

### 收益

- **精确性**：token 计数与模型实际看到的一致
- **预算优化**：最大化利用可用 token 预算
- **防溢出**：避免超过 `max_injection_tokens` 限制
- **可规划性**：各部分 token 开销更可控
**结果**：相差 3 token（18.75% 误差）

在生产环境中，以下内容误差可能更大：
- 代码片段（单位字符 token 更多）
- 非英文文本（token 比例波动）
- 技术术语（常由多个 token 构成）

## 实现细节

### 函数签名
```python
def format_memory_for_injection(
  memory_data: dict[str, Any],
  max_tokens: int = 2000,
  current_context: str | None = None,
) -> str:
```
**新增参数**：
- `current_context`：可选字符串，包含近期对话内容，用于相似度计算

### 向后兼容性

该函数保持 **100% 向后兼容**：
- 当 `current_context` 为 `None` 或空字符串时，回退到仅按 confidence 排序
- 旧调用方不传该参数时行为不变
- token 计数始终更精确（透明升级）

### 集成位置

Memory 通过 `MemoryMiddleware.before_model()` **动态注入**：

```python
# src/agents/middlewares/memory_middleware.py

def _extract_conversation_context(messages: list, max_turns: int = 3) -> str:
  """提取近期对话（仅用户输入 + 最终回复）。"""
  context_parts = []
  turn_count = 0

  for msg in reversed(messages):
    if msg.type == "human":
      # 始终包含用户消息
      context_parts.append(extract_text(msg))
      turn_count += 1
      if turn_count >= max_turns:
        break

    elif msg.type == "ai" and not msg.tool_calls:
      # 仅包含最终 AI 回复（无 tool_calls）
      context_parts.append(extract_text(msg))

    # 跳过 tool 消息与带 tool_calls 的 AI 消息

  return " ".join(reversed(context_parts))


class MemoryMiddleware:
  def before_model(self, state, runtime):
    """在每次 LLM 调用前注入 memory（不是 only before_agent）。"""

    # 获取近期对话上下文（已过滤）
    conversation_context = _extract_conversation_context(
      state["messages"],
      max_turns=3
    )

    # 加载 memory，并按上下文感知选择 facts
    memory_data = get_memory_data()
    memory_content = format_memory_for_injection(
      memory_data,
      max_tokens=config.max_injection_tokens,
      current_context=conversation_context,  # ✅ 仅干净对话上下文
    )

    # 以 system message 注入
    memory_message = SystemMessage(
      content=f"<memory>\n{memory_content}\n</memory>",
      name="memory_context",
    )

    return {"messages": [memory_message] + state["messages"]}
```
### 工作流程

1. **用户继续对话**：
  ```
  Turn 1: "I'm working on a Python project"
  Turn 2: "It uses FastAPI and SQLAlchemy"
  Turn 3: "How do I write tests?"  ← 当前查询
  ```

2. **提取近期上下文**：合并最近 3 轮：
  ```
  "I'm working on a Python project. It uses FastAPI and SQLAlchemy. How do I write tests?"
  ```

3. **TF-IDF 评分**：按与该上下文的相关性排序 facts
  - 高分："Prefers pytest for testing"（测试 + Python）
  - 高分："Likes type hints in Python"（Python 相关）
  - 高分："Expert in Python and FastAPI"（Python + FastAPI）
  - 低分："Uses Docker for containerization"（相关性较低）

4. **注入**：将高分 facts 注入系统提示词的 `<memory>` 区块

5. **Agent 可见**：包含相关 memory 上下文的完整 system prompt

### 动态 System Prompt 的收益

- **多轮上下文**：使用最近 3 轮，而非仅当前问题
  - 能捕捉连续对话语境
  - 更好理解用户当前关注点
- **查询相关 facts**：根据话题动态选择不同 facts
- **架构更清晰**：无需复杂消息拼接逻辑
- **LangChain 原生支持**：采用内置动态 system prompt 能力
- **运行时灵活**：每次 agent 调用都会重新生成 memory

## 依赖项

`pyproject.toml` 新增依赖：
```toml
dependencies = [
  # ... existing dependencies ...
  "tiktoken>=0.8.0",      # 精确 token 计数
  "scikit-learn>=1.6.1",  # TF-IDF 向量化
]
```
安装方式：
```bash
cd backend
uv sync
```

## 测试

运行测试脚本验证改进：
```bash
cd backend
python test_memory_improvement.py
```

预期输出应体现：
- 基于上下文的 fact 排序差异
- 与旧方案对比的精确 token 计数
- 遵守预算的 fact 选择

## 性能影响

### 计算开销

- **TF-IDF 计算**：O(n × m)，其中 n=facts 数量，m=词汇规模
  - 在常见规模（10-100 facts）下开销可忽略
  - 若上下文不变，可进一步做缓存
- **Token 计数**：约 10-100µs/次
  - 相比旧字符估算更快
  - 相对 LLM 推理开销极小

### 内存开销

- **TF-IDF 向量器**：常见词表约 1-5MB
  - 每次注入调用时实例化
  - 用后可被垃圾回收
- **Tiktoken 编码器**：约 1MB（单例缓存）
  - 进程生命周期内只加载一次

### 建议

- 当前实现优先“准确性”而非“缓存”
- 在高吞吐场景可考虑：
  - 预计算 fact 向量（存储于 memory.json）
  - 在调用间缓存 TF-IDF 向量器
  - 当 facts >1000 时使用近似最近邻检索

## 总结

| 维度 | 改进前 | 改进后 |
|--------|--------|-------|
| Fact 选择 | 仅按 confidence 取 Top 15 | 按相关度（相似度 + confidence） |
| Token 计数 | `len(text) // 4` | `tiktoken.encode(text)` |
| 上下文感知 | 无 | TF-IDF 余弦相似度 |
| 准确性 | ±25% 估算误差 | 精确 token 计数 |
| 配置能力 | 固定权重 | 相似度/置信度权重可配置 |

这些改进带来：
- **更相关** 的 facts 注入
- **更高效** 的 token 预算利用
- **更少幻觉**（上下文更聚焦）
- **更高质量** 的 agent 响应
