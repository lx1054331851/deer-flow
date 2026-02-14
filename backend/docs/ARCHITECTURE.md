# 架构总览

本文档提供 DeerFlow 后端架构的全面说明。

## 系统架构

```
┌──────────────────────────────────────────────────────────────────────────┐
│                              客户端（浏览器）                              │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
                                  ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                          Nginx（端口 2026）                               │
│                        统一反向代理入口                                    │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │  /api/langgraph/*  →  LangGraph Server（2024）                    │  │
│  │  /api/*            →  Gateway API（8001）                         │  │
│  │  /*                →  Frontend（3000）                             │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────┬────────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
│   LangGraph Server  │ │    Gateway API      │ │     Frontend        │
│     （端口 2024）    │ │    （端口 8001）     │ │    （端口 3000）     │
│                     │ │                     │ │                     │
│  - Agent 运行时      │ │  - 模型 API         │ │  - Next.js 应用      │
│  - 线程管理          │ │  - MCP 配置         │ │  - React UI         │
│  - SSE 流式响应      │ │  - 技能管理         │ │  - 聊天界面          │
│  - Checkpointing    │ │  - 文件上传         │ │                     │
│                     │ │  - 产物服务         │ │                     │
└─────────────────────┘ └─────────────────────┘ └─────────────────────┘
          │                       │
          │     ┌─────────────────┘
          │     │
          ▼     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                             共享配置                                      │
│  ┌─────────────────────────┐  ┌────────────────────────────────────────┐ │
│  │      config.yaml        │  │      extensions_config.json            │ │
│  │  - 模型                 │  │  - MCP Servers                         │ │
│  │  - 工具                 │  │  - Skills 状态                         │ │
│  │  - 沙箱                 │  │                                        │ │
│  │  - 摘要策略             │  │                                        │ │
│  └─────────────────────────┘  └────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

## 组件详情

### LangGraph Server

LangGraph Server 是核心 Agent 运行时，基于 LangGraph 构建，用于可靠的多 Agent 工作流编排。

**入口**：`src/agents/lead_agent/agent.py:make_lead_agent`

**关键职责**：
- Agent 创建与配置
- 线程状态管理
- 中间件链执行
- 工具执行编排
- 实时响应的 SSE 流式输出

**配置**：`langgraph.json`

```json
{
  "agent": {
    "type": "agent",
    "path": "src.agents:make_lead_agent"
  }
}
```

### Gateway API

基于 FastAPI 的应用，为非 Agent 操作提供 REST 接口。

**入口**：`src/gateway/app.py`

**路由**：
- `models.py` - `/api/models` - 模型列表与详情
- `mcp.py` - `/api/mcp` - MCP 服务配置
- `skills.py` - `/api/skills` - 技能管理
- `uploads.py` - `/api/threads/{id}/uploads` - 文件上传
- `artifacts.py` - `/api/threads/{id}/artifacts` - 产物访问

### Agent 架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           make_lead_agent(config)                      │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            中间件链                                     │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ 1. ThreadDataMiddleware    - 初始化 workspace/uploads/outputs   │   │
│  │ 2. UploadsMiddleware       - 处理上传文件                        │   │
│  │ 3. SandboxMiddleware       - 获取沙箱环境                        │   │
│  │ 4. SummarizationMiddleware - 上下文压缩（启用时）                │   │
│  │ 5. TitleMiddleware         - 自动生成标题                        │   │
│  │ 6. TodoListMiddleware      - 任务追踪（plan_mode）               │   │
│  │ 7. ViewImageMiddleware     - 视觉模型支持                        │   │
│  │ 8. ClarificationMiddleware - 处理澄清问题                        │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              Agent 核心                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────┐   │
│  │      模型        │  │      工具        │  │    系统提示词         │   │
│  │  (from factory)  │  │ (配置 + MCP +内置)│ │   (含技能注入)       │   │
│  └──────────────────┘  └──────────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 线程状态

`ThreadState` 在 LangGraph 的 `AgentState` 基础上扩展了以下字段：

```python
class ThreadState(AgentState):
   # AgentState 核心状态
    messages: list[BaseMessage]

   # DeerFlow 扩展
   sandbox: dict             # 沙箱环境信息
   artifacts: list[str]      # 生成文件路径
   thread_data: dict         # {workspace, uploads, outputs} 路径
   title: str | None         # 自动生成会话标题
   todos: list[dict]         # 任务跟踪（计划模式）
   viewed_images: dict       # 视觉模型图片数据
```

### 沙箱系统

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              沙箱架构                                   │
└─────────────────────────────────────────────────────────────────────────┘

                      ┌─────────────────────────┐
                      │    SandboxProvider      │（抽象）
                      │  - acquire()            │
                      │  - get()                │
                      │  - release()            │
                      └────────────┬────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                                         │
              ▼                                         ▼
┌─────────────────────────┐              ┌─────────────────────────┐
│  LocalSandboxProvider   │              │  AioSandboxProvider     │
│  (src/sandbox/local.py) │              │  (src/community/)       │
│                         │              │                         │
│  - 单例实例             │              │  - 基于 Docker          │
│  - 直接执行             │              │  - 容器隔离             │
│  - 开发环境使用         │              │  - 生产环境使用         │
└─────────────────────────┘              └─────────────────────────┘

                      ┌─────────────────────────┐
                      │        Sandbox          │（抽象）
                      │  - execute_command()    │
                      │  - read_file()          │
                      │  - write_file()         │
                      │  - list_dir()           │
                      └─────────────────────────┘
```

**虚拟路径映射**：

| 虚拟路径 | 物理路径 |
|-------------|---------------|
| `/mnt/user-data/workspace` | `backend/.deer-flow/threads/{thread_id}/user-data/workspace` |
| `/mnt/user-data/uploads` | `backend/.deer-flow/threads/{thread_id}/user-data/uploads` |
| `/mnt/user-data/outputs` | `backend/.deer-flow/threads/{thread_id}/user-data/outputs` |
| `/mnt/skills` | `deer-flow/skills/` |

### 工具系统

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              工具来源                                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐
│      内置工具       │  │    配置工具         │  │      MCP 工具        │
│    (src/tools/)     │  │   (config.yaml)     │  │ (extensions.json)    │
├─────────────────────┤  ├─────────────────────┤  ├─────────────────────┤
│ - present_file      │  │ - web_search        │  │ - github            │
│ - ask_clarification │  │ - web_fetch         │  │ - filesystem        │
│ - view_image        │  │ - bash              │  │ - postgres          │
│                     │  │ - read_file         │  │ - brave-search      │
│                     │  │ - write_file        │  │ - puppeteer         │
│                     │  │ - str_replace       │  │ - ...               │
│                     │  │ - ls                │  │                     │
└─────────────────────┘  └─────────────────────┘  └─────────────────────┘
           │                       │                       │
           └───────────────────────┴───────────────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │   get_available_tools() │
                      │   (src/tools/__init__)  │
                      └─────────────────────────┘
```

### 模型工厂

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              模型工厂                                   │
│                        (src/models/factory.py)                         │
└─────────────────────────────────────────────────────────────────────────┘

config.yaml:
┌─────────────────────────────────────────────────────────────────────────┐
│ models:                                                                  │
│   - name: gpt-4                                                         │
│     display_name: GPT-4                                                 │
│     use: langchain_openai:ChatOpenAI                                    │
│     model: gpt-4                                                        │
│     api_key: $OPENAI_API_KEY                                            │
│     max_tokens: 4096                                                    │
│     supports_thinking: false                                            │
│     supports_vision: true                                               │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │   create_chat_model()   │
                      │  - name: str            │
                      │  - thinking_enabled     │
                      └────────────┬────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │     resolve_class()     │
                      │     （反射系统）        │
                      └────────────┬────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │     BaseChatModel       │
                      │   （LangChain 实例）    │
                      └─────────────────────────┘
```

**支持的提供商**：
- OpenAI (`langchain_openai:ChatOpenAI`)
- Anthropic (`langchain_anthropic:ChatAnthropic`)
- DeepSeek (`langchain_deepseek:ChatDeepSeek`)
- 通过 LangChain 集成的自定义提供商

### MCP 集成

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              MCP 集成                                   │
│                         (src/mcp/manager.py)                            │
└─────────────────────────────────────────────────────────────────────────┘

extensions_config.json:
┌─────────────────────────────────────────────────────────────────────────┐
│ {                                                                        │
│   "mcpServers": {                                                       │
│     "github": {                                                         │
│       "enabled": true,                                                  │
│       "type": "stdio",                                                  │
│       "command": "npx",                                                 │
│       "args": ["-y", "@modelcontextprotocol/server-github"],           │
│       "env": {"GITHUB_TOKEN": "$GITHUB_TOKEN"}                          │
│     }                                                                   │
│   }                                                                     │
│ }                                                                       │
└─────────────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                      ┌─────────────────────────┐
                      │  MultiServerMCPClient   │
                      │  (langchain-mcp-adapters)│
                      └────────────┬────────────┘
                                   │
              ┌────────────────────┼────────────────────┐
              │                    │                    │
              ▼                    ▼                    ▼
       ┌───────────┐        ┌───────────┐        ┌───────────┐
       │  stdio    │        │   SSE     │        │   HTTP    │
       │ transport │        │ transport │        │ transport │
       └───────────┘        └───────────┘        └───────────┘
```

### 技能系统

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              技能系统                                   │
│                         (src/skills/loader.py)                          │
└─────────────────────────────────────────────────────────────────────────┘

目录结构：
┌─────────────────────────────────────────────────────────────────────────┐
│ skills/                                                                  │
│ ├── public/                        # 公共技能（已提交）                  │
│ │   ├── pdf-processing/                                                 │
│ │   │   └── SKILL.md                                                    │
│ │   ├── frontend-design/                                                │
│ │   │   └── SKILL.md                                                    │
│ │   └── ...                                                             │
│ └── custom/                        # 自定义技能（gitignored）            │
│     └── user-installed/                                                 │
│         └── SKILL.md                                                    │
└─────────────────────────────────────────────────────────────────────────┘

SKILL.md 格式：
┌─────────────────────────────────────────────────────────────────────────┐
│ ---                                                                      │
│ name: PDF Processing                                                     │
│ description: Handle PDF documents efficiently                            │
│ license: MIT                                                            │
│ allowed-tools:                                                          │
│   - read_file                                                           │
│   - write_file                                                          │
│   - bash                                                                │
│ ---                                                                      │
│                                                                          │
│ # Skill Instructions                                                     │
│ 内容会注入到系统提示词中...                                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### 请求流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           请求流示例                                    │
│                         用户向 Agent 发送消息                            │
└─────────────────────────────────────────────────────────────────────────┘

1. Client → Nginx
   POST /api/langgraph/threads/{thread_id}/runs
   {"input": {"messages": [{"role": "user", "content": "Hello"}]}}

2. Nginx → LangGraph Server（2024）
   反向代理到 LangGraph 服务

3. LangGraph Server
   a. 加载/创建线程状态
   b. 执行中间件链：
      - ThreadDataMiddleware：设置路径
      - UploadsMiddleware：注入文件列表
      - SandboxMiddleware：获取沙箱
      - SummarizationMiddleware：检查 token 限制
      - TitleMiddleware：按需生成标题
      - TodoListMiddleware：加载 todo（计划模式）
      - ViewImageMiddleware：处理图片
      - ClarificationMiddleware：检查澄清需求

   c. 执行 agent：
      - 模型处理消息
      - 可能调用工具（bash、web_search 等）
      - 工具通过沙箱执行
      - 结果写回消息

   d. 通过 SSE 流式返回响应

4. Client 接收流式响应
```

## 数据流

### 文件上传流

```
1. 客户端上传文件
   POST /api/threads/{thread_id}/uploads
   Content-Type: multipart/form-data

2. Gateway 接收文件
   - 校验文件
   - 存储到 .deer-flow/threads/{thread_id}/user-data/uploads/
   - 若为文档：通过 markitdown 转为 Markdown

3. 返回响应
   {
     "files": [{
       "filename": "doc.pdf",
       "path": ".deer-flow/.../uploads/doc.pdf",
       "virtual_path": "/mnt/user-data/uploads/doc.pdf",
       "artifact_url": "/api/threads/.../artifacts/mnt/.../doc.pdf"
     }]
   }

4. 下一次 agent 运行
   - UploadsMiddleware 列出文件
   - 将文件列表注入消息
   - Agent 可通过 virtual_path 访问
```

### 配置重载

```
1. 客户端更新 MCP 配置
   PUT /api/mcp/config

2. Gateway 写入 extensions_config.json
   - 更新 mcpServers 段
   - 文件 mtime 变化

3. MCP Manager 检测到变化
   - get_cached_mcp_tools() 检查 mtime
   - 若有变化：重新初始化 MCP client
   - 加载更新后的服务配置

4. 下一次 agent 运行即使用新工具
```

## 安全性考量

### 沙箱隔离

- Agent 代码在沙箱边界内执行
- 本地沙箱：直接执行（仅开发环境）
- Docker 沙箱：容器隔离（推荐生产环境）
- 文件操作中防止路径穿越

### API 安全

- 线程隔离：每个线程独立数据目录
- 文件校验：上传路径安全检查
- 环境变量解析：密钥不落盘到配置文件

### MCP 安全

- 每个 MCP 服务独立进程运行
- 环境变量在运行时解析
- 服务可独立启用/禁用

## 性能考量

### 缓存

- MCP 工具按文件 mtime 失效重建
- 配置首次加载，文件变化时重载
- 技能启动时解析并缓存到内存

### 流式

- 使用 SSE 进行实时响应流式传输
- 降低首 token 延迟
- 长任务可见进度

### 上下文管理

- 当接近限制时，摘要中间件会压缩上下文
- 可配置触发条件：tokens、消息数、或比例
- 保留近期消息并摘要较早消息
