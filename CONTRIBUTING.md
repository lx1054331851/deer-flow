# 参与贡献 DeerFlow

感谢你对 DeerFlow 的贡献兴趣！本指南将帮助你搭建开发环境，并了解我们的开发工作流。

## 开发环境搭建

我们提供两种开发环境。为获得最一致、最省心的体验，**推荐使用 Docker**。

### 选项 1：Docker 开发（推荐）

Docker 提供一致且隔离的环境，并预先配置好依赖。你无需在本机安装 Node.js、Python 或 nginx。

#### 前置要求

- Docker Desktop 或 Docker Engine
- pnpm（用于缓存优化）

#### 搭建步骤

1. **配置应用**：
   ```bash
   # 复制示例配置
   cp config.example.yaml config.yaml

   # 设置你的 API Key
   export OPENAI_API_KEY="your-key-here"
   # 或直接编辑 config.yaml

   # 可选：启用 MCP servers 和 skills
   cp extensions_config.example.json extensions_config.json
   # 编辑 extensions_config.json 以启用所需 MCP servers 和 skills
   ```

2. **初始化 Docker 环境**（仅首次需要）：
   ```bash
   make docker-init
   ```
   该命令会：
   - 构建 Docker 镜像
   - 安装前端依赖（pnpm）
   - 安装后端依赖（uv）
   - 与宿主机共享 pnpm 缓存以加速构建

3. **启动开发服务**：
   ```bash
   make docker-start
   ```
   所有服务都会以热重载模式启动：
   - 前端变更会自动刷新
   - 后端变更会自动重启
   - LangGraph 服务支持热重载

4. **访问应用**：
   - Web 界面：http://localhost:2026
   - API Gateway：http://localhost:2026/api/*
   - LangGraph：http://localhost:2026/api/langgraph/*

#### Docker 常用命令

```bash
# 查看全部日志
make docker-logs

# 重启服务
make docker-restart

# 停止服务
make docker-stop

# 查看帮助
make docker-help
```

#### Docker 架构

```
宿主机
  ↓
Docker Compose (deer-flow-dev)
  ├→ nginx (port 2026) ← 反向代理
  ├→ web (port 3000) ← 支持热重载的前端
  ├→ api (port 8001) ← 支持热重载的 Gateway API
  └→ langgraph (port 2024) ← 支持热重载的 LangGraph 服务
```

**Docker 开发的优势**：
- ✅ 跨机器环境一致
- ✅ 无需本地安装 Node.js、Python 或 nginx
- ✅ 依赖与服务相互隔离
- ✅ 易于清理和重置
- ✅ 所有服务支持热重载
- ✅ 更接近生产环境

### 选项 2：本地开发

如果你希望直接在本机运行服务：

#### 前置要求

先检查必需工具是否齐全：

```bash
make check
```

所需工具：
- Node.js 22+
- pnpm
- uv（Python 包管理器）
- nginx

#### 搭建步骤

1. **配置应用**（与上方 Docker 配置相同）

2. **安装依赖**：
   ```bash
   make install
   ```

3. **运行开发服务**（通过 nginx 启动全部服务）：
   ```bash
   make dev
   ```

4. **访问应用**：
   - Web 界面：http://localhost:2026
   - 所有 API 请求会自动经由 nginx 反向代理

#### 手动控制服务

如果你需要分别启动服务：

1. **启动后端服务**：
   ```bash
   # 终端 1：启动 LangGraph 服务（端口 2024）
   cd backend
   make dev

   # 终端 2：启动 Gateway API（端口 8001）
   cd backend
   make gateway

   # 终端 3：启动前端（端口 3000）
   cd frontend
   pnpm dev
   ```

2. **启动 nginx**：
   ```bash
   make nginx
   # 或直接运行：nginx -c $(pwd)/docker/nginx/nginx.local.conf -g 'daemon off;'
   ```

3. **访问应用**：
   - Web 界面：http://localhost:2026

#### Nginx 配置

nginx 配置提供：
- 2026 端口统一入口
- 将 `/api/langgraph/*` 路由到 LangGraph 服务（2024）
- 将其他 `/api/*` 端点路由到 Gateway API（8001）
- 将非 API 请求路由到前端（3000）
- 集中式 CORS 处理
- 支持 SSE/流式实时 Agent 响应
- 针对长耗时操作优化超时配置

## 项目结构

```
deer-flow/
├── config.example.yaml      # 配置模板
├── extensions_config.example.json  # MCP 与 Skills 配置模板
├── Makefile                 # 构建与开发命令
├── scripts/
│   └── docker.sh           # Docker 管理脚本
├── docker/
│   ├── docker-compose-dev.yaml  # Docker Compose 配置
│   └── nginx/
│       ├── nginx.conf      # Docker 环境下的 Nginx 配置
│       └── nginx.local.conf # 本地开发环境下的 Nginx 配置
├── backend/                 # 后端应用
│   ├── src/
│   │   ├── gateway/        # Gateway API（端口 8001）
│   │   ├── agents/         # LangGraph agents（端口 2024）
│   │   ├── mcp/            # Model Context Protocol 集成
│   │   ├── skills/         # Skills 系统
│   │   └── sandbox/        # 沙箱执行
│   ├── docs/               # 后端文档
│   └── Makefile            # 后端命令
├── frontend/               # 前端应用
│   └── Makefile            # 前端命令
└── skills/                 # Agent 技能
    ├── public/             # 公共技能
    └── custom/             # 自定义技能
```

## 架构

```
浏览器
  ↓
Nginx (port 2026) ← 统一入口
  ├→ Frontend (port 3000) ← /（非 API 请求）
  ├→ Gateway API (port 8001) ← /api/models, /api/mcp, /api/skills, /api/threads/*/artifacts
  └→ LangGraph Server (port 2024) ← /api/langgraph/*（Agent 交互）
```

## 开发工作流

### 分支策略（Fork 仓库推荐）

- `main` 仅用于同步上游，不直接进行业务开发。
- 所有功能开发、修复、实验都在功能分支完成。

先同步 `main`：

```bash
git checkout main
git fetch upstream
git merge upstream/main
git push origin main
```

再从最新 `main` 创建功能分支：

```bash
git checkout -b feature/your-feature-name
```

1. **创建功能分支**：
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. 在热重载环境下**进行代码修改**

3. **充分测试**你的改动

4. **提交改动**：
   ```bash
   git add .
   git commit -m "feat: description of your changes"
   ```

5. **推送并创建 Pull Request**：
   ```bash
   git push origin feature/your-feature-name
   ```

## 测试

```bash
# 后端测试
cd backend
uv run pytest

# 前端测试
cd frontend
pnpm test
```

## 代码风格

- **后端（Python）**：使用 `ruff` 进行 lint 与格式化
- **前端（TypeScript）**：使用 ESLint 与 Prettier

## 文档

- [配置指南](backend/docs/CONFIGURATION.md) - 安装与配置
- [架构概览](backend/CLAUDE.md) - 技术架构
- [MCP 配置指南](MCP_SETUP.md) - Model Context Protocol 配置
- [Fork 同步上游指南](docs/FORK_SYNC_UPSTREAM.md) - 同步上游与冲突处理

## 需要帮助？

- 查看已有 [问题单](https://github.com/bytedance/deer-flow/issues)
- 阅读 [文档](backend/docs/)
- 在 [讨论区](https://github.com/bytedance/deer-flow/discussions) 中提问

## 许可证

向 DeerFlow 贡献代码即表示你同意你的贡献将按照 [MIT License](./LICENSE) 进行许可。
