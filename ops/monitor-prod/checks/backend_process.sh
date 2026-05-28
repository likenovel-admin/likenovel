#!/usr/bin/env bash
# ln-was gunicorn PID / 포트 3010 바인딩 확인
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

out=$(cat <<'REMOTE' | ssh_was_stdin 2>/dev/null
pidfile=/home/ln-admin/likenovel/api/gunicorn.pid
gunicorn_cnt=0
mpid=""
source="pidfile"

if [ -f "$pidfile" ]; then
  mpid=$(cat "$pidfile" 2>/dev/null || true)
fi

if [ -n "${mpid:-}" ] && kill -0 "$mpid" 2>/dev/null; then
  workers=$(pgrep -P "$mpid" 2>/dev/null | wc -l | tr -d ' ')
  gunicorn_cnt=$((workers + 1))
else
  mpid=""
fi

if [ "$gunicorn_cnt" -lt 1 ]; then
  # CodeDeploy launches gunicorn outside systemd and pidfile can be absent.
  # Fall back to actual processes bound to prod port 3010 to avoid false alerts.
  port_pids=$(ss -ltnp 2>/dev/null \
    | awk '$4 ~ /:3010$/ {print}' \
    | grep -o 'pid=[0-9]*' \
    | cut -d= -f2 \
    | sort -n -u \
    || true)
  if [ -n "${port_pids:-}" ]; then
    gunicorn_cnt=$(echo "$port_pids" | wc -l | tr -d ' ')
    source="port3010"
    for pid in $port_pids; do
      ppid=$(ps -o ppid= -p "$pid" 2>/dev/null | tr -d ' ')
      if [ "$ppid" = "1" ]; then
        mpid="$pid"
        break
      fi
    done
    if [ -z "${mpid:-}" ]; then
      mpid=$(echo "$port_pids" | head -1)
    fi
  fi
fi

echo "GUNI:$gunicorn_cnt"
echo "SOURCE:$source"

listen=$(ss -tln 2>/dev/null | awk '$4 ~ /:3010$/ {print "L"}' | head -1)
echo "LISTEN:${listen:-N}"

if [ -n "${mpid:-}" ] && [ -r "/proc/$mpid/status" ]; then
  rss=$(awk '/VmRSS:/ {print $2}' "/proc/$mpid/status" 2>/dev/null)
  echo "RSS_KB:${rss:-0}"
fi
REMOTE
)
if [ -z "$out" ]; then
  emit "backend:gunicorn"  "ssh-fail" "≥1 worker" "UNKNOWN" "ssh_was failed"
  emit "backend:port3010"  "ssh-fail" "LISTEN"    "UNKNOWN" "ssh_was failed"
  exit 0
fi

cnt=$(echo "$out" | awk -F: '/^GUNI:/ {print $2}')
source=$(echo "$out" | awk -F: '/^SOURCE:/ {print $2}')
listen=$(echo "$out" | awk -F: '/^LISTEN:/ {print $2}')
rss_kb=$(echo "$out" | awk -F: '/^RSS_KB:/ {print $2}')

if ! [[ "$cnt" =~ ^[0-9]+$ ]]; then
  emit "backend:gunicorn" "parse-fail" "≥1 worker" "UNKNOWN" "pgrep parse"
elif [ "$cnt" -lt 1 ]; then
  emit "backend:gunicorn" "0 procs" "≥1 worker" "ALERT" "gunicorn not running"
else
  emit "backend:gunicorn" "${cnt} procs" "≥1 worker" "OK" "source=${source:-unknown}"
fi

if [ "${listen:-N}" = "L" ]; then
  emit "backend:port3010" "LISTEN" "LISTEN" "OK" "tcp 3010 bound"
else
  emit "backend:port3010" "NOT-LISTEN" "LISTEN" "ALERT" "tcp 3010 not bound"
fi

if [ -n "${rss_kb:-}" ] && [[ "$rss_kb" =~ ^[0-9]+$ ]] && [ "$rss_kb" -gt 0 ]; then
  rss_mb=$((rss_kb / 1024))
  emit "backend:gunicorn_rss" "${rss_mb}MB" "informational" "OK" "master RSS"
fi
