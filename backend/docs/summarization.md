# 对话摘要

DeerFlow 提供自动对话摘要能力，用于处理接近模型 token 上限的长对话。启用后，系统会在保留近期上下文的同时自动压缩较早消息。

## 概览

摘要功能使用 LangChain 的 `SummarizationMiddleware` 监控对话历史，并在达到可配置阈值时触发摘要。触发后会：

1. 实时监控消息 token 数
2. 达到阈值时触发摘要
3. 保留近期消息，压缩较早轮次
4. 保持 AI/Tool 消息对的连续性
5. 将摘要重新注入对话上下文

## 配置

在 `config.yaml` 的 `summarization` 节下配置摘要：

```yaml
summarization:
  enabled: true
  model_name: null  # 使用默认模型，或指定轻量模型

  # 触发条件（OR 逻辑：任一条件满足即触发）
  trigger:
    - type: tokens
      value: 4000
    # 其他触发条件（可选）
    # - type: messages
    #   value: 50
    # - type: fraction
    #   value: 0.8  # 模型最大输入 token 的 80%

  # 上下文保留策略
  keep:
    type: messages
    value: 20

  # 摘要调用前的 token 裁剪
  trim_tokens_to_summarize: 4000

  # 自定义摘要提示词（可选）
  summary_prompt: null
```

### 配置项说明

#### `enabled`
- **类型**：Boolean
- **默认值**：`false`
- **说明**：启用或禁用自动摘要

#### `model_name`
- **类型**：String 或 null
- **默认值**：`null`（使用默认模型）
- **说明**：用于生成摘要的模型。建议使用轻量、低成本模型，例如 `gpt-4o-mini` 或同级模型。

#### `trigger`
- **类型**：单个 `ContextSize` 或 `ContextSize` 列表
- **必填**：启用时至少指定一个触发条件
- **说明**：触发摘要的阈值，采用 OR 逻辑（任一条件满足即执行摘要）

**ContextSize 类型：**

1. **基于 token 的触发**：token 数达到指定值时触发
   ```yaml
   trigger:
     type: tokens
     value: 4000
   ```

2. **基于消息数的触发**：消息数达到指定值时触发
   ```yaml
   trigger:
     type: messages
     value: 50
   ```

3. **基于比例的触发**：token 使用量达到模型最大输入 token 的指定比例时触发
   ```yaml
   trigger:
     type: fraction
    value: 0.8  # 最大输入 token 的 80%
   ```

  **多触发条件示例：**
```yaml
trigger:
  - type: tokens
    value: 4000
  - type: messages
    value: 50
```

#### `keep`
- **类型**：`ContextSize` 对象
- **默认值**：`{type: messages, value: 20}`
- **说明**：指定摘要后保留多少近期对话历史。

**示例：**
```yaml
# 保留最近 20 条消息
keep:
  type: messages
  value: 20

# 保留最近 3000 token
keep:
  type: tokens
  value: 3000

# 保留模型最大输入 token 的最近 30%
keep:
  type: fraction
  value: 0.3
```

#### `trim_tokens_to_summarize`
- **类型**：Integer 或 null
- **默认值**：`4000`
- **说明**：为“摘要调用本身”准备上下文时可包含的最大 token 数。设为 `null` 表示不裁剪（不建议用于超长对话）。

#### `summary_prompt`
- **类型**：String 或 null
- **默认值**：`null`（使用 LangChain 默认提示词）
- **说明**：用于生成摘要的自定义提示词模板。应引导模型提取最重要上下文。

**默认提示词行为：**
LangChain 默认提示词会要求模型：
- 提取质量最高、最相关的上下文
- 聚焦对整体目标最关键的信息
- 避免重复已完成操作
- 仅返回提取后的上下文内容

## 工作原理

### 摘要流程

1. **监控**：每次模型调用前，中间件统计历史消息 token
2. **触发判断**：任一配置阈值满足则触发摘要
3. **消息分区**：消息被拆分为：
  - 需摘要部分（超出 `keep` 阈值的旧消息）
  - 需保留部分（`keep` 阈值内的近期消息）
4. **生成摘要**：模型对旧消息生成精简摘要
5. **替换上下文**：更新消息历史：
  - 移除旧消息
  - 添加一条摘要消息
  - 保留近期消息
6. **AI/Tool 对保护**：确保 AI 消息与对应 tool 消息不被拆开

### Token 计数

- 使用基于字符数的近似 token 估算
- Anthropic 模型按约 3.3 字符/token 估算
- 其他模型使用 LangChain 默认估算方式
- 可通过自定义 `token_counter` 函数替换

### 消息保留策略

中间件会智能保留上下文：

- **近期消息**：按 `keep` 配置完整保留
- **AI/Tool 消息对**：绝不拆分；若切分点落在工具消息中，系统会自动调整，保留完整的 AI + Tool 序列
- **摘要注入格式**：摘要以 HumanMessage 注入，格式如下：
  ```
  Here is a summary of the conversation to date:

  [Generated summary text]
  ```

## 最佳实践

### 触发阈值选择

1. **基于 token 的触发**：适用于大多数场景
  - 建议设置为模型上下文窗口的 60%~80%
  - 例如：8K 上下文可设 4000~6000 token

2. **基于消息数的触发**：适合控制会话长度
  - 适用于短消息较多的应用
  - 例如：根据平均消息长度设置 50~100 条

3. **基于比例的触发**：适用于多模型场景
  - 会自动适配各模型容量
  - 例如：0.8（模型最大输入 token 的 80%）

### 保留策略（`keep`）选择

1. **按消息数保留**：适用于大多数场景
  - 保留自然对话流
  - 推荐：15~25 条消息

2. **按 token 保留**：需要精确控制时使用
  - 便于严格管理 token 预算
  - 推荐：2000~4000 token

3. **按比例保留**：适用于多模型部署
  - 自动随模型容量缩放
  - 推荐：0.2~0.4（最大输入的 20%~40%）

### 模型选择

- **推荐**：摘要使用轻量、低成本模型
  - 例如：`gpt-4o-mini`、`claude-haiku` 或同级模型
  - 摘要任务通常不需要最强模型
  - 在高调用量场景能显著节省成本

- **默认行为**：若 `model_name` 为 `null`，使用默认模型
  - 成本可能更高，但一致性更强
  - 适合简单配置场景

### 优化建议

1. **组合触发条件**：token + 消息数组合更稳健
   ```yaml
   trigger:
     - type: tokens
       value: 4000
     - type: messages
       value: 50
   ```

2. **保守保留策略**：先多保留，再按效果下调
   ```yaml
   keep:
     type: messages
    value: 25  # 先设高一些，再按需降低
   ```

3. **合理裁剪**：限制发送给摘要模型的 token 数
   ```yaml
  trim_tokens_to_summarize: 4000  # 避免摘要调用过于昂贵
   ```

4. **持续观测迭代**：跟踪摘要质量并动态调参

## 故障排查

### 摘要质量问题

**问题**：摘要丢失关键信息

**解决方案**：
1. 提高 `keep`，保留更多原始消息
2. 降低触发阈值，提前摘要
3. 自定义 `summary_prompt`，强调关键点
4. 使用更强的摘要模型

### 性能问题

**问题**：摘要调用耗时过长

**解决方案**：
1. 使用更快的摘要模型（如 `gpt-4o-mini`）
2. 降低 `trim_tokens_to_summarize`，减少输入上下文
3. 提高触发阈值，降低摘要频率

### Token 超限问题

**问题**：启用摘要后仍出现 token 超限

**解决方案**：
1. 降低触发阈值，提前摘要
2. 降低 `keep`，减少保留消息
3. 检查是否存在超长单条消息
4. 考虑使用比例触发（fraction）

## 实现细节

### 代码结构

- **配置定义**：`src/config/summarization_config.py`
- **集成入口**：`src/agents/lead_agent/agent.py`
- **中间件实现**：使用 `langchain.agents.middleware.SummarizationMiddleware`

### 中间件顺序

Summarization 在 ThreadData、Sandbox 初始化之后，Title 和 Clarification 之前执行：

1. ThreadDataMiddleware
2. SandboxMiddleware
3. **SummarizationMiddleware** ← 在这里执行
4. TitleMiddleware
5. ClarificationMiddleware

### 状态管理

- 摘要逻辑本身无状态：配置在启动时加载一次
- 摘要会作为普通消息写入对话历史
- checkpointer 会自动持久化摘要后的历史

## 配置示例

### 最小配置
```yaml
summarization:
  enabled: true
  trigger:
    type: tokens
    value: 4000
  keep:
    type: messages
    value: 20
```

### 生产配置
```yaml
summarization:
  enabled: true
  model_name: gpt-4o-mini  # 轻量模型，降低成本
  trigger:
    - type: tokens
      value: 6000
    - type: messages
      value: 75
  keep:
    type: messages
    value: 25
  trim_tokens_to_summarize: 5000
```

### 多模型配置
```yaml
summarization:
  enabled: true
  model_name: gpt-4o-mini
  trigger:
    type: fraction
    value: 0.7  # 模型最大输入的 70%
  keep:
    type: fraction
    value: 0.3  # 保留最大输入的 30%
  trim_tokens_to_summarize: 4000
```

### 保守配置（高质量优先）
```yaml
summarization:
  enabled: true
  model_name: gpt-4  # 使用更强模型以获得更高质量摘要
  trigger:
    type: tokens
    value: 8000
  keep:
    type: messages
    value: 40  # 保留更多上下文
  trim_tokens_to_summarize: null  # 不裁剪
```

## 参考资料

- [LangChain Summarization Middleware Documentation](https://docs.langchain.com/oss/python/langchain/middleware/built-in#summarization)
- [LangChain Source Code](https://github.com/langchain-ai/langchain)
