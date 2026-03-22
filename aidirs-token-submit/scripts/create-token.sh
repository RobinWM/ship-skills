#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: AIDIRS_BASE_URL=https://aidirs.org AIDIRS_COOKIE_JAR=./cookie.txt $0 <token-name>" >&2
  exit 1
fi

if [[ -z "${AIDIRS_BASE_URL:-}" ]]; then
  echo "AIDIRS_BASE_URL is required" >&2
  exit 1
fi

if [[ -z "${AIDIRS_COOKIE_JAR:-}" ]]; then
  echo "AIDIRS_COOKIE_JAR is required" >&2
  exit 1
fi

TOKEN_NAME="$1"

curl -sS -X POST "${AIDIRS_BASE_URL%/}/api/token/create" \
  -H "Content-Type: application/json" \
  -b "${AIDIRS_COOKIE_JAR}" -c "${AIDIRS_COOKIE_JAR}" \
  -d "$(printf '{\"name\":\"%s\"}' "$TOKEN_NAME")"
