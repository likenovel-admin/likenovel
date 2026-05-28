#!/usr/bin/env bash
# CPU load avg (deep)
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_load() {
  local label="$1" ssh_fn="$2"
  local out
  out=$($ssh_fn 'nproc; cat /proc/loadavg' 2>/dev/null)
  if [ -z "$out" ]; then
    emit "cpu_load:$label" "ssh-fail" "nproc*${THRESH_LOAD_MULTIPLIER}" "UNKNOWN" "ssh failed"
    return
  fi
  local cores la1
  cores=$(echo "$out" | head -1)
  la1=$(echo "$out" | sed -n '2p' | awk '{print $1}')
  if ! [[ "$cores" =~ ^[0-9]+$ ]] || [ -z "$la1" ]; then
    emit "cpu_load:$label" "parse-fail" "nproc*${THRESH_LOAD_MULTIPLIER}" "UNKNOWN" "parse error"
    return
  fi
  # threshold = cores * 1.5
  local threshold
  threshold=$(awk -v c="$cores" -v m="$THRESH_LOAD_MULTIPLIER" 'BEGIN {printf "%.2f", c * m}')
  local v=OK
  awk -v la="$la1" -v th="$threshold" 'BEGIN { exit (la+0 > th+0) ? 0 : 1 }' && v=WARN
  emit "cpu_load:$label" "${la1} (cores=${cores})" "${threshold}" "$v" "load avg 1min"
}

check_load "ln-web" ssh_web
check_load "ln-was" ssh_was
