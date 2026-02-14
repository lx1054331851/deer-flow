# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在本仓库工作时提供开发指引。

## 项目概览

DeerFlow 是一个基于 LangGraph 的 AI 超级 Agent 系统，采用全栈架构。后端提供“超级 Agent”能力：沙箱执行、持久化记忆、子代理委托与可扩展工具集成，并在按线程隔离的环境中运行。

**架构**：
- **LangGraph Server**（端口 2024）：Agent 运行时与工作流执行
- **Gateway API**（端口 8001）：模型、MCP、技能、记忆、产物、上传等 REST API
- **Frontend**（端口 3000）：Next.js Web 界面
- **Nginx**（端口 2026）：统一反向代理入口

**项目结构**：
```text
deer-flow/
├── Makefile                    # 根命令（check/install/dev/stop）
├── config.yaml                 # 主配置
├── extensions_config.json      # MCP 与 skills 配置
├── backend/                    # 后端（当前目录）
│   ├── Makefile               # 后端命令（dev/gateway/lint）
│   ├── langgraph.json         # LangGraph 配置
│   ├── src/
│   │   ├── agents/            # LangGraph agent 系统
│   │   │   ├── lead_agent/    # 主 agent（工厂 + 系统提示词）
│   │   │   ├── middlewares/   # 10+ 个中间件
│   │   │   ├── memory/        # 记忆提取、队列、提示词
│   │   │   └── thread_state.py # ThreadState 定义
│   │   ├── gateway/           # FastAPI Gateway API
│   │   │   ├── app.py         # FastAPI 应用
│   │   │   └── routers/       # 6 个路由模块
│   │   ├── sandbox/           # 沙箱执行系统
│   │   │   ├── local/         # 本地文件系统提供者
│   │   │   ├── sandbox.py     # Sandbox 抽象接口
│   │   │   ├── tools.py       # bash、ls、read/write/str_replace
│   │   │   └── middleware.py  # 沙箱生命周期管理
│   │   ├── subagents/         # 子代理委托系统
│   │   │   ├── builtins/      # general-purpose、bash 子代理
│   │   │   ├── executor.py    # 后台执行引擎
│   │   │   └── registry.py    # 代理注册表
│   │   ├── tools/builtins/    # 内置工具（present_files / ask_clarification / view_image）
│   │   ├── mcp/               # MCP 集成（tools、cache、client）
│   │   ├── models/            # 支持 thinking/vision 的模型工厂
│   │   ├── skills/            # skills 发现、加载、解析
│   │   ├── config/            # 配置系统（app/model/sandbox/tool 等）
│   │   ├── community/         # 社区工具（tavily/jina_ai/firecrawl/image_search/aio_sandbox）
│   │   ├── reflection/        # 动态模块加载（resolve_variable / resolve_class）
│   │   └── utils/             # 工具函数
│   ├── tests/                 # 测试
│   └── docs/                  # 文档
├── frontend/                   # Next.js 前端
└── skills/                     # Agent 技能目录
    ├── public/                # 公共技能（提交到仓库）
    └── custom/                # 自定义技能（gitignore）
```

## 重要开发准则

### 文档更新策略
**关键：每次代码变更后都要同步更新 README.md 与 CLAUDE.md**

发生代码改动时，必须更新相关文档：
- `README.md`：面向用户的变更（功能、安装、使用）
- `CLAUDE.md`：面向开发的变更（架构、命令、流程、内部系统）
- 确保文档始终与代码同步，内容准确及时

## 常用命令

**项目根目录**（完整应用）：
```bash
make check      # 检查系统依赖
make install    # 安装全部依赖（frontend + backend）
make dev        # 启动全部服务（LangGraph + Gateway + Frontend + Nginx）
make stop       # 停止全部服务
```

**backend 目录**（仅后端开发）：
```bash
make install    # 安装后端依赖
make dev        # 仅启动 LangGraph 服务（端口 2024）
make gateway    # 仅启动 Gateway API（端口 8001）
make lint       # ruff lint
make format     # ruff format
```

## 架构说明

### Agent 系统

**Lead Agent**（`src/agents/lead_agent/agent.py`）：
- 入口：`make_lead_agent(config: RunnableConfig)`，在 `langgraph.json` 注册
- 通过 `create_chat_model()` 动态选模，支持 thinking/vision
- 通过 `get_available_tools()` 加载工具（沙箱、内置、MCP、社区、子代理）
- 通过 `apply_prompt_template()` 生成系统提示词（skills、memory、subagent 指令）

**ThreadState**（`src/agents/thread_state.py`）：
- 在 `AgentState` 基础上扩展：`sandbox`、`thread_data`、`title`、`artifacts`、`todos`、`uploaded_files`、`viewed_images`
- 自定义 reducer：`merge_artifacts`（去重）、`merge_viewed_images`（合并/清空）

**运行时配置**（`config.configurable`）：
- `thinking_enabled`：启用模型扩展思考
- `model_name`：选择指定 LLM
- `is_plan_mode`：启用 TodoList 中间件
- `subagent_enabled`：启用任务委托工具

### 中间件链

中间件在 `src/agents/lead_agent/agent.py` 中按严格顺序执行：

1. **ThreadDataMiddleware** - 创建线程目录（`backend/.deer-flow/threads/{thread_id}/user-data/{workspace,uploads,outputs}`）
2. **UploadsMiddleware** - 跟踪并注入新上传文件
3. **SandboxMiddleware** - 获取沙箱并在 state 记录 `sandbox_id`
4. **DanglingToolCallMiddleware** - 为缺失响应的 tool_calls 注入占位 ToolMessage（如用户打断）
5. **SummarizationMiddleware** - 接近 token 限制时摘要压缩（可选）
6. **TodoListMiddleware** - 计划模式下任务跟踪（可选）
7. **TitleMiddleware** - 首轮完整交互后自动生成标题
8. **MemoryMiddleware** - 会话入队执行异步记忆更新（仅用户 + 最终 AI 回复）
9. **ViewImageMiddleware** - LLM 调用前注入 base64 图片（模型支持视觉时）
10. **SubagentLimitMiddleware** - 限制 `task` 并发调用（超限裁剪）
11. **ClarificationMiddleware** - 拦截 `ask_clarification` 并 `Command(goto=END)` 中断（必须最后）

### 配置系统

**主配置**（`config.yaml`）：

设置方式：将 `config.example.yaml` 复制到**项目根目录**为 `config.yaml`。

读取优先级：
1. 显式 `config_path`
2. 环境变量 `DEER_FLOW_CONFIG_PATH`
3. 当前目录（backend/）下 `config.yaml`
4. 父目录（项目根目录，**推荐**）下 `config.yaml`

以 `$` 开头的配置值会解析环境变量（如 `$OPENAI_API_KEY`）。

**扩展配置**（`extensions_config.json`）：

MCP 与 skills 统一放在项目根目录的 `extensions_config.json`。

读取优先级：
1. 显式 `config_path`
2. 环境变量 `DEER_FLOW_EXTENSIONS_CONFIG_PATH`
3. 当前目录（backend/）下 `extensions_config.json`
4. 父目录（项目根目录，**推荐**）下 `extensions_config.json`

### Gateway API（`src/gateway/`）

FastAPI 服务运行在 8001，健康检查 `GET /health`。

**路由**：

| Router | Endpoints |
|--------|-----------|
| **Models**（`/api/models`） | `GET /` 列表；`GET /{name}` 详情 |
| **MCP**（`/api/mcp`） | `GET /config` 获取；`PUT /config` 更新（写入 extensions_config.json） |
| **Skills**（`/api/skills`） | `GET /` 列表；`GET /{name}` 详情；`PUT /{name}` 更新 enabled；`POST /install` 安装 `.skill` |
| **Memory**（`/api/memory`） | `GET /` 数据；`POST /reload` 重载；`GET /config` 配置；`GET /status` 配置+数据 |
| **Uploads**（`/api/threads/{id}/uploads`） | `POST /` 上传（自动转 PDF/PPT/Excel/Word）；`GET /list` 列表；`DELETE /{filename}` 删除 |
| **Artifacts**（`/api/threads/{id}/artifacts`） | `GET /{path}` 访问产物；`?download=true` 下载 |

Nginx 代理规则：`/api/langgraph/*` → LangGraph，其余 `/api/*` → Gateway。

### 沙箱系统（`src/sandbox/`）

**接口**：抽象 `Sandbox`（`execute_command`、`read_file`、`write_file`、`list_dir`）
**Provider 模式**：`SandboxProvider`（`acquire/get/release` 生命周期）
**实现**：
- `LocalSandboxProvider` - 本地文件系统执行（单例）
- `AioSandboxProvider`（`src/community/`）- Docker 隔离执行

**虚拟路径系统**：
- Agent 可见：`/mnt/user-data/{workspace,uploads,outputs}`、`/mnt/skills`
- 物理路径：`backend/.deer-flow/threads/{thread_id}/user-data/...`、`deer-flow/skills/`
- 路径替换：`replace_virtual_path()` / `replace_virtual_paths_in_command()`
- 本地沙箱判断：`is_local_sandbox()`（`sandbox_id == "local"`）

**沙箱工具**（`src/sandbox/tools.py`）：
- `bash`：命令执行（带路径替换与错误处理）
- `ls`：目录树（最多 2 层）
- `read_file`：读文件（可选行区间）
- `write_file`：写入/追加（自动建目录）
- `str_replace`：字符串替换（单次或全部）

### 子代理系统（`src/subagents/`）

**内置子代理**：`general-purpose`（除 `task` 外全部工具）与 `bash`（命令专用）
**执行线程池**：双线程池 `_scheduler_pool`（3）+ `_execution_pool`（3）
**并发限制**：`MAX_CONCURRENT_SUBAGENTS = 3`（由 `SubagentLimitMiddleware` 强制），超时 15 分钟
**流程**：`task()` → `SubagentExecutor` → 后台执行 → 5 秒轮询 → SSE 事件 → 返回
**事件**：`task_started`、`task_running`、`task_completed` / `task_failed` / `task_timed_out`

### 工具系统（`src/tools/`）

`get_available_tools(groups, include_mcp, model_name, subagent_enabled)` 组装：
1. **配置工具**：从 `config.yaml` 解析（`resolve_variable()`）
2. **MCP 工具**：来自启用的 MCP server（懒加载 + mtime 缓存失效）
3. **内置工具**：
   - `present_files` - 向用户展示输出文件（仅 `/mnt/user-data/outputs`）
   - `ask_clarification` - 请求澄清（被 ClarificationMiddleware 拦截并中断）
   - `view_image` - 读取图片为 base64（仅视觉模型启用）
4. **子代理工具**（启用时）：
   - `task` - 委托给子代理（description、prompt、subagent_type、max_turns）

**社区工具**（`src/community/`）：
- `tavily/` - 网页搜索（默认 5 条）与网页抓取（4KB 限制）
- `jina_ai/` - 基于 Jina reader API 的网页抓取与可读性提取
- `firecrawl/` - Firecrawl 抓取
- `image_search/` - DuckDuckGo 图片搜索

### MCP 系统（`src/mcp/`）

- 使用 `langchain-mcp-adapters` 的 `MultiServerMCPClient` 管理多服务
- **懒初始化**：首次使用时 `get_cached_mcp_tools()` 加载
- **缓存失效**：通过配置文件 mtime 检测变更
- **传输协议**：stdio / SSE / HTTP
- **运行时更新**：Gateway 写 extensions_config.json；LangGraph 基于 mtime 自动感知

### Skills 系统（`src/skills/`）

- **位置**：`deer-flow/skills/{public,custom}/`
- **格式**：目录 + `SKILL.md`（YAML frontmatter：name、description、license、allowed-tools）
- **加载**：`load_skills()` 扫描目录，解析 SKILL.md，并读取 extensions_config.json 中 enabled 状态
- **注入**：启用技能会在系统提示词中以容器路径形式列出
- **安装**：`POST /api/skills/install` 将 `.skill` ZIP 解压到 custom/

### 模型工厂（`src/models/factory.py`）

- `create_chat_model(name, thinking_enabled)` 通过反射从配置实例化 LLM
- 支持 `thinking_enabled` 与模型级 `when_thinking_enabled` 覆盖
- 支持 `supports_vision` 视觉能力标记
- `$` 前缀配置值自动解析环境变量

### 记忆系统（`src/agents/memory/`）

**组件**：
- `updater.py` - 基于 LLM 的记忆更新（facts 提取 + 原子文件写入）
- `queue.py` - 防抖更新队列（按线程去重，可配置等待时间）
- `prompt.py` - 记忆更新提示词模板

**数据结构**（`backend/.deer-flow/memory.json`）：
- **User Context**：`workContext`、`personalContext`、`topOfMind`（1-3 句摘要）
- **History**：`recentMonths`、`earlierContext`、`longTermBackground`
- **Facts**：带 `id/content/category/confidence/createdAt/source` 的离散事实

**工作流**：
1. `MemoryMiddleware` 过滤消息（用户输入 + 最终 AI 回复）并入队
2. 队列防抖（默认 30s）、批处理、按线程去重
3. 后台线程调用 LLM 生成上下文更新与 facts
4. 以原子方式写入（临时文件 + rename）并失效缓存
5. 下一次交互将 top 15 facts + context 注入系统提示词 `<memory>`

**配置**（`config.yaml` → `memory`）：
- `enabled` / `injection_enabled` - 总开关
- `storage_path` - memory.json 路径
- `debounce_seconds` - 处理等待时间（默认 30）
- `model_name` - 更新所用 LLM（null = 默认模型）
- `max_facts` / `fact_confidence_threshold` - facts 限制（100 / 0.7）
- `max_injection_tokens` - 提示词注入 token 上限（2000）

### 反射系统（`src/reflection/`）

- `resolve_variable(path)` - 导入模块并返回变量（`module.path:variable_name`）
- `resolve_class(path, base_class)` - 导入并校验类继承关系

### 配置结构

**`config.yaml`** 关键区块：
- `models[]`：LLM 配置（`use` 类路径、`supports_thinking`、`supports_vision` 等）
- `tools[]`：工具配置（`use` 变量路径、`group`）
- `tool_groups[]`：工具逻辑分组
- `sandbox.use`：沙箱 provider 类路径
- `skills.path` / `skills.container_path`：技能目录宿主机路径与容器路径
- `title`：自动标题（enabled/max_words/max_chars/prompt_template）
- `summarization`：上下文摘要（开关、触发条件、保留策略）
- `subagents.enabled`：子代理开关
- `memory`：记忆系统（enabled/storage/debounce/model/facts/injection/token）

**`extensions_config.json`**：
- `mcpServers`：server 名称 → 配置（enabled/type/command/args/env/url/headers/description）
- `skills`：skill 名称 → 状态（enabled）

两者均可通过 Gateway API 在运行时修改。

## 开发工作流

### 运行完整应用

在**项目根目录**执行：
```bash
make dev
```

服务可通过 `http://localhost:2026` 访问。

**Nginx 路由**：
- `/api/langgraph/*` → LangGraph（2024）
- `/api/*`（其他）→ Gateway（8001）
- `/`（非 API）→ Frontend（3000）

### 分别运行后端服务

在 **backend** 目录执行：

```bash
# 终端 1：LangGraph
make dev

# 终端 2：Gateway
make gateway
```

不经 nginx 的直连：
- LangGraph：`http://localhost:2024`
- Gateway：`http://localhost:8001`

### 前端连接配置

前端通过环境变量连接后端：
- `NEXT_PUBLIC_LANGGRAPH_BASE_URL` - 默认 `/api/langgraph`（经 nginx）
- `NEXT_PUBLIC_BACKEND_BASE_URL` - 默认空字符串（经 nginx）

在根目录执行 `make dev` 时，前端会自动经 nginx 连接后端。

## 关键特性

### 文件上传

多文件上传 + 自动文档转换：
- 端点：`POST /api/threads/{thread_id}/uploads`
- 支持：PDF、PPT、Excel、Word（经 `markitdown` 转换）
- 文件按线程隔离存储
- 通过 `UploadsMiddleware` 将文件列表注入 Agent 上下文

详见 [docs/FILE_UPLOAD.md](docs/FILE_UPLOAD.md)。

### 计划模式

TodoList 中间件用于复杂多步骤任务：
- 运行时配置：`config.configurable.is_plan_mode = True`
- 提供 `write_todos` 工具用于任务跟踪
- 同时仅允许一个任务 in_progress，支持实时更新

详见 [docs/plan_mode_usage.md](docs/plan_mode_usage.md)。

### 上下文摘要

接近 token 上限时自动摘要：
- 在 `config.yaml` 的 `summarization` 区块配置
- 触发方式：tokens、messages、fraction
- 保留近期消息并摘要较早消息

详见 [docs/summarization.md](docs/summarization.md)。

### 视觉支持

对 `supports_vision: true` 的模型：
- `ViewImageMiddleware` 处理对话图片
- 将 `view_image_tool` 加入工具集
- 自动将图片转为 base64 并注入 state

## 代码风格

- 使用 `ruff` 进行 lint 与格式化
- 行长度：240
- Python 3.12+ + 类型注解
- 双引号 + 空格缩进

## 文档

详见 `docs/` 目录：
- [CONFIGURATION.md](docs/CONFIGURATION.md) - 配置项
- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - 架构细节
- [API.md](docs/API.md) - API 参考
- [SETUP.md](docs/SETUP.md) - 安装指南
- [FILE_UPLOAD.md](docs/FILE_UPLOAD.md) - 文件上传
- [PATH_EXAMPLES.md](docs/PATH_EXAMPLES.md) - 路径类型与用法
- [summarization.md](docs/summarization.md) - 上下文摘要
- [plan_mode_usage.md](docs/plan_mode_usage.md) - TodoList 计划模式
