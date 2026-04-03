# ship-skills

Reusable OpenClaw/Agent skills for the Ship ecosystem.

## Structure

```text
ship-skills/
├─ README.md
└─ skills/
   └─ dirs-submit/
      ├─ SKILL.md
      ├─ README.md
      ├─ examples/
      └─ references/
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

## Conventions

- `SKILL.md` = agent-facing execution spec
- `README.md` = human-facing overview and usage
- `examples/` = concrete outputs and result shapes
- `references/` = detailed docs kept out of the main skill file
