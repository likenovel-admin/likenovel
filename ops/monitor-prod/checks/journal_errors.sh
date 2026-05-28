#!/usr/bin/env bash
# journal 최근 1시간 priority=err 카운트 (ln-web + ln-was)
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

check_journal() {
  local label="$1" ssh_fn="$2"
  local raw
  raw=$($ssh_fn "sudo -n journalctl -p err --since '1 hour ago' --no-pager 2>/dev/null | wc -l" 2>/dev/null)
  if [ -z "$raw" ] || ! [[ "$raw" =~ ^[0-9]+$ ]]; then
    emit "journal_err:$label" "sudo-denied-or-fail" "${THRESH_JOURNAL_ERR_1H} (1h)" "UNKNOWN" "journalctl/sudo 확인 필요"
    return
  fi
  # 빈 결과시 "No entries" 헤더 1줄 → 0으로 간주
  local effective=$raw
  [ "$effective" -le 1 ] && effective=0
  [ "$effective" -gt 0 ] && effective=$((effective > 1 ? effective - 0 : 0))
  local v=OK
  [ "$effective" -gt "$THRESH_JOURNAL_ERR_1H" ] && v=WARN
  emit "journal_err:$label" "$effective" "${THRESH_JOURNAL_ERR_1H} (1h)" "$v" "-p err"
}

check_journal "ln-web" ssh_web
check_journal "ln-was" ssh_was
