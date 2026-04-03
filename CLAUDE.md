# CLAUDE.md

## Repo rules

- Public skills live under `skills/`
- Keep `SKILL.md` lean; move longer docs into `references/`
- Put concrete outputs into `examples/`
- Put repo automation in `scripts/`
- Keep root README files as marketplace-style navigation docs

## Release direction

- `scripts/sync-clawhub.sh` is the entry point for future publish flow
- `.github/workflows/test.yml` should stay green on every push
