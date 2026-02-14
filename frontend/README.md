# DeerFlow 前端

延续 DeerFlow 1.0 的理念，我们希望为社区提供一个极简易用、同时具备更现代与灵活架构的 Web 界面。

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) + [App Router](https://nextjs.org/docs/app)
- **UI**: [React 19](https://react.dev/)、[Tailwind CSS 4](https://tailwindcss.com/)、[Shadcn UI](https://ui.shadcn.com/)、[MagicUI](https://magicui.design/) 和 [React Bits](https://reactbits.dev/)
- **AI 集成**: [LangGraph SDK](https://www.npmjs.com/package/@langchain/langgraph-sdk) 和 [Vercel AI Elements](https://vercel.com/ai-sdk/ai-elements)

## 快速开始

### 前置要求

- Node.js 22+
- pnpm 10.26.2+

### 安装

```bash
# 安装依赖
pnpm install

# 复制环境变量文件
cp .env.example .env
# 按你的配置编辑 .env
```

### 开发

```bash
# 启动开发服务器
pnpm dev

# 应用访问地址：http://localhost:3000
```

### 构建

```bash
# 类型检查
pnpm typecheck

# 代码检查
pnpm lint

# 生产构建
pnpm build

# 启动生产服务
pnpm start
```

## 页面结构

```
├── /                    # 落地页
├── /chats               # 聊天列表
├── /chats/new           # 新建聊天页
└── /chats/[thread_id]   # 单个聊天页
```

## 配置

### 环境变量

关键环境变量（完整列表见 `.env.example`）：

```bash
# 后端 API 地址（可选，默认使用 nginx 代理）
NEXT_PUBLIC_BACKEND_BASE_URL="http://localhost:8001"
# LangGraph API 地址（可选，默认使用 nginx 代理）
NEXT_PUBLIC_LANGGRAPH_BASE_URL="http://localhost:2024"
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── api/                # API 路由
│   ├── workspace/          # 主工作区页面
│   └── mock/               # Mock/演示页面
├── components/             # React 组件
│   ├── ui/                 # 可复用 UI 组件
│   ├── workspace/          # 工作区专用组件
│   ├── landing/            # 落地页组件
│   └── ai-elements/        # AI 相关 UI 元素
├── core/                   # 核心业务逻辑
│   ├── api/                # API 客户端与数据请求
│   ├── artifacts/          # 产物管理
│   ├── config/             # 应用配置
│   ├── i18n/               # 国际化
│   ├── mcp/                # MCP 集成
│   ├── messages/           # 消息处理
│   ├── models/             # 数据模型与类型
│   ├── settings/           # 用户设置
│   ├── skills/             # Skills 系统
│   ├── threads/            # 线程管理
│   ├── todos/              # Todo 系统
│   └── utils/              # 工具函数
├── hooks/                  # 自定义 React hooks
├── lib/                    # 共享库与工具
├── server/                 # 服务端代码（暂未启用）
│   └── better-auth/        # 认证配置（暂未启用）
└── styles/                 # 全局样式
```

## 脚本命令

| 命令 | 说明 |
|---------|-------------|
| `pnpm dev` | 使用 Turbopack 启动开发服务器 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 启动生产服务 |
| `pnpm lint` | 运行 ESLint |
| `pnpm lint:fix` | 自动修复 ESLint 问题 |
| `pnpm typecheck` | 运行 TypeScript 类型检查 |
| `pnpm check` | 同时运行 lint 与 typecheck |

## 开发说明

- 使用 pnpm workspaces（见 `package.json` 中的 `packageManager`）
- 开发环境默认启用 Turbopack 以加速构建
- 可用 `SKIP_ENV_VALIDATION=1` 跳过环境变量校验（Docker 下常用）
- 后端 API 地址配置为可选；开发时默认走 nginx 代理

## 许可证

本项目采用 MIT License。详见 [LICENSE](../LICENSE)。
