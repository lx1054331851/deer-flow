# 参与 DeerFlow Backend 贡献

感谢你对 DeerFlow 贡献的关注！本文档提供后端代码库的贡献指南与开发说明。

## 目录

- [开始之前](#开始之前)
- [开发环境搭建](#开发环境搭建)
- [项目结构](#项目结构)
- [代码风格](#代码风格)
- [进行代码修改](#进行代码修改)
- [测试](#测试)
- [Pull Request 流程](#pull-request-流程)
- [架构开发指南](#架构开发指南)

## 开始之前

### 前置要求

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) 包管理器
- Git
- Docker（可选，用于 Docker 沙箱测试）

### Fork 与 Clone

1. 在 GitHub 上 Fork 本仓库
2. 在本地 Clone 你的 Fork：
   ```bash
   git clone https://github.com/YOUR_USERNAME/deer-flow.git
   cd deer-flow
   ```

## 开发环境搭建

### 安装依赖

```bash
# 在项目根目录
cp config.example.yaml config.yaml

# 安装后端依赖
cd backend
make install
```

### 配置环境

设置用于测试的 API Key：

```bash
export OPENAI_API_KEY="your-api-key"
# 按需添加其他 key
```

### 运行开发服务

```bash
# 终端 1：LangGraph 服务
make dev

# 终端 2：Gateway API
make gateway
```

## 项目结构

```text
backend/src/
├── agents/                  # Agent 系统
│   ├── lead_agent/         # 主 Agent 实现
│   │   └── agent.py        # Agent 工厂与创建逻辑
│   ├── middlewares/        # Agent 中间件
│   │   ├── thread_data_middleware.py
│   │   ├── sandbox_middleware.py
│   │   ├── title_middleware.py
│   │   ├── uploads_middleware.py
│   │   ├── view_image_middleware.py
│   │   └── clarification_middleware.py
│   └── thread_state.py     # Thread 状态定义
│
├── gateway/                 # FastAPI Gateway
│   ├── app.py              # FastAPI 应用入口
│   └── routers/            # 路由处理器
│       ├── models.py       # /api/models 端点
│       ├── mcp.py          # /api/mcp 端点
│       ├── skills.py       # /api/skills 端点
│       ├── artifacts.py    # /api/threads/.../artifacts
│       └── uploads.py      # /api/threads/.../uploads
│
├── sandbox/                 # 沙箱执行
│   ├── __init__.py         # 沙箱接口
│   ├── local.py            # 本地沙箱提供者
│   └── tools.py            # 沙箱工具（bash、文件操作）
│
├── tools/                   # Agent 工具
│   └── builtins/           # 内置工具
│       ├── present_file_tool.py
│       ├── ask_clarification_tool.py
│       └── view_image_tool.py
│
├── mcp/                     # MCP 集成
│   └── manager.py          # MCP 服务器管理
│
├── models/                  # 模型系统
│   └── factory.py          # 模型工厂
│
├── skills/                  # 技能系统
│   └── loader.py           # 技能加载器
│
├── config/                  # 配置系统
│   ├── app_config.py       # 主应用配置
│   ├── extensions_config.py # 扩展配置
│   └── summarization_config.py
│
├── community/               # 社区工具
│   ├── tavily/             # Tavily 网页搜索
│   ├── jina/               # Jina 网页抓取
│   ├── firecrawl/          # Firecrawl 爬取
│   └── aio_sandbox/        # Docker 沙箱
│
├── reflection/              # 动态加载
│   └── __init__.py         # 模块解析
│
└── utils/                   # 工具函数
    └── __init__.py
```

## 代码风格

### Lint 与格式化

我们使用 `ruff` 同时执行 lint 与格式化：

```bash
# 检查问题
make lint

# 自动修复并格式化
make format
```

### 风格规范

- **行长度**：最多 240 字符
- **Python 版本**：允许使用 3.12+ 特性
- **类型注解**：函数签名应带类型注解
- **引号**：字符串使用双引号
- **缩进**：4 空格（不使用 tab）
- **导入顺序**：标准库、第三方、本地模块分组

### Docstring

公开函数与类请编写 docstring：

```python
def create_chat_model(name: str, thinking_enabled: bool = False) -> BaseChatModel:
    """Create a chat model instance from configuration.

    Args:
        name: The model name as defined in config.yaml
        thinking_enabled: Whether to enable extended thinking

    Returns:
        A configured LangChain chat model instance

    Raises:
        ValueError: If the model name is not found in configuration
    """
    ...
```

## 进行代码修改

### 分支命名

使用有语义的分支名：

- `feature/add-new-tool` - 新功能
- `fix/sandbox-timeout` - 问题修复
- `docs/update-readme` - 文档更新
- `refactor/config-system` - 代码重构

### 提交信息

编写清晰简洁的提交信息：

```text
feat: add support for Claude 3.5 model

- Add model configuration in config.yaml
- Update model factory to handle Claude-specific settings
- Add tests for new model
```

前缀约定：
- `feat:` - 新功能
- `fix:` - 缺陷修复
- `docs:` - 文档
- `refactor:` - 重构
- `test:` - 测试
- `chore:` - 构建/配置类变更

## 测试

### 运行测试

```bash
uv run pytest
```

### 编写测试

请在 `tests/` 下按源代码结构对应放置测试：

```text
tests/
├── test_models/
│   └── test_factory.py
├── test_sandbox/
│   └── test_local.py
└── test_gateway/
    └── test_models_router.py
```

示例：

```python
import pytest
from src.models.factory import create_chat_model

def test_create_chat_model_with_valid_name():
    """Test that a valid model name creates a model instance."""
    model = create_chat_model("gpt-4")
    assert model is not None

def test_create_chat_model_with_invalid_name():
    """Test that an invalid model name raises ValueError."""
    with pytest.raises(ValueError):
        create_chat_model("nonexistent-model")
```

## Pull Request 流程

### 提交前检查

1. **确保测试通过**：`uv run pytest`
2. **运行 linter**：`make lint`
3. **格式化代码**：`make format`
4. **必要时更新文档**

### PR 描述建议

建议在 PR 描述中包含：

- **What**：改动内容
- **Why**：改动动机
- **How**：实现方式
- **Testing**：测试方法与结果

### Review 流程

1. 提交清晰描述的 PR
2. 响应并处理 Review 反馈
3. 确保 CI 通过
4. 维护者审核通过后合并

## 架构开发指南

### 新增工具

1. 在 `src/tools/builtins/` 或 `src/community/` 创建工具：

```python
# src/tools/builtins/my_tool.py
from langchain_core.tools import tool

@tool
def my_tool(param: str) -> str:
    """Tool description for the agent.

    Args:
        param: Description of the parameter

    Returns:
        Description of return value
    """
    return f"Result: {param}"
```

2. 在 `config.yaml` 中注册：

```yaml
tools:
  - name: my_tool
    group: my_group
    use: src.tools.builtins.my_tool:my_tool
```

### 新增中间件

1. 在 `src/agents/middlewares/` 创建中间件：

```python
# src/agents/middlewares/my_middleware.py
from langchain.agents.middleware import BaseMiddleware
from langchain_core.runnables import RunnableConfig

class MyMiddleware(BaseMiddleware):
    """Middleware description."""

    def transform_state(self, state: dict, config: RunnableConfig) -> dict:
        """Transform the state before agent execution."""
        # Modify state as needed
        return state
```

2. 在 `src/agents/lead_agent/agent.py` 中注册：

```python
middlewares = [
    ThreadDataMiddleware(),
    SandboxMiddleware(),
    MyMiddleware(),  # Add your middleware
    TitleMiddleware(),
    ClarificationMiddleware(),
]
```

### 新增 API 端点

1. 在 `src/gateway/routers/` 创建路由：

```python
# src/gateway/routers/my_router.py
from fastapi import APIRouter

router = APIRouter(prefix="/my-endpoint", tags=["my-endpoint"])

@router.get("/")
async def get_items():
    """Get all items."""
    return {"items": []}

@router.post("/")
async def create_item(data: dict):
    """Create a new item."""
    return {"created": data}
```

2. 在 `src/gateway/app.py` 中注册：

```python
from src.gateway.routers import my_router

app.include_router(my_router.router)
```

### 配置项变更

新增配置项时请同步更新：

1. `src/config/app_config.py` 中新增字段
2. `config.example.yaml` 中增加默认值
3. `docs/CONFIGURATION.md` 中补充文档

### MCP 服务器集成

新增 MCP 服务器支持时：

1. 在 `extensions_config.json` 添加配置：

```json
{
  "mcpServers": {
    "my-server": {
      "enabled": true,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@my-org/mcp-server"],
      "description": "My MCP Server"
    }
  }
}
```

2. 在 `extensions_config.example.json` 中同步该服务器配置

### Skills 开发

创建新技能时：

1. 在 `skills/public/` 或 `skills/custom/` 创建目录：

```text
skills/public/my-skill/
└── SKILL.md
```

2. 在 `SKILL.md` 中编写 YAML front matter：

```markdown
---
name: My Skill
description: What this skill does
license: MIT
allowed-tools:
  - read_file
  - write_file
  - bash
---

# My Skill

Instructions for the agent when this skill is enabled...
```

## 有问题？

如果你对贡献流程有疑问：

1. 先查看 `docs/` 里的现有文档
2. 在 GitHub 查找相关 issue 或 PR
3. 在 GitHub 发起 discussion 或 issue

感谢你为 DeerFlow 做出贡献！
