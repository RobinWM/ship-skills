---
name: aidirs-token-submit
description:
  Submit one or more website URLs to aidirs via the authenticated submit API using Bearer authentication. Use when the
  user asks to submit sites to aidirs programmatically with Bearer authentication.
---

# Aidirs Token Submit

## Overview

Use this skill to submit URLs to aidirs via the authenticated submit API using Bearer authentication.

## Workflow

### 1. Confirm the target host

Before showing commands, identify the real aidirs base URL the user wants to hit, for example:

- `https://aidirs.org`
- `https://www.aidirs.org`
- a preview/staging domain
- localhost/dev URL

Use the exact host in examples and scripts.

### 2. Submit a URL with Bearer auth

Aidirs submission endpoint:

- `POST /api/submit`
- Header: `Authorization: Bearer <token>`
- Body: `{ "link": "https://example.com" }`

Minimal example:

```bash
curl -X POST "$AIDIRS_BASE_URL/api/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AIDIRS_TOKEN" \
  -d '{"link":"https://example.com"}'
```

If the user wants to preview the AI-fetched site metadata without creating the record, use:

- `POST /api/fetch-website`

### 3. Interpret responses

Common outcomes:

- `200` with success payload: submission created
- `400`: bad `link`, duplicate site, or fetch/AI/image processing failure
- `401`: missing/invalid/disabled token
- `500`: server-side failure

If a request fails, check in this order:

1. token format is 32-char lowercase hex
2. token is enabled in `/settings/tokens`
3. target base URL is correct
4. request JSON is `{ "link": "..." }`
5. submitted site is reachable and not already present

## Scripts

If you need a reusable CLI flow, use:

- `scripts/submit-url.sh` to submit a URL with a Bearer token

Rules:

- Read the script before editing it
- Prefer env vars over hardcoding secrets
- Do not print tokens back into chat unless the user explicitly asks
- If automation uses cookies, store them in a local cookie jar file, not in the skill

## References

If you need exact request/response behavior or operator notes, read:

- `references/api.md`
