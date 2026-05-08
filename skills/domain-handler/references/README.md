# Domain Registration + Cloudflare Onboarding Skill

## Goal

Automate the full workflow:

1. Check domain availability
2. Register domain via Spaceship API
3. Add domain to Cloudflare
4. Retrieve Cloudflare nameservers
5. Update registrar nameservers
6. Wait for Cloudflare activation

See [api.md](./api.md) for endpoint details, payload examples, and the TypeScript sample.

## Environment Variables

```bash
SPACESHIP_API_KEY=
SPACESHIP_API_SECRET=

CLOUDFLARE_API_TOKEN=
CLOUDFLARE_ACCOUNT_ID=
```

## Required API Permissions

### Spaceship

Required scopes:

```txt
Domains
Billing
Contacts
```

### Cloudflare

API Token permissions:

```txt
Zone:Edit
DNS:Edit
```
