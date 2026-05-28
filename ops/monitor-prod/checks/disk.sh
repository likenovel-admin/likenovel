#!/usr/bin/env bash
# 디스크: ln-web + ln-was / 파티션 사용률
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

parse_disk_pct() {
  awk 'NR==2 { gsub("%","",$5); print $5 }'
}

for host in web was; do
  if [ "$host" = "web" ]; then
    out=$(ssh_web 'df -h /' 2>/dev/null)
    label="ln-web"
  else
    out=$(ssh_was 'df -h /' 2>/dev/null)
    label="ln-was"
  fi
  if [ -z "$out" ]; then
    emit "disk:$label" "unreachable" "${THRESH_DISK_PCT}%" "UNKNOWN" "SSH/df failed"
    continue
  fi
  pct=$(echo "$out" | parse_disk_pct)
  if ! [[ "$pct" =~ ^[0-9]+$ ]]; then
    emit "disk:$label" "parse-fail" "${THRESH_DISK_PCT}%" "UNKNOWN" "df output unexpected"
    continue
  fi
  used_line=$(echo "$out" | awk 'NR==2 {print $3"/"$2}')
  verdict=$(judge_pct "$pct" "$THRESH_DISK_PCT")
  emit "disk:$label" "${pct}% (${used_line})" "${THRESH_DISK_PCT}%" "$verdict" "/ partition"
done
