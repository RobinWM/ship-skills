# API Reference

## Spaceship

### Check domain availability

```http
POST /v1/domains/available
```

Request:

```json
{
  "domains": [
    "example.com",
    "example.net",
    "example.org",
    "example.co",
    "example.pro",
    "example.io",
    "example.app"
  ]
}
```

### List contacts

```http
GET /v1/contacts
```

### Create contact

```http
POST /v1/contacts
```

### Register domain

```http
POST /v1/domains/{domain}
```

Example:

```json
{
  "years": 1,
  "autoRenew": false,
  "privacyProtection": {
    "level": "high",
    "userConsent": true
  },
  "contacts": {
    "registrant": "CONTACT_ID",
    "admin": "CONTACT_ID",
    "tech": "CONTACT_ID",
    "billing": "CONTACT_ID",
    "attributes": []
  }
}
```

### Update nameservers

```http
PUT /v1/domains/{domain}/nameservers
```

Request:

```json
{
  "provider": "custom",
  "hosts": [
    "amy.ns.cloudflare.com",
    "bob.ns.cloudflare.com"
  ]
}
```

## Cloudflare

### Add domain to Cloudflare

```http
POST /zones
```

Response contains:

```json
{
  "result": {
    "id": "ZONE_ID",
    "name_servers": [
      "amy.ns.cloudflare.com",
      "bob.ns.cloudflare.com"
    ]
  }
}
```

### Check activation status

```http
GET /zones/{zone_id}
```

Wait until:

```json
{
  "result": {
    "status": "active"
  }
}
```

## Complete TypeScript Example

```ts
const domain = "example.com"

// Add zone to Cloudflare
const zoneRes = await fetch(
  "https://api.cloudflare.com/client/v4/zones",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      account: {
        id: process.env.CLOUDFLARE_ACCOUNT_ID
      },
      name: domain,
      type: "full"
    })
  }
)

const zoneData = await zoneRes.json()

const zoneId = zoneData.result.id
const nameservers = zoneData.result.name_servers

// Update Spaceship nameservers
await fetch(
  `https://spaceship.dev/api/v1/domains/${domain}/nameservers`,
  {
    method: "PUT",
    headers: {
      "X-API-Key": process.env.SPACESHIP_API_KEY!,
      "X-API-Secret": process.env.SPACESHIP_API_SECRET!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      provider: "custom",
      hosts: nameservers
    })
  }
)

// Poll Cloudflare status
while (true) {
  const statusRes = await fetch(
    `https://api.cloudflare.com/client/v4/zones/${zoneId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    }
  )

  const statusData = await statusRes.json()

  if (statusData.result.status === "active") {
    console.log("Cloudflare activated")
    break
  }

  await new Promise(r => setTimeout(r, 30000))
}
```
