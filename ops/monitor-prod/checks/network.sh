#!/usr/bin/env bash
# 네트워크 established 커넥션 수 (deep)
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_net() {
  local label="$1" ssh_fn="$2"
  local cnt
  cnt=$($ssh_fn "ss -tan state established 2>/dev/null | wc -l" 2>/dev/null)
  if [ -z "$cnt" ] || ! [[ "$cnt" =~ ^[0-9]+$ ]]; then
    emit "net:established:$label" "parse-fail" "1000" "UNKNOWN" "ss failed"
    return
  fi
  [ "$cnt" -gt 0 ] && cnt=$((cnt - 1))
  local v=OK
  [ "$cnt" -ge 1000 ] && v=WARN
  [ "$cnt" -ge 3000 ] && v=ALERT
  emit "net:established:$label" "$cnt" "1000" "$v" "established TCP"
}

check_net "ln-web" ssh_web
check_net "ln-was" ssh_was
