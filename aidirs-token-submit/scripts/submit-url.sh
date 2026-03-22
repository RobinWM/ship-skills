#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: AIDIRS_BASE_URL=https://aidirs.org AIDIRS_TOKEN=token $0 <url>" >&2
  exit 1
fi

if [[ -z "${AIDIRS_BASE_URL:-}" ]]; then
  echo "AIDIRS_BASE_URL is required" >&2
  exit 1
fi

if [[ -z "${AIDIRS_TOKEN:-}" ]]; then
  echo "AIDIRS_TOKEN is required" >&2
  exit 1
fi

URL="$1"

curl -sS -X POST "${AIDIRS_BASE_URL%/}/api/submit" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${AIDIRS_TOKEN}" \
  -d "$(printf '{\"link\":\"%s\"}' "$URL")"
