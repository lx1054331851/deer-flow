# 安装指南

DeerFlow 的快速安装说明。

## 配置准备

DeerFlow 使用 YAML 配置文件，建议放在**项目根目录**。

### 步骤

1. **进入项目根目录**：
   ```bash
   cd /path/to/deer-flow
   ```

2. **复制示例配置**：
   ```bash
   cp config.example.yaml config.yaml
   ```

3. **编辑配置**：
   ```bash
   # 方式 A：设置环境变量（推荐）
   export OPENAI_API_KEY="your-key-here"

   # 方式 B：直接编辑 config.yaml
   vim config.yaml  # 或你习惯的编辑器
   ```

4. **验证配置**：
   ```bash
   cd backend
   python -c "from src.config import get_app_config; print('✓ Config loaded:', get_app_config().models[0].name)"
   ```

## 重要说明

- **位置**：`config.yaml` 应放在 `deer-flow/`（项目根目录），而不是 `deer-flow/backend/`
- **Git**：`config.yaml` 已自动加入 git ignore（包含敏感信息）
- **优先级**：若 `backend/config.yaml` 与 `../config.yaml` 同时存在，优先使用 backend 下的版本

## 配置文件查找位置

后端会按以下顺序查找 `config.yaml`：

1. 环境变量 `DEER_FLOW_CONFIG_PATH`（若已设置）
2. `backend/config.yaml`（从 backend 目录运行时的当前目录）
3. `deer-flow/config.yaml`（父目录，即**推荐位置**）

**推荐**：将 `config.yaml` 放在项目根目录（`deer-flow/config.yaml`）。

## 沙箱设置（可选但推荐）

如果你打算使用基于 Docker/Container 的沙箱（在 `config.yaml` 中配置 `sandbox.use: src.community.aio_sandbox:AioSandboxProvider`），强烈建议预拉取镜像：

```bash
# 在项目根目录
make setup-sandbox
```

**为什么要预拉取？**
- 沙箱镜像较大（约 500MB+），首次使用才拉取会等待较久
- 预拉取有明确进度提示
- 避免第一次用 Agent 时“看起来卡住”的困惑

如果跳过这一步，镜像会在首次执行 Agent 时自动拉取，耗时取决于你的网络速度（可能数分钟）。

## 故障排查

### 找不到配置文件

```bash
# 查看后端实际查找路径
cd deer-flow/backend
python -c "from src.config.app_config import AppConfig; print(AppConfig.resolve_config_path())"
```

如果仍找不到配置：
1. 确认已将 `config.example.yaml` 复制为 `config.yaml`
2. 确认当前目录正确
3. Check the file exists: `ls -la ../config.yaml`

### 权限不足

```bash
chmod 600 ../config.yaml  # 保护敏感配置
```

## 另请参阅

- [Configuration Guide](docs/CONFIGURATION.md) - 详细配置选项
- [Architecture Overview](CLAUDE.md) - 系统架构说明
