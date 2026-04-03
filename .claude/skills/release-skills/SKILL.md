---
name: release-skills
description: Release workflow for the ship-skills repository. Use when the user says release, 发布, bump version, publish skills, push a new skill version, or update marketplace metadata for this repo.
---

# release-skills

Use this skill to release `ship-skills` safely and consistently.

## What this repo uses

- Claude Code marketplace metadata: `.claude-plugin/marketplace.json`
- Root version file: `package.json`
- Skill versions: each `skills/*/SKILL.md` may include its own `version`
- Changelogs: `CHANGELOG.md` and `CHANGELOG.zh.md`
- Publish entrypoint: `bash ./scripts/sync-clawhub.sh`
- Publish implementation: `scripts/sync-clawhub.mjs`

## Release workflow

### 1. Review changes

Check what changed before releasing:

```bash
git status --short
git log --oneline -n 20
```

If the working tree is dirty, either commit first or stop and ask the user.

### 2. Decide version bump

Default rules:

- `patch` → docs fixes, examples, metadata tweaks, non-breaking release script updates
- `minor` → new public skill, new commands, meaningful capability expansion
- `major` → breaking workflow or compatibility change

For this repo, the most common bump is `patch`.

### 3. Update versions

Update these places when needed:

- `package.json` version
- `.claude-plugin/marketplace.json` → `metadata.version`
- `skills/<skill>/SKILL.md` → `version` field when releasing a changed skill

Keep versions consistent when doing a repo release.

### 4. Update changelogs

Add a short top entry to:

- `CHANGELOG.md`
- `CHANGELOG.zh.md`

Keep it short and practical. Example:

```markdown
## 0.1.1 - 2026-04-03

- improve ClawHub publishing flow
- add Claude Code marketplace manifest
```

### 5. Validate before publish

Run:

```bash
npm test
npm run publish:dry
```

Expected behavior:

- local repo skills are discovered
- only `./skills/*` is considered for publish
- no unrelated OpenClaw shared skills are published

### 6. Publish

Login if needed:

```bash
clawhub login
```

Then publish:

```bash
npm run publish:all
```

This repo intentionally publishes skills by explicit folder using `clawhub publish`, not global `clawhub sync`.

### 7. Push git changes

After release-related file updates:

```bash
git add .
git commit -m "release: ship-skills <version>"
git push
```

## Release guardrails

- Do not publish if `npm test` fails
- Do not use global `clawhub sync` directly; use the repo wrapper script
- Keep `.claude-plugin/marketplace.json` in sync with the actual `skills/` list
- If adding a new skill, also add it to `.claude-plugin/marketplace.json`
- If a publish fails because of auth, tell the user to run `clawhub login`
- If a publish fails because of slug collision, stop and confirm the intended slug before retrying

## When adding a new skill

For a new skill under `skills/<name>/`, update all of these:

1. `README.md`
2. `README.zh.md`
3. `.claude-plugin/marketplace.json`
4. skill `SKILL.md` metadata
5. changelog files if this is part of a release

## Quick commands

```bash
npm test
npm run publish:dry
npm run publish:all
```
