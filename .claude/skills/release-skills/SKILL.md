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
4. Run `scripts/sync-clawhub.sh --dry-run` first.
5. If dry run output looks correct, wire or run the real publish step.

## Repo pointers

- Publish entry: `scripts/sync-clawhub.sh`
- Publish implementation: `scripts/sync-clawhub.mjs`
- CI workflow: `.github/workflows/test.yml`
