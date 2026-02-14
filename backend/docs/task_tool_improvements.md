# Task 工具改进

## 概览

task 工具已优化，以消除低效的 LLM 轮询。此前使用后台任务时，LLM 需要反复调用 `task_status` 轮询完成状态，产生了不必要的 API 请求。

## 变更内容

### 1. 移除 `run_in_background` 参数

`task` 工具已移除 `run_in_background` 参数。现在所有 subagent 任务默认异步执行，但工具会自动处理完成等待。

**Before:**
```python
# 过去需要 LLM 自己管理轮询
task_id = task(
    subagent_type="bash",
    prompt="Run tests",
    description="Run tests",
    run_in_background=True
)
# 然后 LLM 反复轮询：
while True:
    status = task_status(task_id)
    if completed:
        break
```

**After:**
```python
# 工具会阻塞至完成，轮询在后端进行
result = task(
    subagent_type="bash",
    prompt="Run tests",
    description="Run tests"
)
# 调用返回后可直接拿到结果
```

### 2. 后端轮询

`task_tool` 现在会：
- 异步启动 subagent 任务
- 在后端轮询完成状态（每 2 秒）
- 在任务完成前阻塞工具调用
- 直接返回最终结果

这意味着：
- ✅ LLM 只需一次工具调用
- ✅ 不再有低效的 LLM 轮询请求
- ✅ 状态检查全部由后端处理
- ✅ 具备超时保护（最多 5 分钟）

### 3. 从 LLM 工具集中移除 `task_status`

`task_status_tool` 不再暴露给 LLM。代码中仍保留该能力，供内部或调试使用，但 LLM 不能直接调用。

### 4. 文档更新

- 更新 `prompt.py` 中的 `SUBAGENT_SECTION`，移除后台任务与轮询相关描述
- 简化使用示例
- 明确说明工具会自动等待任务完成

## 实现细节

### 轮询逻辑

位置：`src/tools/builtins/task_tool.py`

```python
# 启动后台执行
task_id = executor.execute_async(prompt)

# 在后端轮询任务完成状态
while True:
    result = get_background_task_result(task_id)

    # 检查任务是否完成或失败
    if result.status == SubagentStatus.COMPLETED:
        return f"[Subagent: {subagent_type}]\n\n{result.result}"
    elif result.status == SubagentStatus.FAILED:
        return f"[Subagent: {subagent_type}] Task failed: {result.error}"

    # 下一次轮询前等待
    time.sleep(2)

    # 超时保护（5 分钟）
    if poll_count > 150:
        return "Task timed out after 5 minutes"
```

### 执行超时

除了轮询超时外，subagent 执行本身也新增了内置超时机制：

**配置**（`src/subagents/config.py`）：
```python
@dataclass
class SubagentConfig:
    # ...
    timeout_seconds: int = 300  # 默认 5 分钟
```

**线程池架构**：

为避免嵌套线程池与资源浪费，采用两个独立线程池：

1. **调度线程池**（`_scheduler_pool`）：
    - 最大工作线程：4
    - 用途：编排后台任务执行
    - 运行 `run_task()` 负责管理任务生命周期

2. **执行线程池**（`_execution_pool`）：
    - 最大工作线程：8（更大以避免阻塞）
    - 用途：实际执行 subagent 并支持超时
    - 运行 `execute()` 调用 agent

**工作方式**：
```python
# 在 execute_async() 中：
_scheduler_pool.submit(run_task)  # Submit orchestration task

# 在 run_task() 中：
future = _execution_pool.submit(self.execute, task)  # Submit execution
exec_result = future.result(timeout=timeout_seconds)  # Wait with timeout
```

**收益**：
- ✅ 职责分离清晰（调度 vs 执行）
- ✅ 无嵌套线程池
- ✅ 在正确层级执行超时控制
- ✅ 资源利用率更高

**双层超时保护**：
1. **执行超时**：subagent 执行本身有 5 分钟超时（可在 `SubagentConfig` 配置）
2. **轮询超时**：工具轮询也有 5 分钟超时（30 次轮询 × 10 秒）

即便 subagent 执行卡住，系统也不会无限等待。

### 整体收益

1. **降低 API 成本**：不再需要重复轮询请求
2. **更简单的使用方式**：LLM 无需编写轮询逻辑
3. **更高可靠性**：后端统一处理状态检查
4. **超时保护完善**：双层超时防止无限等待（执行 + 轮询）

## 测试

可通过以下方式验证改动：

1. 启动一个耗时数秒的 subagent 任务
2. 验证工具调用会阻塞直到完成
3. 验证结果会直接返回
4. 验证不会再出现 `task_status` 调用

示例测试场景：
```python
# 预期阻塞约 10 秒后返回结果
result = task(
    subagent_type="bash",
    prompt="sleep 10 && echo 'Done'",
    description="Test task"
)
# result 应包含 "Done"
```

## 迁移说明

对于之前使用 `run_in_background=True` 的代码：
- 直接删除该参数
- 删除手动轮询逻辑
- 工具会自动等待任务完成

除此之外无需其他改动。除移除该参数外，API 兼容性保持不变。
