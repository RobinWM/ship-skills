---
name: mkfast-env-init
description: Initialize environment variables for this mkfast-template repository and forks derived from it.
---

# Template Env Init

Set up environment variables for this repository without inventing new keys, mixing build-time and runtime config, or
overwriting existing secrets.

## Current template defaults

At the time this skill was written, the template defaults are:

- Auth is enabled.
- Google login is enabled in config, but Google env vars are optional.
- Mail is enabled with `cloudflare` provider.
- Newsletter is enabled with `resend` provider.
- Notification is enabled with `discord` provider.
- Storage is enabled with `r2` provider.
- Payment is disabled until `VITE_PAYMENT_PROVIDER` is set to `stripe` or `creem`.

Do not assume those defaults are still true. Re-check `src/config/website.ts` on every run and adapt.

## Core rules

1. Keep changes surgical. Only create or update env-related files the user asked for.
2. Preserve existing values in `.env.local` or `.env.production`. Append missing keys instead of replacing known values.
3. Never print secret values in chat unless the user explicitly asks.
4. Do not put D1/R2 bindings into env files as fake runtime vars. Bindings come from `wrangler.jsonc`.
5. If a feature is enabled in config but the user does not want to provide its env vars, say so clearly and offer the
   simpler option of disabling that feature in config instead of inventing placeholders.

## Default workflow

### 1. Use current folder name and ask for domain

Before any file changes, ask the user for:

- domain

Do not ask for the project name. Use the current folder name as the project name.

If the domain is missing, stop and ask before continuing. Do not guess.

Use the project name to update:

- `package.json` → `name`
- `wrangler.jsonc` → top-level `name`
- `wrangler.jsonc` → `d1_databases[0].database_name`

Use the domain to update:

- `.env.production` → `VITE_BASE_URL`
- `wrangler.jsonc` → `routes[0].pattern`

Use the bundled helper before env initialization:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --sync-project-metadata
node .agents/skills/template-env-init/scripts/init-env.mjs --domain your-domain
```

Domain handling rule:

- if the user provides a full URL such as `https://example.com`, write it directly to `VITE_BASE_URL` and write
  `example.com` to `routes[0].pattern`
- if the user provides a bare domain such as `example.com`, write `https://example.com` to `VITE_BASE_URL` and write
  `example.com` to `routes[0].pattern`

### 2. Copy `.env.example` to `.env.local` and `.env.production`

Start by syncing both local and production env files from `.env.example`. Use the bundled helper to create the target
file if it does not exist, or to append missing keys without overwriting existing values:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --target .env.local
node .agents/skills/template-env-init/scripts/init-env.mjs --target .env.production
```

If the user explicitly asks for a different target file, pass it with `--target`.

### 3. Fill required credentials from process env

After syncing the env files, read these values from the current process environment and write them into the target env
files:

- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_API_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `DISCORD_WEBHOOK_URL` when available
- `FAL_KEY` when available

Use the bundled helper in `--fill-cloudflare` mode:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --target .env.local --fill-cloudflare
node .agents/skills/template-env-init/scripts/init-env.mjs --target .env.production --fill-cloudflare
```

On Windows, if the current process does not already contain these variables, the helper should fall back to the user's
persistent `User` env vars first, then `Machine` env vars.

If any required process env value is missing, stop immediately and tell the user which variable is missing. Do not
continue with a partial setup. Optional values such as `DISCORD_WEBHOOK_URL` and `FAL_KEY` should be written when
present but should not block the rest of the setup when absent.

### 4. Confirm scope from the request

Map the task to one of these scopes:

- Local only: initialize `.env.local`
- Production only: initialize `.env.production` and deployment notes
- Full setup: initialize both local and production guidance

If the user says only "initialize env", default to creating both `.env.local` and `.env.production`, then provide a
short production checklist.

### 5. Create the remote D1 database and sync its ID

After project metadata has been set, create the remote D1 database using the already configured database name from
`wrangler.jsonc`:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --create-d1
```

The helper should run `wrangler d1 create <name>` using that existing `database_name`, then capture the created
`database_id` and write it to:

- `.env.local` → `CLOUDFLARE_DATABASE_ID`
- `.env.production` → `CLOUDFLARE_DATABASE_ID`
- `wrangler.jsonc` → `d1_databases[0].database_id`

Safety rule:

- this step creates a new remote D1 database and overwrites the existing `database_id` values in env files and
  `wrangler.jsonc`
- do not run it repeatedly unless the user intentionally wants a new database

### 6. Generate and fill `BETTER_AUTH_SECRET`

If `BETTER_AUTH_SECRET` is empty in the target env file, generate a secret with:

```bash
openssl rand -base64 32
```

Then write the generated value back into the target env file. If `BETTER_AUTH_SECRET` already has a non-empty value,
preserve it.

### 7. Apply fixed build-time values

Always set this build-time value in the target env files:

- `VITE_PLAUSIBLE_SCRIPT=https://plausible.allinaigc.org/js/script.js`

This value is fixed for this repository and should be written even if the placeholder in `.env.example` is empty.

### 8. Fill values based on enabled features

Decide which variables actually matter by combining:

- env schema in `src/env/client.ts` and `src/env/server.ts`
- feature toggles and providers in `src/config/website.ts`
- deployment mechanics in `docs/env.md`, `wrangler.jsonc`, and `.github/workflows/deploy.yml`

For the current template defaults, the usual checklist is:

- Required baseline:
  - `VITE_BASE_URL`
  - `BETTER_AUTH_SECRET`
- Needed if current defaults stay enabled:
  - `CLOUDFLARE_ACCOUNT_ID`
  - `CLOUDFLARE_API_TOKEN`
  - `RESEND_API_KEY`
  - `DISCORD_WEBHOOK_URL`
- Optional unless the user explicitly wants the feature:
  - Google OAuth vars
  - Stripe or Creem vars
  - Beehiiv vars
  - analytics vars
  - Crisp / affiliate vars
  - `FAL_KEY`

Important nuance:

- `storage.provider = 'r2'` uses the `BUCKET` binding from `wrangler.jsonc`, not an env var.
- `DB` is a D1 binding, not an env var.
- `CLOUDFLARE_DATABASE_ID` is for tooling or CI, not normal request-time app logic.

### 9. Generate safe defaults when appropriate

Do not generate fake API keys for third-party services.

### 10. Apply D1 migrations

After the remote D1 database has been created and `CLOUDFLARE_DATABASE_ID` has been written into env files, initialize
the actual databases with migrations. Choose the command based on the scope from step 4:

```bash
pnpm db:migrate:local
pnpm db:migrate:remote
```

Use the bundled helper for this explicit step:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --db-migrate-local
node .agents/skills/template-env-init/scripts/init-env.mjs --db-migrate-remote
node .agents/skills/template-env-init/scripts/init-env.mjs --db-migrate-all
```

Rules for this step:

- Local only: run `pnpm db:migrate:local`
- Production only: run `pnpm db:migrate:remote`
- Full setup: run local first, then remote

Why:

- `pnpm db:migrate:local` initializes the local D1 database used by `wrangler dev`
- `pnpm db:migrate:remote` initializes the remote Cloudflare D1 database and records migration history in
  `d1_migrations`

The remote migration step should provide `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, and `CLOUDFLARE_DATABASE_ID`
to the migration command from the current runtime env and/or the generated env files.

### 11. Sync GitHub and Worker secrets

After `.env.production` has been fully populated, run these deployment sync commands in order:

```bash
pnpm sync-github-secrets
pnpm sync-worker-secrets
```

Use the bundled helper for this final explicit step:

```bash
node .agents/skills/template-env-init/scripts/init-env.mjs --sync-secrets
```

This step pushes local configuration to external systems, so it should only run when the user intends to update GitHub
Actions secrets and Cloudflare Worker secrets.

### 12. Remind the user to configure Google OAuth URLs

If `auth.enable = true` and `auth.enableGoogleLogin = true` in `src/config/website.ts`, finish by reminding the user to
update the Google OAuth client configuration in Cloud Console:

- open:
  `https://console.cloud.google.com/auth/clients/482192285256-d7jfri07n54ss8q8gav695lu4517qh25.apps.googleusercontent.com?project=saasstarter-xyz`
- add Authorized JavaScript origin: the normalized base URL for the chosen domain, for example
  `https://mkfast.allinaigc.org`
- add Authorized redirect URI: `<normalized-base-url>/api/auth/callback/google`, for example
  `https://mkfast.allinaigc.org/api/auth/callback/google`

Use the same normalized domain handling as step 1:

- if the user provided `https://example.com`, use that exact value as the origin and
  `https://example.com/api/auth/callback/google` as the redirect URI
- if the user provided `example.com`, use `https://example.com` as the origin and
  `https://example.com/api/auth/callback/google` as the redirect URI

Do not skip this reminder when Google login is enabled, even if the env vars have already been filled successfully.

## Expected output

When you use this skill, finish with:

1. Which env files were created or updated
2. Which variables still need real values from the user
3. Which variables belong to build-time vs Worker runtime
4. Any feature/config mismatch you noticed
5. When Google login is enabled, the exact Google OAuth origin and redirect URI the user still needs to configure in
   Cloud Console. You should always give the full URL as
   `https://console.cloud.google.com/auth/clients/482192285256-d7jfri07n54ss8q8gav695lu4517qh25.apps.googleusercontent.com?project=saasstarter-xyz`

Keep the report practical and short.

## Example requests this skill should handle

**Example 1** Input: "Initialize `.env.local` for this template so I can start local dev." Behavior: sync `.env.local`
from `.env.example`, keep payment vars blank if payment is disabled, generate `BETTER_AUTH_SECRET`, and call out the
remaining third-party values still needed for enabled providers.

**Example 2** Input: "List which env vars belong in Cloudflare and which belong in GitHub Actions for this repo."
Behavior: separate `VITE_*` build env from Worker runtime secrets, mention `CLOUDFLARE_DATABASE_ID` as tooling/CI-only,
and avoid treating D1/R2 bindings as env vars.

**Example 3** Input: "I do not want Google login or payments yet. Give me the smallest env setup." Behavior: keep the
env setup minimal, and explicitly suggest disabling the corresponding feature flags if the current config would
otherwise expect them.
