#!/usr/bin/env bash
# MySQL 핵심 지표 (deep) — ln-was에서 api/.env 로드 후 prod RDS 질의
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

remote='
load_env_file() {
  local env_file="$1"
  local line key value quote

  while IFS= read -r line || [ -n "$line" ]; do
    line="${line%$'"'"'\r'"'"'}"

    case "$line" in
      ""|\#*) continue ;;
      export\ *=*) line="${line#export }" ;;
      *=*)
        key="${line%%=*}"
        value="${line#*=}"

        if [[ ! "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
          continue
        fi

        quote="${value:0:1}"
        if [[ "$quote" == "\"" || "$quote" == "'"'"'" ]] && [[ "${value: -1}" == "$quote" ]]; then
          value="${value:1:${#value}-2}"
        fi

        export "$key=$value"
        ;;
      *)
        ;;
    esac
  done < "$env_file"
}

load_env_file /home/ln-admin/likenovel/api/.env

if [ -z "${DB_IP:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_USER_ID:-}" ] || [ -z "${DB_USER_PW:-}" ]; then
  exit 0
fi

mysql -h "$DB_IP" -P "$DB_PORT" -u "$DB_USER_ID" -p"$DB_USER_PW" -N -B 2>/dev/null <<SQL | grep -E "^(Threads_connected|Threads_running|Slow_queries|Aborted_connects)\b"
SHOW GLOBAL STATUS WHERE Variable_name IN ("Threads_connected","Threads_running","Slow_queries","Aborted_connects");
SQL
'

out=$(printf '%s\n' "$remote" | ssh_was_stdin 2>/dev/null)
if [ -z "$out" ]; then
  emit "mysql:connect" "fail" "connect" "UNKNOWN" "mysql connect failed"
  exit 0
fi

get() { echo "$out" | awk -v k="$1" '$1==k {print $2}'; }
tc=$(get Threads_connected)
tr_=$(get Threads_running)
sq=$(get Slow_queries)
ac=$(get Aborted_connects)

[ -n "$tc" ]  && emit "mysql:threads_connected" "$tc"  "informational" "OK" "현재 커넥션 수" \
              || emit "mysql:threads_connected" "parse-fail" "n/a" "UNKNOWN" "parse"
[ -n "$tr_" ] && emit "mysql:threads_running"   "$tr_" "informational" "OK" "동시 실행 쿼리"
[ -n "$sq" ]  && emit "mysql:slow_queries"      "$sq"  "informational" "OK" "누적 slow (기동 후)"
[ -n "$ac" ]  && emit "mysql:aborted_connects"  "$ac"  "informational" "OK" "누적 aborted"
