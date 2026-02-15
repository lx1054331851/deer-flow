# Skill 文档多语言规范（简版）

## 目标
- 保证前端设置页可展示本地化 Skill 说明。
- 保证大模型始终读取英文主文件，避免因本地化影响执行质量。

## 强制规则
- 每个 `skills/public/<skill-name>/` 目录**必须同时维护**：
  - `SKILL.md`（英文主文件，给模型读取）
  - `SKILL.zh-CN.md`（中文展示文件，给 UI 展示）

## 文件职责
- `SKILL.md`
  - 作为技能主文件与唯一执行基准。
  - 面向模型，内容保持英文、完整、可执行。
- `SKILL.zh-CN.md`
  - 用于本地化展示（当前主要用于 settings 中的技能说明）。
  - 至少保证 frontmatter 中 `description` 为中文。

## Frontmatter 约束
- 两个文件都应包含一致的关键元数据：
  - `name`（必须一致）
  - `description`
  - `license` / `metadata`（如存在，建议同步）

## 读取行为说明（当前实现）
- 模型技能加载路径固定为 `SKILL.md`（英文主文件）。
- 前端 skills 接口在传入 `locale=zh-CN` 时，优先读取 `SKILL.zh-CN.md` 的 `description`；不存在则回退 `SKILL.md`。

## 新增/修改 Skill 时的提交检查清单
- [ ] 新增 skill 时同时新增 `SKILL.md` 与 `SKILL.zh-CN.md`
- [ ] 修改 `SKILL.md` frontmatter 后，同步检查 `SKILL.zh-CN.md` 的 `name/description`
- [ ] `SKILL.zh-CN.md` 的 `description` 为可读中文（非占位）
- [ ] 不在中文文件中修改会影响执行的主流程逻辑（执行逻辑以英文主文件为准）

## 推荐命名
- 英文主文件：`SKILL.md`
- 中文文件：`SKILL.zh-CN.md`
- 后续其他语言可扩展：`SKILL.<locale>.md`（如 `SKILL.ja-JP.md`）
