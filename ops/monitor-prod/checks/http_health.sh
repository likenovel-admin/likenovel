#!/usr/bin/env bash
# prod 공개 엔드포인트 HTTP 응답
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_http() {
  local url="$1" label="$2"
  local code time
  local result
  result=$(curl -sS -o /dev/null -w "%{http_code}|%{time_total}" --max-time 10 "$url" 2>/dev/null || echo "000|-")
  code="${result%%|*}"
  time="${result##*|}"
  case "$code" in
    2??|3??) emit "http:$label" "${code} (${time}s)" "2xx/3xx" "OK" "$url" ;;
    000)     emit "http:$label" "unreachable" "2xx" "UNKNOWN" "connection failed: $url" ;;
    5??)     emit "http:$label" "${code}" "2xx" "ALERT" "$url" ;;
    *)       emit "http:$label" "${code}" "2xx" "WARN" "$url" ;;
  esac
}

check_http "https://www.likenovel.net"          "service"
check_http "https://partner.likenovel.net"      "partner"
check_http "https://cms.likenovel.net"          "cms"
check_http "https://api.likenovel.net/health"   "api"
