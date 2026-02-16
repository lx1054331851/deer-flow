# Fork 仓库同步上游与冲突处理指南

本文档用于将你 fork 的仓库与上游 `bytedance/deer-flow` 同步，并在发生冲突时完成合并。

## 1. 一次性配置上游仓库

```bash
git remote add upstream https://github.com/bytedance/deer-flow.git
git remote -v
```

预期至少看到：
- `origin` 指向你自己的 fork
- `upstream` 指向 `https://github.com/bytedance/deer-flow.git`

如果 `upstream` 已存在可跳过 `add`，或执行：

```bash
git remote set-url upstream https://github.com/bytedance/deer-flow.git
```

## 2. 同步主分支（merge 方式）

在本地 `main` 分支执行：

```bash
git checkout main
git fetch upstream
git merge upstream/main
```

如果你希望把同步结果推送到自己的 fork：

```bash
git push origin main
```

## 3. 冲突处理标准流程

当 `git merge upstream/main` 提示冲突时：

1. 查看冲突文件：

```bash
git status
```

2. 逐个解决冲突标记（`<<<<<<<`、`=======`、`>>>>>>>`），保留期望内容。

3. 标记为已解决：

```bash
git add <冲突文件1> <冲突文件2>
```

4. 完成合并提交：

```bash
git commit
```

5. 推送到 fork：

```bash
git push origin main
```

## 4. 推荐工作流（避免在 main 直接开发）

建议：
- `main` 仅用于同步上游
- 业务开发在功能分支进行

示例：

```bash
git checkout -b feat/your-feature
# 开发并提交
git fetch upstream
git rebase upstream/main
```

## 5. 网络故障排查（无法 fetch upstream）

如果出现如下错误：

```text
Failed to connect to github.com port 443
```

请按顺序检查：

1. 本机网络是否可访问 GitHub：

```bash
curl -I https://github.com
```

2. 代理环境变量是否设置：

```bash
env | grep -Ei '^(http|https|all|no)_proxy='
```

3. 如使用代理，配置 Git：

```bash
git config --global http.proxy  http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890
```

4. 不再需要代理时清除：

```bash
git config --global --unset http.proxy
git config --global --unset https.proxy
```

## 6. 当前仓库执行记录（2026-02-16）

已完成：
- 检查 `remote` 与分支状态
- 添加 `upstream` 指向上游仓库

未完成：
- `git fetch upstream`（当前环境无法连接 `github.com:443`）

网络恢复后，继续执行：

```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```
