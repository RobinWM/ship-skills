# Release Strategy

## Current skill versions

- `dirs-submit`: `0.1.0`
- `domain-handler`: `0.1.0`

## Versioning rule

- Start new public skills at `0.1.0`
- Use `patch` for docs/fixes
- Use `minor` for backward-compatible feature additions
- Use `major` for breaking workflow or interface changes

## Publish flow

```bash
clawhub login
npm run publish:dry
npm run publish:all
```

## Changelog rule

Use a short, single-line changelog for registry publishing, for example:

- `Initial public release`
- `Improve docs and examples`
- `Add per-site token handling notes`
