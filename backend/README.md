# DeerFlow 后端

DeerFlow 是一个基于 LangGraph 的 AI 超级 Agent，具备沙箱执行、持久化记忆与可扩展工具集成能力。后端使 AI Agent 能在按线程隔离的环境中执行代码、浏览网页、管理文件、将任务委托给子代理，并跨对话保留上下文。

---

## 架构

```
                        ┌──────────────────────────────────────┐
                        │          Nginx（端口 2026）           │
                        │           统一反向代理               │
                        └───────┬──────────────────┬───────────┘
                                │                  │
              /api/langgraph/*  │                  │  /api/*（其他）
                                ▼                  ▼
               ┌────────────────────┐  ┌────────────────────────┐
               │ LangGraph Server   │  │   Gateway API（8001）   │
               │    （端口 2024）    │  │   FastAPI REST         │
               │                    │  │                        │
               │ ┌────────────────┐ │  │ Models、MCP、Skills、  │
               │ │  Lead Agent    │ │  │ Memory、Uploads、      │
               │ │  ┌──────────┐  │ │  │ Artifacts              │
               │ │  │Middleware│  │ │  └────────────────────────┘
               │ │  │  Chain   │  │ │
               │ │  └──────────┘  │ │
               │ │  ┌──────────┐  │ │
               │ │  │  Tools   │  │ │
               │ │  └──────────┘  │ │
               │ │  ┌──────────┐  │ │
               │ │  │Subagents │  │ │
               │ │  └──────────┘  │ │
               │ └────────────────┘ │
               └────────────────────┘
```

**请求路由**（通过 Nginx）：
- `/api/langgraph/*` → LangGraph Server - Agent 交互、线程、流式输出
- `/api/*`（其他）→ Gateway API - 模型、MCP、技能、记忆、产物、上传
- `/`（非 API）→ Frontend - Next.js Web 界面

---

## 核心组件

### Lead Agent

单个 LangGraph Agent（`lead_agent`）是运行时入口，通过 `make_lead_agent(config)` 创建，整合了：

- **动态模型选择**，支持 thinking 与 vision
- **中间件链**，处理横切关注点（9 个中间件）
- **工具系统**，包含沙箱、MCP、社区工具与内置工具
- **子代理委托**，支持并行任务执行
- **系统提示词**，包含技能注入、记忆上下文与工作目录指引

### 中间件链

中间件按严格顺序执行，每个中间件负责一个明确职责：

| # | Middleware | 作用 |
|---|-----------|------|
| 1 | **ThreadDataMiddleware** | 创建按线程隔离的目录（workspace、uploads、outputs） |
| 2 | **UploadsMiddleware** | 将新上传文件注入对话上下文 |
| 3 | **SandboxMiddleware** | 获取用于代码执行的沙箱环境 |
| 4 | **SummarizationMiddleware** | 当接近 token 上限时压缩上下文（可选） |
| 5 | **TodoListMiddleware** | 在计划模式下跟踪多步骤任务（可选） |
| 6 | **TitleMiddleware** | 首轮对话后自动生成会话标题 |
| 7 | **MemoryMiddleware** | 将会话排队以执行异步记忆提取 |
| 8 | **ViewImageMiddleware** | 为支持视觉的模型注入图像数据（条件启用） |
| 9 | **ClarificationMiddleware** | 拦截澄清请求并中断执行（必须最后） |

### 沙箱系统

按线程隔离执行，并支持虚拟路径映射：

- **抽象接口**：`execute_command`、`read_file`、`write_file`、`list_dir`
- **提供者**：`LocalSandboxProvider`（文件系统）和 `AioSandboxProvider`（Docker，位于 community/）
- **虚拟路径**：`/mnt/user-data/{workspace,uploads,outputs}` → 线程专属物理目录
- **技能路径**：`/mnt/skills` → `deer-flow/skills/` 目录
- **工具**：`bash`、`ls`、`read_file`、`write_file`、`str_replace`

### 子代理系统

支持异步任务委托与并发执行：

- **内置代理**：`general-purpose`（完整工具集）与 `bash`（命令专用）
- **并发控制**：每轮最多 3 个子代理，超时 15 分钟
- **执行机制**：后台线程池 + 状态跟踪 + SSE 事件
- **执行流**：Agent 调用 `task()` → 执行器后台运行子代理 → 轮询完成状态 → 返回结果

### 记忆系统

由 LLM 驱动的跨会话持久化上下文：

- **自动提取**：分析会话中的用户背景、事实与偏好
- **结构化存储**：用户上下文（工作/个人/当前关注）、历史与置信度 facts
- **防抖更新**：批量更新以减少 LLM 调用（等待时间可配置）
- **系统提示词注入**：将高优先 facts 与上下文注入 Agent 提示词
- **存储方式**：JSON 文件 + 基于 mtime 的缓存失效

### 工具生态

| 类别 | 工具 |
|----------|-------|
| **Sandbox** | `bash`、`ls`、`read_file`、`write_file`、`str_replace` |
| **Built-in** | `present_files`、`ask_clarification`、`view_image`、`task`（子代理） |
| **Community** | Tavily（网页搜索）、Jina AI（网页抓取）、Firecrawl（爬取）、DuckDuckGo（图片搜索） |
| **MCP** | 任意 Model Context Protocol 服务器（stdio/SSE/HTTP） |
| **Skills** | 通过系统提示词注入的领域工作流 |

### Gateway API

基于 FastAPI，为前端集成提供 REST 接口：

| 路由 | 作用 |
|-------|------|
| `GET /api/models` | 列出可用 LLM 模型 |
| `GET/PUT /api/mcp/config` | 管理 MCP 服务器配置 |
| `GET/PUT /api/skills` | 列出并管理技能 |
| `POST /api/skills/install` | 从 `.skill` 压缩包安装技能 |
| `GET /api/memory` | 获取记忆数据 |
| `POST /api/memory/reload` | 强制重载记忆 |
| `GET /api/memory/config` | 获取记忆配置 |
| `GET /api/memory/status` | 获取配置 + 数据状态 |
| `POST /api/threads/{id}/uploads` | 上传文件（自动将 PDF/PPT/Excel/Word 转 Markdown） |
| `GET /api/threads/{id}/uploads/list` | 列出已上传文件 |
| `GET /api/threads/{id}/artifacts/{path}` | 提供已生成产物 |

---

## 快速开始

### 前置要求

- Python 3.12+
- [uv](https://docs.astral.sh/uv/) 包管理器
- 你所选 LLM 提供方的 API Key

### 安装

```bash
cd deer-flow

# 复制配置文件
cp config.example.yaml config.yaml
cp extensions_config.example.json extensions_config.json

# 安装后端依赖
cd backend
make install
```

### 配置

编辑项目根目录的 `config.yaml`：

```yaml
models:
  - name: gpt-4o
    display_name: GPT-4o
    use: langchain_openai:ChatOpenAI
    model: gpt-4o
    api_key: $OPENAI_API_KEY
    supports_thinking: false
    supports_vision: true
```

设置 API Key：

```bash
export OPENAI_API_KEY="your-api-key-here"
```

### 运行

**完整应用**（在项目根目录）：

```bash
make dev  # 启动 LangGraph + Gateway + Frontend + Nginx
```

访问地址：http://localhost:2026

**仅后端**（在 backend 目录）：

```bash
# 终端 1：LangGraph 服务
make dev

# 终端 2：Gateway API
make gateway
```

直连地址：LangGraph 为 http://localhost:2024，Gateway 为 http://localhost:8001

---

## 项目结构

```text
backend/
├── src/
│   ├── agents/                  # Agent 系统
│   │   ├── lead_agent/         # 主 Agent（工厂、提示词）
│   │   ├── middlewares/        # 9 个中间件组件
│   │   ├── memory/             # 记忆提取与存储
│   │   └── thread_state.py    # ThreadState 定义
│   ├── gateway/                # FastAPI Gateway API
│   │   ├── app.py             # 应用入口
│   │   └── routers/           # 6 个路由模块
│   ├── sandbox/                # 沙箱执行
│   │   ├── local/             # 本地文件系统提供者
│   │   ├── sandbox.py         # 抽象接口
│   │   ├── tools.py           # bash、ls、读写/替换工具
│   │   └── middleware.py      # 沙箱生命周期
│   ├── subagents/              # 子代理委托
│   │   ├── builtins/          # general-purpose、bash 子代理
│   │   ├── executor.py        # 后台执行引擎
│   │   └── registry.py        # 代理注册表
│   ├── tools/builtins/         # 内置工具
│   ├── mcp/                    # MCP 协议集成
│   ├── models/                 # 模型工厂
│   ├── skills/                 # 技能发现与加载
│   ├── config/                 # 配置系统
│   ├── community/              # 社区工具与提供者
│   ├── reflection/             # 动态模块加载
│   └── utils/                  # 工具函数
├── docs/                       # 文档
├── tests/                      # 测试
├── langgraph.json              # LangGraph 服务配置
├── pyproject.toml              # Python 依赖
├── Makefile                    # 开发命令
└── Dockerfile                  # 容器构建
```

---

## 配置

### 主配置（`config.yaml`）

放置于项目根目录。以 `$` 开头的配置值会解析为环境变量。

关键配置段：
- `models` - LLM 配置（类路径、API Key、thinking/vision 开关）
- `tools` - 工具定义（模块路径与分组）
- `tool_groups` - 工具逻辑分组
- `sandbox` - 执行环境提供者
- `skills` - 技能目录路径
- `title` - 自动标题生成配置
- `summarization` - 上下文摘要配置
- `subagents` - 子代理系统（启用/禁用）
- `memory` - 记忆系统配置（启用、存储、防抖、facts 限制）

### 扩展配置（`extensions_config.json`）

在单一文件中管理 MCP 服务器与技能启用状态：

```json
{
  "mcpServers": {
    "github": {
      "enabled": true,
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {"GITHUB_TOKEN": "$GITHUB_TOKEN"}
    }
  },
  "skills": {
    "pdf-processing": {"enabled": true}
  }
}
```

### 环境变量

- `DEER_FLOW_CONFIG_PATH` - 覆盖 `config.yaml` 路径
- `DEER_FLOW_EXTENSIONS_CONFIG_PATH` - 覆盖 `extensions_config.json` 路径
- 模型 API Key：`OPENAI_API_KEY`、`ANTHROPIC_API_KEY`、`DEEPSEEK_API_KEY` 等
- 工具 API Key：`TAVILY_API_KEY`、`GITHUB_TOKEN` 等

---

## 开发

### 常用命令

```bash
make install    # 安装依赖
make dev        # 运行 LangGraph 服务（端口 2024）
make gateway    # 运行 Gateway API（端口 8001）
make lint       # 运行 linter（ruff）
make format     # 格式化代码（ruff）
```

### 代码风格

- **Linter/Formatter**：`ruff`
- **行长度**：240 字符
- **Python**：3.12+，并使用类型注解
- **引号**：双引号
- **缩进**：4 空格

### 测试

```bash
uv run pytest
```

---

## 技术栈

- **LangGraph**（1.0.6+）- Agent 框架与多代理编排
- **LangChain**（1.2.3+）- LLM 抽象与工具系统
- **FastAPI**（0.115.0+）- Gateway REST API
- **langchain-mcp-adapters** - Model Context Protocol 支持
- **agent-sandbox** - 沙箱代码执行
- **markitdown** - 多格式文档转换
- **tavily-python** / **firecrawl-py** - 网页搜索与抓取

---

## 文档

- [配置指南](docs/CONFIGURATION.md)
- [架构详解](docs/ARCHITECTURE.md)
- [API 参考](docs/API.md)
- [文件上传](docs/FILE_UPLOAD.md)
- [路径示例](docs/PATH_EXAMPLES.md)
- [上下文摘要](docs/summarization.md)
- [计划模式](docs/plan_mode_usage.md)
- [安装指南](docs/SETUP.md)

---

## 许可证

请参见项目根目录的 [LICENSE](../LICENSE) 文件。

## 贡献

贡献规范请参见 [CONTRIBUTING.md](CONTRIBUTING.md)。
