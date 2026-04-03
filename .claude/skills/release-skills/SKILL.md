---
name: release-skills
description: Release or publish skills from the ship-skills repository. Use when preparing marketplace packaging, checking skill folders before release, or running repository release scripts.
---

# release-skills

Use this skill when working on release flow for `ship-skills`.

## Workflow

1. Check the target skill folder under `skills/`.
2. Ensure each skill has at least `SKILL.md` and any needed `references/` or `examples/` files.
3. Review root docs so repository navigation stays accurate.
4. Run `bash ./scripts/sync-clawhub.sh --dry-run` first.
5. If output looks correct and ClawHub auth is ready, run `bash ./scripts/sync-clawhub.sh --all`.

## Repo pointers

- Publish entry: `scripts/sync-clawhub.sh`
- Publish implementation: `scripts/sync-clawhub.mjs`
- CI workflow: `.github/workflows/test.yml`
- ClawHub auth check: `clawhub whoami`
