# ship-skills

Reusable OpenClaw/Agent skills for the Ship ecosystem.

## Repository Structure

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
├─ .gitignore
├─ .releaserc.yml
├─ CHANGELOG.md
├─ CHANGELOG.zh.md
├─ CLAUDE.md
├─ README.md
├─ README.zh.md
├─ package-lock.json
└─ package.json
```

## Skills

### dirs-submit

Submit URLs to `aidirs.org` and `backlinkdirs.com` through the `ship` CLI.

Location:

```text
skills/dirs-submit
```

Includes:

- browser login flow
- per-site token storage
- URL submission
- metadata preview via `fetch`
- version check and self-update guidance
- examples for success / auth failure / subscription failure

## Directory Roles

- `skills/` — public skill folders
- `scripts/` — repo automation and release helpers
- `docs/` — longer project docs
- `screenshots/` — images used in docs
- `packages/` — optional shared packages
- `.github/workflows/` — GitHub Actions workflows
- `.claude/skills/release-skills/` — internal release helper skill
- `.claude-plugin/` — marketplace/plugin metadata if needed later
