# CLAUDE.md

## Repo rules

- Public skills live under `skills/`
- Keep `SKILL.md` lean; move longer docs into `references/`
- Put concrete outputs into `examples/`
- Put repo automation in `scripts/`
- Keep root README files as marketplace-style navigation docs

## Release flow

- Login first: `clawhub login`
- Dry run: `bash ./scripts/sync-clawhub.sh --dry-run`
- Publish repo skills only: `bash ./scripts/sync-clawhub.sh --all`
- Publish implementation uses explicit per-folder `clawhub publish`, not global `clawhub sync`
- Main implementation lives in `scripts/sync-clawhub.mjs`
- CI workflow: `.github/workflows/test.yml`
