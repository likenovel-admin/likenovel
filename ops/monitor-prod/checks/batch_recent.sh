#!/usr/bin/env bash
# 최근 1시간 배치 로그 ERROR/실패 카운트 — 타임스탬프 필수, 과거 실패 오탐 방지
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

out=$(cat <<'REMOTE' | ssh_was_stdin 2>/dev/null
set -u
dirs=(
  "/home/ln-admin/likenovel/logs"
  "/home/ln-admin/likenovel/batch/logs"
  "/home/ln-admin/likenovel/batch"
)
found=""
for d in "${dirs[@]}"; do
  if [ -d "$d" ]; then
    found="$d"
    break
  fi
done
if [ -z "$found" ]; then
  echo "MARKER_NO_DIR"
  exit 0
fi
echo "MARKER_DIR:$found"
find "$found" -maxdepth 2 -type f -name "*.log" -mmin -60 2>/dev/null | while read -r f; do
  run_block="$(awk '
    /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}( [A-Z]+)?\] \[INFO\] .* started$/ {
      capture=1
      block=$0 ORS
      next
    }
    /^\[[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}( [A-Z]+)?\] \[batch-empty\]/ {
      capture=1
      block=$0 ORS
      next
    }
    capture { block=block $0 ORS }
    END {
      if (capture) {
        printf "%s", block
      }
    }
  ' "$f")"

  if [ -n "$run_block" ]; then
    printf '%s' "$run_block" | grep -E 'ERROR|failed after [0-9]+ attempts|Lock wait timeout|Deadlock' | \
      awk -v fname="$(basename "$f")" '{print fname " | " $0}'
  else
    tail -n 2000 "$f" 2>/dev/null | grep -E 'ERROR|failed after [0-9]+ attempts|Lock wait timeout|Deadlock' | \
      awk -v fname="$(basename "$f")" '{print fname " | " $0}'
  fi
done
REMOTE
)
if [ -z "$out" ]; then
  emit "batch:recent_1h" "ssh-fail" "0 (1h)" "UNKNOWN" "ssh_was failed"
  exit 0
fi
if echo "$out" | grep -q "^MARKER_NO_DIR$"; then
  emit "batch:recent_1h" "no logs dir" "n/a" "UNKNOWN" "batch log dir not found on ln-was"
  exit 0
fi

dir_line=$(echo "$out" | grep '^MARKER_DIR:' | head -1 | sed 's/^MARKER_DIR://')
body=$(echo "$out" | grep -v '^MARKER_')

# 타임스탬프 있는 라인만 추려서 최근 60분 필터
recent=$(printf '%s' "$body" | filter_recent_minutes 60)
recent_cnt=$(echo -n "$recent" | grep -c '' || true)
# 타임스탬프 없는 라인 수 (UNKNOWN 재료)
if [ -n "$body" ]; then
  untimed_cnt=$(printf '%s' "$body" | grep -vcE '\[20[0-9]{2}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}' || true)
else
  untimed_cnt=0
fi

if [ "$recent_cnt" -eq 0 ] && [ "$untimed_cnt" -eq 0 ]; then
  emit "batch:recent_1h" "0" "0 (1h)" "OK" "dir=$dir_line"
elif [ "$recent_cnt" -gt 0 ]; then
  # 파일 샘플
  sample=$(echo "$recent" | awk -F' | ' '{print $1}' | sort -u | head -3 | tr '\n' ',' | sed 's/,$//')
  emit "batch:recent_1h" "$recent_cnt" "0 (1h)" "ALERT" "files=${sample:-?}"
else
  # timestamp 없는 실패 라인만 있는 경우 → UNKNOWN (과거 실패일 수 있음)
  emit "batch:recent_1h" "timestamp-missing:$untimed_cnt" "0 (1h)" "UNKNOWN" "no timestamp, cannot confirm recency"
fi
