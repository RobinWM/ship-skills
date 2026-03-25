# Aidirs token + submit reference

## Submission API

### Endpoint

`POST /api/submit`

### Headers

```http
Content-Type: application/json
Authorization: Bearer <32-char-lowercase-hex-token>
```

### Body

```json
{
  "link": "https://example.com"
}
```

### Notes

- server validates Bearer token format
- server updates `lastUsedAt` when a valid token is used
- server fetches website metadata automatically
- server then creates the submission/item

### Success shape

Typical JSON fields:

```json
{
  "status": "success",
  "message": "Successfully created",
  "id": "...",
  "nextPath": "/publish/..."
}
```

### Failure examples

#### Missing header

```json
{
  "message": "Missing Authorization header"
}
```

#### Invalid token format

```json
{
  "message": "Invalid token format"
}
```

#### Invalid body

```json
{
  "message": "Parameter 'link' is required"
}
```

#### Unauthorized

```json
{
  "message": "Unauthorized"
}
```

## Preview/fetch-only API

### Endpoint

`POST /api/fetch-website`

Same Bearer auth model. Use this when the goal is to inspect fetched site metadata without creating a final submission.

## CLI pattern

Use environment variables:

- `AIDIRS_BASE_URL`
- `AIDIRS_TOKEN`

Submit with token:

```bash
AIDIRS_BASE_URL="https://aidirs.org" \
AIDIRS_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
./scripts/submit-url.sh https://example.com
```
