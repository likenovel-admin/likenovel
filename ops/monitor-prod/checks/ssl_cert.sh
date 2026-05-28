#!/usr/bin/env bash
# SSL 인증서 만료일 (deep)
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_cert() {
  local host="$1" label="$2"
  local end_date
  end_date=$(echo | openssl s_client -connect "${host}:443" -servername "$host" 2>/dev/null \
             | openssl x509 -noout -enddate 2>/dev/null | sed 's/^notAfter=//')
  if [ -z "$end_date" ]; then
    emit "ssl:$label" "fetch-fail" "≥30일" "UNKNOWN" "cert not retrievable"
    return
  fi
  local end_ts now_ts days
  end_ts=$(date -d "$end_date" +%s 2>/dev/null)
  now_ts=$(date +%s)
  if [ -z "$end_ts" ]; then
    emit "ssl:$label" "parse-fail" "≥30일" "UNKNOWN" "date parse"
    return
  fi
  days=$(( (end_ts - now_ts) / 86400 ))
  local v=OK
  [ "$days" -lt 30 ] && v=WARN
  [ "$days" -lt 7 ]  && v=ALERT
  emit "ssl:$label" "${days}일 남음" "≥30일" "$v" "$host"
}

check_cert "www.likenovel.net"     "service"
check_cert "partner.likenovel.net" "partner"
check_cert "cms.likenovel.net"     "cms"
check_cert "api.likenovel.net"     "api"
