# Apple Container 支持

DeerFlow 现已支持在 macOS 上优先使用 Apple Container 作为容器运行时，并在需要时自动回退到 Docker。

## 概览

从这个版本开始，DeerFlow 会在 macOS 上自动检测并优先使用 Apple Container；在以下情况会回退到 Docker：
- 未安装 Apple Container
- 运行在非 macOS 平台

这样既能在 Apple Silicon Mac 上获得更好性能，也能保持跨平台兼容性。

## 优势

### 在配备 Apple Container 的 Apple Silicon Mac 上：
- **更高性能**：原生 ARM64 执行，无需 Rosetta 2 转译
- **更低资源占用**：比 Docker Desktop 更轻量
- **原生集成**：使用 macOS Virtualization.framework

### 回退到 Docker：
- 完整向后兼容
- 支持所有平台（macOS、Linux、Windows）
- 无需修改配置

## 要求

### Apple Container（仅 macOS）：
- macOS 15.0 或更高版本
- Apple Silicon（M1/M2/M3/M4）
- 已安装 Apple Container CLI

### 安装：
```bash
# 从 GitHub Releases 下载
# https://github.com/apple/container/releases

# 验证安装
container --version

# 启动服务
container system start
```

### Docker（所有平台）：
- Docker Desktop 或 Docker Engine

## 工作原理

### 自动检测

`AioSandboxProvider` 会自动检测可用容器运行时：

1. 在 macOS 上：尝试执行 `container --version`
   - 成功 → 使用 Apple Container
   - 失败 → 回退到 Docker

2. 在其他平台：直接使用 Docker

### 运行时差异

两种运行时的命令语法几乎一致：

**容器启动：**
```bash
# Apple Container
container run --rm -d -p 8080:8080 -v /host:/container -e KEY=value image

# Docker
docker run --rm -d -p 8080:8080 -v /host:/container -e KEY=value image
```

**容器清理：**
```bash
# Apple Container（带 --rm）
container stop <id>  # 由于 --rm 自动删除

# Docker（带 --rm）
docker stop <id>     # 由于 --rm 自动删除
```

### 实现细节

实现位于 `backend/src/community/aio_sandbox/aio_sandbox_provider.py`：

- `_detect_container_runtime()`：启动时检测可用运行时
- `_start_container()`：使用检测到的运行时；对 Apple Container 跳过 Docker 专有参数
- `_stop_container()`：按运行时使用对应 stop 命令

## 配置

无需任何配置变更，系统会自动工作。

你可以通过日志确认当前运行时：

```
INFO:src.community.aio_sandbox.aio_sandbox_provider:Detected Apple Container: container version 0.1.0
INFO:src.community.aio_sandbox.aio_sandbox_provider:Starting sandbox container using container: ...
```

或者 Docker：
```
INFO:src.community.aio_sandbox.aio_sandbox_provider:Apple Container not available, falling back to Docker
INFO:src.community.aio_sandbox.aio_sandbox_provider:Starting sandbox container using docker: ...
```

## 容器镜像

两种运行时都使用 OCI 兼容镜像。默认镜像可同时使用：

```yaml
sandbox:
  use: src.community.aio_sandbox:AioSandboxProvider
  image: enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest  # 默认镜像
```

请确保镜像支持对应架构：
- Apple Silicon + Apple Container：ARM64
- Intel Mac + Docker：AMD64
- 多架构镜像可同时兼容两者

### 预拉取镜像（推荐）

**重要**：容器镜像通常较大（500MB+），首次使用才拉取会导致较长等待且反馈不明显。

**最佳实践**：在初始化阶段预拉取镜像：

```bash
# 在项目根目录
make setup-sandbox
```

该命令会：
1. 从 `config.yaml` 读取镜像（或使用默认值）
2. 检测可用运行时（Apple Container 或 Docker）
3. 显示进度并拉取镜像
4. 校验镜像可用

**手动预拉取**：

```bash
# Apple Container
container pull enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest

# Docker
docker pull enterprise-public-cn-beijing.cr.volces.com/vefaas-public/all-in-one-sandbox:latest
```

如果跳过预拉取，会在首次执行 Agent 时自动拉取，耗时可能取决于网络速度（数分钟）。

## 清理脚本

项目提供统一清理脚本，兼容两种运行时：

**脚本：** `scripts/cleanup-containers.sh`

**用法：**
```bash
# 清理所有 DeerFlow sandbox 容器
./scripts/cleanup-containers.sh deer-flow-sandbox

# 自定义前缀
./scripts/cleanup-containers.sh my-prefix
```

**Makefile 集成：**

`Makefile` 中所有清理命令均自动处理两种运行时：
```bash
make stop   # 停止所有服务并清理容器
make clean  # 完整清理（含日志）
```

## 测试

测试容器运行时检测：

```bash
cd backend
python test_container_runtime.py
```

该测试会：
1. 检测可用运行时
2. 可选地启动测试容器
3. 验证连通性
4. 执行清理

## 故障排查

### 在 macOS 上未检测到 Apple Container

1. 检查是否安装：
   ```bash
   which container
   container --version
   ```

2. 检查服务是否运行：
   ```bash
   container system start
   ```

3. 检查应用日志中的检测信息：
   ```bash
   # 在应用日志中查找检测消息
   grep "container runtime" logs/*.log
   ```

### 容器未被清理

1. 手动检查运行中容器：
   ```bash
   # Apple Container
   container list

   # Docker
   docker ps
   ```

2. 手动运行清理脚本：
   ```bash
   ./scripts/cleanup-containers.sh deer-flow-sandbox
   ```

### 性能问题

- 在 Apple Silicon 上，Apple Container 通常更快
- 如果遇到问题，可通过临时重命名 `container` 命令来强制使用 Docker：
   ```bash
   # 临时方案，不建议长期使用
   sudo mv /opt/homebrew/bin/container /opt/homebrew/bin/container.bak
   ```

## 参考资料

- [Apple Container GitHub](https://github.com/apple/container)
- [Apple Container 文档](https://github.com/apple/container/blob/main/docs/)
- [OCI 镜像规范](https://github.com/opencontainers/image-spec)
