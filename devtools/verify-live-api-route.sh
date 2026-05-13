#!/usr/bin/env bash
set -euo pipefail

usage() {
  cat <<'EOF'
Usage:
  devtools/verify-live-api-route.sh <prod|dev|api-base-url> <route> [METHOD] [JSON_BODY]

Examples:
  devtools/verify-live-api-route.sh prod /v1/command/admins/products/batch-monopoly POST '{"product_ids":[1133],"monopoly_yn":"Y"}'
  CMS_PROXY_BASE=https://cms.likenovel.net/api devtools/verify-live-api-route.sh prod /v1/command/admins/products/batch-monopoly POST '{"product_ids":[1133],"monopoly_yn":"Y"}'

Checks:
  1. The route and method exist in live /openapi.json.
  2. A direct live request does not return 404 or 5xx.
  3. If CMS_PROXY_BASE is set, the CMS proxy path is checked the same way.

For auth-protected routes, 400/401/403/422 are acceptable route-existence signals.
EOF
}

if [[ $# -lt 2 || "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  usage
  exit 2
fi

target="$1"
route="$2"
method="${3:-GET}"
body="${4:-{}}"

case "$target" in
  prod)
    api_base="https://api.likenovel.net"
    cms_proxy_base="${CMS_PROXY_BASE:-https://cms.likenovel.net/api}"
    ;;
  dev)
    api_base="https://api.likenovel.dev"
    cms_proxy_base="${CMS_PROXY_BASE:-https://cms.likenovel.dev/api}"
    ;;
  http://*|https://*)
    api_base="${target%/}"
    cms_proxy_base="${CMS_PROXY_BASE:-}"
    ;;
  *)
    echo "[ERROR] unknown target: $target" >&2
    usage >&2
    exit 2
    ;;
esac

if [[ "$route" != /* ]]; then
  echo "[ERROR] route must start with '/': $route" >&2
  exit 2
fi

method="$(printf '%s' "$method" | tr '[:lower:]' '[:upper:]')"
tmp_openapi="$(mktemp)"
tmp_body="$(mktemp)"
trap 'rm -f "$tmp_openapi" "$tmp_body"' EXIT

curl -fsS \
  -H "User-Agent: likenovel-live-route-check" \
  -H "Cache-Control: no-cache" \
  "$api_base/openapi.json" \
  -o "$tmp_openapi"

python3 - "$tmp_openapi" "$route" "$method" <<'PY'
import json
import sys

openapi_path, route, method = sys.argv[1], sys.argv[2], sys.argv[3].lower()
with open(openapi_path, "r", encoding="utf-8") as f:
    data = json.load(f)

paths = data.get("paths", {})
if route not in paths:
    print(f"[ERROR] route missing from live openapi: {route}", file=sys.stderr)
    sys.exit(1)

if method not in paths[route]:
    methods = ", ".join(sorted(paths[route].keys()))
    print(
        f"[ERROR] method missing from live openapi: {method.upper()} {route} "
        f"(available: {methods})",
        file=sys.stderr,
    )
    sys.exit(1)

print(f"[OK] openapi route exists: {method.upper()} {route}")
PY

request_status() {
  local base="$1"
  local label="$2"
  local url="${base%/}${route}"
  local status

  if [[ "$method" == "GET" ]]; then
    status="$(curl -sS -o "$tmp_body" -w '%{http_code}' "$url")"
  else
    status="$(curl -sS -o "$tmp_body" -w '%{http_code}' \
      -X "$method" \
      -H "Content-Type: application/json" \
      --data "$body" \
      "$url")"
  fi

  if [[ "$status" == "404" ]]; then
    echo "[ERROR] $label returned 404: $url" >&2
    sed -n '1,20p' "$tmp_body" >&2 || true
    return 1
  fi

  if [[ "$status" =~ ^5 ]]; then
    echo "[ERROR] $label returned $status: $url" >&2
    sed -n '1,20p' "$tmp_body" >&2 || true
    return 1
  fi

  echo "[OK] $label returned $status: $url"
}

request_status "$api_base" "direct-api"

if [[ -n "$cms_proxy_base" ]]; then
  request_status "$cms_proxy_base" "cms-proxy"
fi
