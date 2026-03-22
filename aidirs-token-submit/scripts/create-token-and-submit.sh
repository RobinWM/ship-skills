#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: AIDIRS_BASE_URL=https://aidirs.org AIDIRS_COOKIE_JAR=./cookie.txt $0 <token-name> <url>" >&2
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
URL="$2"

CREATE_RESPONSE="$("$(dirname "$0")/create-token.sh" "$TOKEN_NAME")"
TOKEN="$(printf '%s' "$CREATE_RESPONSE" | node -e 'let s="";process.stdin.on("data",d=>s+=d);process.stdin.on("end",()=>{try{const j=JSON.parse(s); if(!j.token){process.exit(2)}; process.stdout.write(j.token)}catch{process.exit(3)}})')"

AIDIRS_TOKEN="$TOKEN" "$(dirname "$0")/submit-url.sh" "$URL"
