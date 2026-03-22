---
name: aidirs-token-submit
description: Generate aidirs API tokens through the authenticated token-creation API or the dashboard token page, then submit one or more website URLs to aidirs via the authenticated submit API. Use when the user asks to create a token, rotate/revoke a token, verify aidirs token usage, or submit sites to aidirs programmatically with Bearer authentication.
---

# Aidirs Token Submit

## Overview

Use this skill to handle the full aidirs API submission flow: create a token through the authenticated API (preferred) or dashboard, then use that token to submit URLs to `/api/submit`.

## Workflow

### 1. Create or manage a token

Preferred creation path:

- `POST /api/token/create`
- requires an authenticated aidirs session cookie
- request body: `{ "name": "My Integration" }`

Example:

```bash
curl -X POST "$AIDIRS_BASE_URL/api/token/create" \
  -H "Content-Type: application/json" \
  -b cookie.txt -c cookie.txt \
  -d '{"name":"My Integration"}'
```

Fallback/operator path:

- Settings page: `/settings`
- Token page: `/settings/tokens`

On that page they can:

- create a token
- rename a token
- enable/disable a token
- rotate a token
- delete a token
- inspect `lastUsedAt`

Use the API route when the goal is automation. Use the dashboard when the user wants manual control.

### 2. Confirm the target host

Before showing commands, identify the real aidirs base URL the user wants to hit, for example:

- `https://aidirs.org`
- `https://www.aidirs.org`
- a preview/staging domain
- localhost/dev URL

Use the exact host in examples and scripts.

### 3. Submit a URL with Bearer auth

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

### 4. Interpret responses

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

- `scripts/create-token.sh` to create a token with an authenticated cookie jar
- `scripts/submit-url.sh` to submit a URL with a Bearer token
- `scripts/create-token-and-submit.sh` to do both in sequence

Rules:

- Read the script before editing it
- Prefer env vars over hardcoding secrets
- Do not print tokens back into chat unless the user explicitly asks
- If automation uses cookies, store them in a local cookie jar file, not in the skill

## References

If you need exact request/response behavior or operator notes, read:

- `references/api.md`
