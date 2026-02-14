# 配置指南

本文档说明如何为你的环境配置 DeerFlow。

## 快速开始

1. **复制示例配置**（在项目根目录执行）：
   ```bash
  # 在项目根目录（deer-flow/）执行
   cp config.example.yaml config.yaml
   ```

2. **设置 API Key**：

  方式 A：使用环境变量（推荐）：
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   export ANTHROPIC_API_KEY="your-api-key-here"
  # 按需添加其他 key
   ```

  方式 B：直接编辑 `config.yaml`（生产环境不推荐）：
   ```yaml
   models:
     - name: gpt-4
      api_key: your-actual-api-key-here  # 替换占位值
   ```

    3. **启动应用**：
   ```bash
   make dev
   ```

## 配置章节

### Models

配置 Agent 可用的 LLM 模型：

```yaml
models:
  - name: gpt-4                    # 内部标识
    display_name: GPT-4            # 可读名称
    use: langchain_openai:ChatOpenAI  # LangChain 类路径
    model: gpt-4                   # API 使用的模型标识
    api_key: $OPENAI_API_KEY       # API key（使用环境变量）
    max_tokens: 4096               # 单次请求最大 token
    temperature: 0.7               # 采样温度
```

**支持的提供方**：
- OpenAI (`langchain_openai:ChatOpenAI`)
- Anthropic (`langchain_anthropic:ChatAnthropic`)
- DeepSeek (`langchain_deepseek:ChatDeepSeek`)
- 任意兼容 LangChain 的提供方

**Thinking 模型**：
部分模型支持用于复杂推理的 "thinking" 模式：

```yaml
models:
  - name: deepseek-v3
    supports_thinking: true
    when_thinking_enabled:
      extra_body:
        thinking:
          type: enabled
```

### Tool Groups

将工具按逻辑分组：

```yaml
tool_groups:
  - name: web          # Web 浏览与搜索
  - name: file:read    # 只读文件操作
  - name: file:write   # 写文件操作
  - name: bash         # Shell 命令执行
```

### Tools

配置 Agent 可用的具体工具：

```yaml
tools:
  - name: web_search
    group: web
    use: src.community.tavily.tools:web_search_tool
    max_results: 5
    # api_key: $TAVILY_API_KEY  # 可选
```

  **内置工具**：
  - `web_search` - 网页搜索（Tavily）
  - `web_fetch` - 抓取网页内容（Jina AI）
  - `ls` - 列出目录内容
  - `read_file` - 读取文件内容
  - `write_file` - 写入文件内容
  - `str_replace` - 文件内字符串替换
  - `bash` - 执行 bash 命令

### Sandbox

可选择本地执行或基于 Docker 的隔离执行：

**方案 1：本地沙箱**（默认，更易上手）：
```yaml
sandbox:
  use: src.sandbox.local:LocalSandboxProvider
```

**方案 2：Docker 沙箱**（隔离更强，更安全）：
```yaml
sandbox:
  use: src.community.aio_sandbox:AioSandboxProvider
  port: 8080
  auto_start: true
  container_prefix: deer-flow-sandbox

  # 可选：额外挂载目录
  mounts:
    - host_path: /path/on/host
      container_path: /path/in/container
      read_only: false
```

### Skills

配置技能目录，用于专项工作流：

```yaml
skills:
  # 宿主机路径（可选，默认：../skills）
  path: /custom/path/to/skills

  # 容器挂载路径（默认：/mnt/skills）
  container_path: /mnt/skills
```

**Skills 工作方式**：
- Skills 存储在 `deer-flow/skills/{public,custom}/`
- 每个 skill 包含带元数据的 `SKILL.md`
- 系统会自动发现并加载 skills
- 通过路径映射，local 与 Docker 沙箱都可使用

### Title Generation

自动生成会话标题：

```yaml
title:
  enabled: true
  max_words: 6
  max_chars: 60
  model_name: null  # 使用列表中的第一个模型
```

## 环境变量

DeerFlow 支持使用 `$` 前缀进行环境变量替换：

```yaml
models:
  - api_key: $OPENAI_API_KEY  # 从环境读取
```

**常用环境变量**：
- `OPENAI_API_KEY` - OpenAI API key
- `ANTHROPIC_API_KEY` - Anthropic API key
- `DEEPSEEK_API_KEY` - DeepSeek API key
- `TAVILY_API_KEY` - Tavily search API key
- `DEER_FLOW_CONFIG_PATH` - Custom config file path

## 配置文件位置

配置文件应放在**项目根目录**（`deer-flow/config.yaml`），而不是 backend 目录。

## 配置优先级

DeerFlow 按以下顺序查找配置：

1. 代码中通过 `config_path` 参数显式指定的路径
2. 环境变量 `DEER_FLOW_CONFIG_PATH` 指定路径
3. 当前工作目录下的 `config.yaml`（通常是运行时的 `backend/`）
4. 父目录中的 `config.yaml`（项目根目录：`deer-flow/`）

## 最佳实践

1. **将 `config.yaml` 放在项目根目录**，不要放在 `backend/`
2. **不要提交 `config.yaml` 到仓库**，它已在 `.gitignore` 中
3. **敏感信息用环境变量**，不要硬编码 API key
4. **及时更新 `config.example.yaml`**，同步记录新配置项
5. **先本地验证配置变更**，再部署
6. **生产环境使用 Docker 沙箱**，隔离与安全性更好

## 故障排查

### "Config file not found"
- 确保 `config.yaml` 位于**项目根目录**（`deer-flow/config.yaml`）
- 后端默认会查找父目录，因此推荐放在根目录
- 或者设置 `DEER_FLOW_CONFIG_PATH` 指向自定义位置

### "Invalid API key"
- 检查环境变量是否正确设置
- 检查配置中是否使用了 `$` 前缀引用环境变量

### "Skills not loading"
- 检查 `deer-flow/skills/` 目录是否存在
- 检查 skill 的 `SKILL.md` 是否有效
- 如果使用自定义路径，检查 `skills.path` 配置

### "Docker sandbox fails to start"
- 确认 Docker 已启动
- 检查 8080（或你配置的端口）是否可用
- 确认 Docker 镜像可访问

## Examples

完整配置示例请参考 `config.example.yaml`。
