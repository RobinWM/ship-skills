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

Version: `0.1.0`

Includes:

- browser login flow
- per-site token storage
- URL submission
- metadata preview via `fetch`
- version check and self-update guidance
- examples for success / auth failure / subscription failure

## Claude Code Marketplace

This repo now includes `.claude-plugin/marketplace.json` for marketplace-style installation.

Target usage:

```text
/plugin marketplace add RobinWM/ship-skills
```

Plugin exposed:

- `ship-skills` → `./skills/dirs-submit`

## Release

```bash
clawhub login
npm run publish:dry
npm run publish:all
```

See `docs/release.md` for versioning and changelog conventions.

## Directory Roles

- `skills/` — public skill folders
- `scripts/` — repo automation and release helpers
- `docs/` — longer project docs
- `screenshots/` — images used in docs
- `packages/` — optional shared packages
- `.github/workflows/` — GitHub Actions workflows
- `.claude/skills/release-skills/` — internal release helper skill
- `.claude-plugin/` — Claude Code marketplace metadata
