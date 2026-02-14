# TodoList 中间件计划模式

本文档说明如何在 DeerFlow 2.0 中启用并使用基于 TodoList 中间件的 Plan Mode 功能。

## 概览

Plan Mode 会为 Agent 增加 TodoList 中间件，提供 `write_todos` 工具，帮助 Agent：
- 将复杂任务拆解为更小、可执行的步骤
- 在执行过程中跟踪进度
- 向用户展示当前正在做什么

TodoList 中间件基于 LangChain 的 `TodoListMiddleware` 实现。

## 配置

### 启用 Plan Mode

Plan mode 通过**运行时配置**控制：在 `RunnableConfig` 的 `configurable` 中设置 `is_plan_mode`。这样可以按请求动态开启或关闭 plan mode。

```python
from langchain_core.runnables import RunnableConfig
from src.agents.lead_agent.agent import make_lead_agent

# 通过运行时配置启用 plan mode
config = RunnableConfig(
    configurable={
        "thread_id": "example-thread",
        "thinking_enabled": True,
        "is_plan_mode": True,  # 启用 plan mode
    }
)

    # 创建启用 plan mode 的 agent
agent = make_lead_agent(config)
```

    ### 配置项

- **is_plan_mode**（bool）：是否启用含 TodoList 中间件的 plan mode。默认：`False`
    - 通过 `config.get("configurable", {}).get("is_plan_mode", False)` 读取
    - 可按每次 agent 调用动态设置
    - 不需要全局配置

## 默认行为

当以默认设置启用 plan mode 时，agent 将获得 `write_todos` 工具，行为如下：

### 何时使用 TodoList

Agent 会在以下场景使用 todo list：
1. 复杂多步骤任务（3+ 个明确步骤）
2. 需要仔细规划的非简单任务
3. 用户明确要求使用 todo list
4. 用户一次提出多个任务

### 何时不使用 TodoList

以下场景通常不使用 todo list：
1. 单一且直接的任务
2. 过于简单的任务（< 3 步）
3. 纯对话或纯信息问答请求

### 任务状态

- **pending**：尚未开始
- **in_progress**：正在进行（可并行多个）
- **completed**：已完成

## 使用示例

### 基础用法

```python
from langchain_core.runnables import RunnableConfig
from src.agents.lead_agent.agent import make_lead_agent

# 创建启用 plan mode 的 agent
config_with_plan_mode = RunnableConfig(
    configurable={
        "thread_id": "example-thread",
        "thinking_enabled": True,
        "is_plan_mode": True,  # 将添加 TodoList 中间件
    }
)
agent_with_todos = make_lead_agent(config_with_plan_mode)

    # 创建禁用 plan mode 的 agent（默认）
config_without_plan_mode = RunnableConfig(
    configurable={
        "thread_id": "another-thread",
        "thinking_enabled": True,
        "is_plan_mode": False,  # 不添加 TodoList 中间件
    }
)
agent_without_todos = make_lead_agent(config_without_plan_mode)
```

    ### 按请求动态启用 Plan Mode

你可以针对不同会话或任务动态开启/关闭 plan mode：

```python
from langchain_core.runnables import RunnableConfig
from src.agents.lead_agent.agent import make_lead_agent

def create_agent_for_task(task_complexity: str):
    """根据任务复杂度创建是否启用 plan mode 的 agent。"""
    is_complex = task_complexity in ["high", "very_high"]

    config = RunnableConfig(
        configurable={
            "thread_id": f"task-{task_complexity}",
            "thinking_enabled": True,
            "is_plan_mode": is_complex,  # 仅复杂任务启用
        }
    )

    return make_lead_agent(config)

# 简单任务 - 无需 TodoList
simple_agent = create_agent_for_task("low")

# 复杂任务 - 启用 TodoList 便于跟踪
complex_agent = create_agent_for_task("high")
```

## 工作机制

1. 调用 `make_lead_agent(config)` 时，从 `config.configurable` 读取 `is_plan_mode`
2. 配置传入 `_build_middlewares(config)`
3. `_build_middlewares()` 读取 `is_plan_mode` 并调用 `_create_todo_list_middleware(is_plan_mode)`
4. 若 `is_plan_mode=True`，创建 `TodoListMiddleware` 并加入中间件链
5. 中间件自动向 agent 工具集中添加 `write_todos`
6. agent 在执行中可调用该工具管理任务
7. 中间件负责维护 todo 状态并提供给 agent

## 架构

```
make_lead_agent(config)
  │
    ├─> 读取: is_plan_mode = config.configurable.get("is_plan_mode", False)
  │
  └─> _build_middlewares(config)
        │
        ├─> ThreadDataMiddleware
        ├─> SandboxMiddleware
        ├─> SummarizationMiddleware（全局配置启用时）
        ├─> TodoListMiddleware（is_plan_mode=True 时）← 新增
        ├─> TitleMiddleware
        └─> ClarificationMiddleware
```

    ## 实现细节

### Agent 模块
- **位置**：`src/agents/lead_agent/agent.py`
- **函数**：`_create_todo_list_middleware(is_plan_mode: bool)` - 在启用 plan mode 时创建 TodoListMiddleware
- **函数**：`_build_middlewares(config: RunnableConfig)` - 根据运行时配置构建中间件链
- **函数**：`make_lead_agent(config: RunnableConfig)` - 用相应中间件创建 agent

### 运行时配置
Plan mode 通过 `RunnableConfig.configurable` 中的 `is_plan_mode` 控制：
```python
config = RunnableConfig(
    configurable={
        "is_plan_mode": True,  # 启用 plan mode
        # ... 其他可配置项
    }
)
```

    ## 关键收益

1. **动态控制**：无需全局状态即可按请求启停 plan mode
2. **灵活性**：不同会话可采用不同 plan mode 策略
3. **简单性**：不需要额外的全局配置管理
4. **上下文感知**：可按任务复杂度、用户偏好等决定是否启用

## 自定义提示词

DeerFlow 为 TodoListMiddleware 使用自定义 `system_prompt` 与 `tool_description`，与整体提示词风格保持一致：

### System Prompt 特点
- 使用 XML 标签（`<todo_list_system>`），与 DeerFlow 主提示词结构一致
- 强调关键规则与最佳实践
- 明确区分“何时使用”与“何时不使用”
- 强调实时更新与及时完成

### Tool Description 特点
- 详细场景说明与示例
- 强调简单任务不应使用
- 明确任务状态定义（pending、in_progress、completed）
- 完整最佳实践说明
- 对“完成”判定设定明确要求，避免过早标记

自定义提示词定义在 `_create_todo_list_middleware()` 中，位置：`/Users/hetao/workspace/deer-flow/backend/src/agents/lead_agent/agent.py:57`。

## 备注

- TodoList 中间件基于 LangChain 内置 `TodoListMiddleware`，并使用**DeerFlow 风格自定义提示词**
- Plan mode **默认关闭**（`is_plan_mode=False`），以保持向后兼容
- 该中间件位于 `ClarificationMiddleware` 之前，便于在澄清流程中管理 todo
- 自定义提示词遵循 DeerFlow 主系统提示词原则（清晰、行动导向、关键规则）
