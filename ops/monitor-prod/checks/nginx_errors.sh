#!/usr/bin/env bash
# ln-web nginx error.log 최근 1시간 카운트
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

# nginx 로그 형식: "2026/04/21 17:05:12 [error] ..."
out=$(ssh_web 'f=/var/log/nginx/error.log; if [ -r "$f" ]; then echo MARKER_READABLE; tail -n 500 "$f"; elif sudo -n test -r "$f" 2>/dev/null; then echo MARKER_READABLE; sudo -n tail -n 500 "$f" 2>/dev/null; else echo NO_READ; fi' 2>/dev/null)
if [ -z "$out" ]; then
  emit "nginx:errors_1h" "ssh-fail" "20 (1h)" "UNKNOWN" "ssh_web failed"
  exit 0
fi
if echo "$out" | head -1 | grep -q "^NO_READ$"; then
  emit "nginx:errors_1h" "no-read-perm" "20 (1h)" "UNKNOWN" "error.log not readable (sudo 필요)"
  exit 0
fi
if echo "$out" | head -1 | grep -q "^MARKER_READABLE$"; then
  out=$(echo "$out" | sed '1d')
fi

# 최근 1시간 타임스탬프 필터 (nginx 포맷: YYYY/MM/DD HH:MM:SS)
recent=$(python3 - <<'PY'
import sys, re, datetime
now = datetime.datetime.now()
cutoff = now - datetime.timedelta(hours=1)
pat = re.compile(r'^(\d{4}/\d{2}/\d{2} \d{2}:\d{2}:\d{2})')
for line in sys.stdin:
    m = pat.match(line)
    if not m:
        continue
    try:
        ts = datetime.datetime.strptime(m.group(1), '%Y/%m/%d %H:%M:%S')
    except ValueError:
        continue
    if ts >= cutoff:
        sys.stdout.write(line)
PY
<<< "$out")

cnt=$(echo -n "$recent" | grep -c '' || true)
v=OK
[ "$cnt" -ge 20 ] && v=WARN
[ "$cnt" -ge 100 ] && v=ALERT
emit "nginx:errors_1h" "$cnt" "20 (1h)" "$v" "error.log tail 500"
