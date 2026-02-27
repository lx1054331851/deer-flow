# 🦌 DeerFlow - 2.0

DeerFlow（**D**eep **E**xploration and **E**fficient **R**esearch **Flow**）是一个开源的**超级 Agent Harness（编排运行框架）**，通过**可扩展技能**驱动，协调**子代理**、**记忆**与**沙箱**，几乎可以完成任何任务。

https://github.com/user-attachments/assets/a8bcadc4-e040-4cf2-8fda-dd768b999c18

> [!NOTE]
> **DeerFlow 2.0 是一次从零开始的重写。**它与 v1 不共享任何代码。如果你在寻找最初的 Deep Research 框架，请前往仍在维护的 [`1.x` 分支](https://github.com/bytedance/deer-flow/tree/main-1.x)——我们依然欢迎在该分支上的贡献。当前活跃开发已迁移至 2.0。

## 官方网站

了解更多并查看**真实演示**：

**[deerflow.tech](https://deerflow.tech/)**

---

## 目录

- [快速开始](#快速开始)
- [沙箱配置](#沙箱配置)
- [从 Deep Research 到 Super Agent Harness](#从-deep-research-到-super-agent-harness)
- [核心特性](#核心特性)
  - [技能与工具](#技能与工具)
  - [子代理](#子代理)
  - [沙箱与文件系统](#沙箱与文件系统)
  - [上下文工程](#上下文工程)
  - [长期记忆](#长期记忆)
- [推荐模型](#推荐模型)
- [文档](#文档)
- [参与贡献](#参与贡献)
- [许可证](#许可证)
- [致谢](#致谢)
- [Star 历史](#star-历史)

## 快速开始

### 配置

1. **复制示例配置**：
   ```bash
   cp config.example.yaml config.yaml
   cp .env.example .env
   ```

2. **编辑 `config.yaml`**，并在 `.env` 中设置你的 API Key，以及你偏好的沙箱模式。

#### 沙箱配置

DeerFlow 支持多种沙箱执行模式。请在 `config.yaml` 中配置你偏好的模式：

**本地执行**（沙箱代码直接在宿主机运行）：
```yaml
sandbox:
   use: src.sandbox.local:LocalSandboxProvider # 本地执行
```

**Docker 执行**（沙箱代码在隔离的 Docker 容器中运行）：
```yaml
sandbox:
   use: src.community.aio_sandbox:AioSandboxProvider # 基于 Docker 的沙箱
```

**Docker + Kubernetes 执行**（通过 provisioner 服务在 Kubernetes Pod 中运行沙箱代码）：

该模式会在你的**宿主机集群**中为每个沙箱启动一个隔离的 Kubernetes Pod。需要 Docker Desktop K8s、OrbStack 或类似的本地 K8s 环境。

```yaml
sandbox:
   use: src.community.aio_sandbox:AioSandboxProvider
   provisioner_url: http://provisioner:8002
```

详细配置、前置条件与故障排查请参见 [Provisioner Setup Guide](docker/provisioner/README.md)。

### 运行应用

#### 选项 1：Docker（推荐）

以一致环境快速启动的最佳方式：

1. **初始化并启动**：
   ```bash
   make docker-init    # 拉取沙箱镜像（仅首次或镜像更新时）
   make docker-start   # 启动全部服务并监听代码变更
   ```

2. **访问**：http://localhost:2026

Docker 开发详细说明请参见 [CONTRIBUTING.md](CONTRIBUTING.md)。

#### 选项 2：本地开发

如果你更倾向于在本机直接运行服务：

1. **检查前置依赖**：
   ```bash
   make check  # 校验 Node.js 22+、pnpm、uv、nginx
   ```

2. **安装项目依赖**：
   ```bash
   make install  # 安装 frontend + backend 依赖
   ```

3. **（可选）预拉取沙箱镜像**：
   ```bash
   # 如果使用 Docker/容器沙箱，建议执行
   make setup-sandbox
   ```

4. **启动服务**：
   ```bash
   make dev
   ```

5. **访问**：http://localhost:2026

#### 选项 3：本地开发（Windows 环境）

Windows 下推荐使用 **WSL2 + Ubuntu** 运行本地开发环境（可完整支持 `make`、`bash`、`uv`、`nginx` 等依赖）。

1. **启用 WSL 并安装 Ubuntu**（在管理员 PowerShell 中执行）：
   ```powershell
   wsl --install -d Ubuntu
   ```
   安装完成后重启系统，并按提示创建 Ubuntu 用户。

2. **在 Ubuntu 中安装基础依赖**：
   ```bash
   sudo apt update
   sudo apt install -y make nginx curl git
   ```

3. **安装 Node.js 22 与 pnpm**：
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
   sudo apt install -y nodejs
   sudo npm install -g pnpm
   ```

4. **安装 uv**：
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   source ~/.bashrc
   ```

5. **进入项目目录**（在 Ubuntu 终端）：
   ```bash
   cd /mnt/d/PycharmProjects/deer-flow
   ```

6. **初始化配置并检查依赖**：
   ```bash
   make config
   make check
   ```

7. **安装依赖并启动服务**：
   ```bash
   make install
   make dev
   ```

8. **访问应用**：http://localhost:2026

如果你偏好容器化开发，也可以在 Windows 安装 Docker Desktop 后直接使用 [选项 1：Docker（推荐）](#选项-1docker推荐)。

## 从 Deep Research 到 Super Agent Harness

DeerFlow 最初是一个 Deep Research 框架——而社区把它推向了更远。自发布以来，开发者将它应用到远超研究本身的场景：构建数据流水线、生成演示文稿、搭建仪表盘、自动化内容工作流……这些都超出了我们最初预期。

这让我们意识到一件重要的事：DeerFlow 不只是研究工具，它更是一个**Harness（运行编排底座）**——一个能为 Agent 提供真正执行基础设施的运行时。

所以我们从头重构了它。

DeerFlow 2.0 不再是需要你自己拼装的框架。它是一个开箱即用、完全可扩展的超级 Agent Harness。基于 LangGraph 与 LangChain 构建，默认提供 Agent 所需的一切：文件系统、记忆、技能、沙箱执行，以及面向复杂多步骤任务的规划与子代理生成能力。

你可以直接使用。也可以拆开它，按你的方式重构。

## 核心特性

### 技能与工具

技能让 DeerFlow 能够完成*几乎所有事情*。

标准 Agent Skill 是一种结构化能力模块——一个定义工作流、最佳实践和参考资源的 Markdown 文件。DeerFlow 内置了研究、报告生成、幻灯片创建、网页、图像与视频生成等技能。真正强大的地方在于可扩展性：你可以添加自己的技能、替换内置技能，或把多个技能组合成复合工作流。

技能采用渐进加载——只有任务需要时才加载，而不是一次性全部注入。这能让上下文窗口更精简，也让 DeerFlow 在 token 敏感模型上表现更稳。

工具遵循同样理念。DeerFlow 提供核心工具集——网页搜索、网页抓取、文件操作、bash 执行——并支持通过 MCP 服务与 Python 函数扩展自定义工具。任何工具都可替换、可扩展。

```
# 沙箱容器内路径
/mnt/skills/public
├── research/SKILL.md
├── report-generation/SKILL.md
├── slide-creation/SKILL.md
├── web-page/SKILL.md
└── image-generation/SKILL.md

/mnt/skills/custom
└── your-custom-skill/SKILL.md      ← 你的技能
```

### 子代理

复杂任务很少能一次完成。DeerFlow 会对其进行拆解。

主代理可以按需动态生成子代理——每个子代理都拥有自己的作用域上下文、工具和终止条件。子代理会在可并行时并行执行，返回结构化结果，再由主代理汇总为统一输出。

这就是 DeerFlow 处理“分钟到小时级”任务的方式：一个研究任务可拆分为十几个子代理，分别探索不同方向，最后汇聚成一份报告——或一个网站——或一套带生成视觉素材的演示文稿。一个 Harness，多个执行单元。

### 沙箱与文件系统

DeerFlow 不只是*讨论*如何做事，它有自己的“计算机环境”。

每个任务都在隔离的 Docker 容器中运行，包含完整文件系统——技能、工作区、上传目录、输出目录。Agent 可以读写和编辑文件，执行 bash 命令与代码，查看图片。全过程都在沙箱内、可审计，且会话间零污染。

这正是“带工具调用的聊天机器人”和“具备真实执行环境的 Agent”之间的区别。

```
# 沙箱容器内路径
/mnt/user-data/
├── uploads/          ← 你的文件
├── workspace/        ← agents 的工作目录
└── outputs/          ← 最终交付物
```

### 上下文工程

**子代理上下文隔离**：每个子代理都在独立上下文中运行，这意味着子代理无法看到主代理或其他子代理的上下文。这能确保子代理聚焦当前任务，不受其他上下文干扰。

**摘要压缩**：在单次会话内，DeerFlow 会积极管理上下文——汇总已完成子任务、将中间结果下沉到文件系统、压缩不再即时相关的信息。这样在长链路多步骤任务中也能保持“上下文清醒”，避免撑爆上下文窗口。

### 长期记忆

多数 Agent 会在对话结束后遗忘一切，而 DeerFlow 会记住。

跨会话地，DeerFlow 会持续构建关于你的持久记忆，包括用户画像、偏好与累积知识。你用得越多，它越懂你——你的写作风格、技术栈与重复工作流。记忆数据本地存储，并始终由你掌控。

## 推荐模型

DeerFlow 与模型解耦——凡是实现 OpenAI 兼容 API 的 LLM 都可使用。不过在以下能力上表现更强的模型通常效果最佳：

- **长上下文窗口**（100k+ tokens），适用于深度研究与多步骤任务
- **推理能力**，用于自适应规划和复杂任务分解
- **多模态输入**，用于图像理解与视频理解
- **稳定工具调用能力**，用于可靠函数调用与结构化输出

## 文档

- [贡献指南](CONTRIBUTING.md) - 开发环境搭建与工作流
- [配置指南](backend/docs/CONFIGURATION.md) - 安装与配置说明
- [架构概览](backend/CLAUDE.md) - 技术架构概览
- [后端架构](backend/README.md) - 后端架构与 API 参考

## 参与贡献

欢迎贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解开发环境、工作流与贡献规范。

## 许可证

本项目为开源项目，采用 [MIT License](./LICENSE)。

## 致谢

DeerFlow 建立在开源社区卓越成果之上。我们由衷感谢所有让 DeerFlow 成为可能的项目与贡献者。我们始终站在巨人的肩膀上。

我们特别向以下项目致以诚挚谢意，感谢它们的关键贡献：

- **[LangChain](https://github.com/langchain-ai/langchain)**：其优秀框架为我们的 LLM 交互与链式调用提供了核心能力，实现了顺畅集成与功能扩展。
- **[LangGraph](https://github.com/langchain-ai/langgraph)**：其创新的多代理编排方法对 DeerFlow 复杂工作流能力的实现至关重要。

这些项目充分体现了开源协作的变革力量，我们也很荣幸能构建在这些基础之上。

### 关键贡献者

衷心感谢 `DeerFlow` 的核心作者，他们的愿景、热情与投入让项目成为现实：

- **[Daniel Walnut](https://github.com/hetaoBackend/)**
- **[Henry Li](https://github.com/magiccube/)**

你们坚定的投入与专业能力是 DeerFlow 成功的核心驱动力。能够与你们同行，我们深感荣幸。

## Star 历史

[![Star History Chart](https://api.star-history.com/svg?repos=bytedance/deer-flow&type=Date)](https://star-history.com/#bytedance/deer-flow&Date)
