# ship-skills

Ship 生态的 OpenClaw / Agent 可复用技能仓库。

## 仓库结构

```text
ship-skills/
├─ .claude-plugin/
├─ .claude/skills/release-skills/
├─ .github/workflows/
├─ docs/
├─ packages/
├─ screenshots/
├─ scripts/
├─ skills/
├─ README.md
└─ README.zh.md
```

## 当前技能

### dirs-submit

通过 `ship` CLI 向 `aidirs.org` 和 `backlinkdirs.com` 提交 URL。

位置：

```text
skills/dirs-submit
```

版本：`0.1.0`

包含：

- 浏览器登录
- 按站点分别存 token
- URL 提交
- `fetch` 元数据预览
- 版本检查与自更新说明
- 成功/鉴权失败/订阅失败示例

## Claude Code Marketplace

仓库已补上 `.claude-plugin/marketplace.json`，目标是支持类似下面的安装方式：

```text
/plugin marketplace add RobinWM/ship-skills
```

当前暴露的 plugin：

- `ship-skills` → `./skills/dirs-submit`

## 发布

```bash
clawhub login
npm run publish:dry
npm run publish:all
```

版本规则和 changelog 约定见 `docs/release.md`。
