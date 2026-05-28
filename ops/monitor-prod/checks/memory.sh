#!/usr/bin/env bash
# 메모리 + swap: ln-web + ln-was
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_mem() {
  local label="$1" ssh_fn="$2"
  local out
  out=$($ssh_fn 'free -m' 2>/dev/null) || true
  if [ -z "$out" ]; then
    emit "memory:$label" "unreachable" "${THRESH_MEM_PCT}%" "UNKNOWN" "SSH/free failed"
    emit "swap:$label"   "unreachable" "${THRESH_SWAP_MB}MB" "UNKNOWN" "SSH/free failed"
    return
  fi
  local total used swap
  total=$(echo "$out" | awk '/^Mem:/ {print $2}')
  used=$(echo  "$out" | awk '/^Mem:/ {print $3}')
  swap=$(echo  "$out" | awk '/^Swap:/ {print $3}')
  if ! [[ "$total" =~ ^[0-9]+$ ]] || ! [[ "$used" =~ ^[0-9]+$ ]] || [ "$total" -eq 0 ]; then
    emit "memory:$label" "parse-fail" "${THRESH_MEM_PCT}%" "UNKNOWN" "free output"
  else
    local pct=$(( used * 100 / total ))
    local v=$(judge_pct "$pct" "$THRESH_MEM_PCT")
    emit "memory:$label" "${pct}% (${used}M/${total}M)" "${THRESH_MEM_PCT}%" "$v" "used/total"
  fi
  if ! [[ "$swap" =~ ^[0-9]+$ ]]; then
    emit "swap:$label" "parse-fail" "${THRESH_SWAP_MB}MB" "UNKNOWN" "swap parse"
  else
    local v=OK
    [ "$swap" -ge "$THRESH_SWAP_MB" ] && v=WARN
    emit "swap:$label" "${swap}M" "${THRESH_SWAP_MB}MB" "$v" "swap used"
  fi
}

check_mem "ln-web" ssh_web
check_mem "ln-was" ssh_was
