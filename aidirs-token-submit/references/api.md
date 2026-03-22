# Aidirs token + submit reference

## Token management

Preferred token creation endpoint:

### Endpoint

`POST /api/token/create`

### Auth model

- requires an authenticated aidirs session
- typically called with browser cookies or a cookie jar via curl
- this route is not meant for anonymous use

### Body

```json
{
  "name": "My Integration"
}
```

### Success shape

```json
{
  "status": "success",
  "message": "API token created! Save it somewhere safe.",
  "token": "32-char-hex",
  "id": "..."
}
```

The dashboard token-management UI remains available at:

- `/settings/tokens`

Capabilities:

- create token
- rename token
- enable/disable token
- rotate token
- delete token
- see `lastUsedAt`

Current model:

- only `apiTokens[]` is supported
- old single-token legacy compatibility has been removed
- API auth only accepts enabled tokens in `apiTokens[]`

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
- `AIDIRS_COOKIE_JAR`

Create token via cookie jar:

```bash
AIDIRS_BASE_URL="https://aidirs.org" \
AIDIRS_COOKIE_JAR="./cookie.txt" \
./scripts/create-token.sh "My Integration"
```

Submit with token:

```bash
AIDIRS_BASE_URL="https://aidirs.org" \
AIDIRS_TOKEN="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
./scripts/submit-url.sh https://example.com
```

Do both:

```bash
AIDIRS_BASE_URL="https://aidirs.org" \
AIDIRS_COOKIE_JAR="./cookie.txt" \
./scripts/create-token-and-submit.sh "My Integration" https://example.com
```
