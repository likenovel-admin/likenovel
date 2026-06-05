#!/usr/bin/env bash
# Websochat service health (deep): public page, backend routes, provider config, DB/runtime signals.
set -uo pipefail
# shellcheck disable=SC1091
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

page_result=$(curl -sS -o /dev/null -w "%{http_code}|%{time_total}" --max-time 10 "https://www.likenovel.net/websochat" 2>/dev/null || echo "000|-")
page_code="${page_result%%|*}"
page_time="${page_result##*|}"
case "$page_code" in
  2??|3??) emit "websochat:page" "${page_code} (${page_time}s)" "2xx/3xx" "OK" "https://www.likenovel.net/websochat" ;;
  000)     emit "websochat:page" "unreachable" "2xx/3xx" "UNKNOWN" "connection failed" ;;
  5??)     emit "websochat:page" "${page_code}" "2xx/3xx" "ALERT" "server error" ;;
  *)       emit "websochat:page" "${page_code}" "2xx/3xx" "WARN" "unexpected status" ;;
esac

check_api_smoke() {
  local url="$1" label="$2" marker="$3"
  local body_file code time
  body_file="$(mktemp)"
  local headers=()
  if [ "$label" = "billing_status_api" ]; then
    headers=(-H "X-Websochat-Guest-Key: monitor-guest-readonly")
  fi
  local result
  result=$(curl -sS -o "$body_file" -w "%{http_code}|%{time_total}" --max-time 10 "${headers[@]}" "$url" 2>/dev/null || echo "000|-")
  code="${result%%|*}"
  time="${result##*|}"
  case "$code" in
    2??)
      if grep -q "$marker" "$body_file"; then
        emit "websochat:$label" "${code} (${time}s)" "2xx + marker" "OK" "$url"
      else
        emit "websochat:$label" "${code} (${time}s)" "2xx + marker" "WARN" "marker not found: $marker"
      fi
      ;;
    000) emit "websochat:$label" "unreachable" "2xx" "UNKNOWN" "connection failed: $url" ;;
    5??) emit "websochat:$label" "${code}" "2xx" "ALERT" "$url" ;;
    *)   emit "websochat:$label" "${code}" "2xx" "WARN" "$url" ;;
  esac
  rm -f "$body_file"
}

check_api_smoke \
  "https://api.likenovel.net/v1/query/websochat/products?keyword=%EC%84%9C%EB%B9%84%EC%8A%A4&adult_yn=N" \
  "products_api" \
  "productId"
check_api_smoke \
  "https://api.likenovel.net/v1/query/websochat/billing-status" \
  "billing_status_api" \
  "freeRemainingMessages"

out=$(cat <<'REMOTE' | ssh_was_stdin 2>/dev/null
set -uo pipefail

python3 - <<'PY'
import json
import urllib.request

needed = [
    "/v1/query/websochat/products",
    "/v1/query/websochat/sessions",
    "/v1/query/websochat/billing-status",
    "/v1/command/websochat/sessions",
    "/v1/command/websochat/sessions/{session_id}/messages",
    "/v1/command/websochat/sessions/{session_id}/messages/stream",
    "/v1/command/websochat/sessions/{session_id}/next-episode",
]
try:
    with urllib.request.urlopen("http://10.0.100.110:3010/openapi.json", timeout=5) as response:
        paths = (json.load(response).get("paths") or {})
    missing = [path for path in needed if path not in paths]
    print("ROUTE_MISSING_COUNT=%d" % len(missing))
    print("ROUTE_MISSING=%s" % ",".join(missing))
except Exception as exc:
    print("ROUTE_ERROR=%s:%s" % (type(exc).__name__, exc))
PY

python3 - <<'PY'
from pathlib import Path

items = {}
for line in Path("/home/ln-admin/likenovel/api/.env").read_text(errors="ignore").splitlines():
    line = line.strip()
    if not line or line.startswith("#") or "=" not in line:
        continue
    key, value = line.split("=", 1)
    items[key.strip()] = value.strip().strip("\"'")
print("GEMINI_KEY=%s" % ("present" if items.get("GEMINI_API_KEY") else "missing"))
print("WEBSOCHAT_MODEL_ENV=%s" % (items.get("WEBSOCHAT_GEMINI_MODEL") or items.get("STORY_AGENT_GEMINI_MODEL") or items.get("GEMINI_MODEL") or "default"))
PY

journal_out=$(sudo -n journalctl -u likenovel-api.service --since '1 hour ago' --no-pager 2>/dev/null || true)
if [ -z "$journal_out" ]; then
  echo "JOURNAL_STATUS=empty-or-unreadable"
  echo "JOURNAL_WEBSOCHAT_LINES_1H=0"
  echo "JOURNAL_WEBSOCHAT_ERRORS_1H=0"
  echo "JOURNAL_WEBSOCHAT_REPLIES_1H=0"
else
  printf '%s\n' "$journal_out" | python3 - <<'PY'
import re
import sys

text = sys.stdin.read()
lines = [line for line in text.splitlines() if re.search(r"websochat|Gemini|AI_PROVIDER", line, re.I)]
errors = [
    line for line in lines
    if re.search(r"API error|API timeout|HTTP error|AI_PROVIDER_|Traceback|Exception|failed", line, re.I)
]
replies = [line for line in lines if "websochat reply_completed" in line]
print("JOURNAL_STATUS=ok")
print("JOURNAL_WEBSOCHAT_LINES_1H=%d" % len(lines))
print("JOURNAL_WEBSOCHAT_ERRORS_1H=%d" % len(errors))
print("JOURNAL_WEBSOCHAT_REPLIES_1H=%d" % len(replies))
PY
fi

source /home/ln-admin/likenovel/batch/cron_env.sh >/dev/null 2>&1 || true
if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PW:-}" ] || [ -z "${DB_NAME:-}" ]; then
  echo "DB_STATUS=missing-env"
  exit 0
fi

export MYSQL_PWD="$DB_PW"
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -D "$DB_NAME" -N -B 2>/dev/null <<'SQL' | awk -F'\t' '{print $1"="$2}'
SELECT 'DB_STATUS', 'ok'
UNION ALL SELECT 'SESSIONS_1H', COUNT(*) FROM tb_story_agent_session WHERE created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
UNION ALL SELECT 'SESSIONS_24H', COUNT(*) FROM tb_story_agent_session WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
UNION ALL SELECT 'MESSAGES_1H', COUNT(*) FROM tb_story_agent_message WHERE created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
UNION ALL SELECT 'MESSAGES_24H', COUNT(*) FROM tb_story_agent_message WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
UNION ALL SELECT 'USAGE_1H', COUNT(*) FROM tb_story_agent_usage_log WHERE created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
UNION ALL SELECT 'USAGE_24H', COUNT(*) FROM tb_story_agent_usage_log WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
UNION ALL SELECT 'FALLBACK_1H', COUNT(*) FROM tb_story_agent_usage_log WHERE created_date >= DATE_SUB(NOW(), INTERVAL 1 HOUR) AND fallback_used='Y'
UNION ALL SELECT 'FALLBACK_24H', COUNT(*) FROM tb_story_agent_usage_log WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND fallback_used='Y'
UNION ALL SELECT 'INCOMPLETE_USAGE_24H', COUNT(*) FROM tb_story_agent_usage_log WHERE created_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR) AND (user_message_id IS NULL OR assistant_message_id IS NULL)
UNION ALL
SELECT 'CONTEXT_FAILED', COUNT(*)
FROM tb_story_agent_context_product sacp
JOIN tb_product p ON p.product_id=sacp.product_id
WHERE sacp.context_status='failed'
  AND p.price_type='free'
  AND p.open_yn='Y'
  AND p.blind_yn='N';
SQL
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -D "$DB_NAME" -N -B 2>/dev/null <<'SQL' | awk -F'\t' '{print $1"="$2}'
SELECT 'CONTEXT_MISSING_PRODUCTS', COUNT(*)
FROM (
  SELECT
    p.product_id,
    SUM(CASE WHEN sacs.summary_id IS NULL THEN 1 ELSE 0 END) AS missing_open_episode_count
  FROM tb_product p
  JOIN tb_product_episode pe
    ON pe.product_id=p.product_id
   AND pe.use_yn='Y'
   AND pe.open_yn='Y'
  LEFT JOIN tb_story_agent_context_product sacp
    ON sacp.product_id=p.product_id
  LEFT JOIN tb_story_agent_context_summary sacs
    ON sacs.product_id=p.product_id
   AND sacs.summary_type='episode_summary'
   AND sacs.is_active='Y'
   AND sacs.scope_key=CONCAT('episode:', pe.episode_id)
  WHERE p.price_type='free'
    AND p.open_yn='Y'
    AND p.blind_yn='N'
    AND COALESCE(sacp.context_status,'pending') <> 'disabled'
  GROUP BY p.product_id
) x
WHERE x.missing_open_episode_count > 0;
SQL
REMOTE
)

if [ -z "$out" ]; then
  emit "websochat:runtime" "ssh-fail" "reachable" "UNKNOWN" "ssh_was failed"
  exit 0
fi

get_value() {
  printf '%s\n' "$out" | awk -F= -v key="$1" '$1==key {print substr($0, length(key) + 2); exit}'
}

route_error=$(get_value ROUTE_ERROR)
route_missing_count=$(get_value ROUTE_MISSING_COUNT)
route_missing=$(get_value ROUTE_MISSING)
if [ -n "$route_error" ]; then
  emit "websochat:routes" "openapi-fail" "0 missing" "UNKNOWN" "$route_error"
elif ! [[ "$route_missing_count" =~ ^[0-9]+$ ]]; then
  emit "websochat:routes" "parse-fail" "0 missing" "UNKNOWN" "openapi parse"
elif [ "$route_missing_count" -eq 0 ]; then
  emit "websochat:routes" "0 missing" "0 missing" "OK" "query/command/stream routes exposed"
else
  emit "websochat:routes" "$route_missing_count missing" "0 missing" "ALERT" "${route_missing:-missing route}"
fi

gemini_key=$(get_value GEMINI_KEY)
model_env=$(get_value WEBSOCHAT_MODEL_ENV)
if [ "$gemini_key" = "present" ]; then
  emit "websochat:gemini_key" "present" "present" "OK" "model=${model_env:-unknown}"
else
  emit "websochat:gemini_key" "${gemini_key:-missing}" "present" "ALERT" "GEMINI_API_KEY"
fi

journal_status=$(get_value JOURNAL_STATUS)
journal_errors=$(get_value JOURNAL_WEBSOCHAT_ERRORS_1H)
journal_replies=$(get_value JOURNAL_WEBSOCHAT_REPLIES_1H)
if [ -z "$journal_status" ]; then
  emit "websochat:journal_1h" "parse-fail" "0 errors" "UNKNOWN" "journal parse"
elif [ "$journal_status" != "ok" ]; then
  emit "websochat:journal_1h" "$journal_status" "0 errors" "UNKNOWN" "journal unreadable or empty"
elif [[ "$journal_errors" =~ ^[0-9]+$ ]] && [ "$journal_errors" -eq 0 ]; then
  emit "websochat:journal_errors_1h" "0" "0" "OK" "reply_completed=${journal_replies:-0}"
elif [[ "$journal_errors" =~ ^[0-9]+$ ]]; then
  emit "websochat:journal_errors_1h" "$journal_errors" "0" "ALERT" "provider/error-like websochat logs"
else
  emit "websochat:journal_errors_1h" "parse-fail" "0" "UNKNOWN" "journal count parse"
fi

db_status=$(get_value DB_STATUS)
if [ "$db_status" != "ok" ]; then
  emit "websochat:db" "${db_status:-missing}" "ok" "UNKNOWN" "DB query failed or env missing"
  exit 0
fi

sessions_1h=$(get_value SESSIONS_1H)
sessions_24h=$(get_value SESSIONS_24H)
messages_1h=$(get_value MESSAGES_1H)
messages_24h=$(get_value MESSAGES_24H)
usage_1h=$(get_value USAGE_1H)
usage_24h=$(get_value USAGE_24H)
fallback_1h=$(get_value FALLBACK_1H)
fallback_24h=$(get_value FALLBACK_24H)
incomplete_24h=$(get_value INCOMPLETE_USAGE_24H)
context_failed=$(get_value CONTEXT_FAILED)
context_missing=$(get_value CONTEXT_MISSING_PRODUCTS)

emit "websochat:usage_1h" "${usage_1h:-?} usage / ${messages_1h:-?} msg / ${sessions_1h:-?} sess" "informational" "OK" "recent activity"
emit "websochat:usage_24h" "${usage_24h:-?} usage / ${messages_24h:-?} msg / ${sessions_24h:-?} sess" "informational" "OK" "recent activity"

if [[ "$fallback_1h" =~ ^[0-9]+$ ]] && [ "$fallback_1h" -eq 0 ]; then
  emit "websochat:fallback_1h" "0" "0" "OK" "fallback_24h=${fallback_24h:-?}"
elif [[ "$fallback_1h" =~ ^[0-9]+$ ]]; then
  emit "websochat:fallback_1h" "$fallback_1h" "0" "WARN" "fallback_24h=${fallback_24h:-?}"
else
  emit "websochat:fallback_1h" "parse-fail" "0" "UNKNOWN" "fallback count parse"
fi

if [[ "$incomplete_24h" =~ ^[0-9]+$ ]] && [ "$incomplete_24h" -eq 0 ]; then
  emit "websochat:incomplete_usage_24h" "0" "0" "OK" "usage rows have user+assistant message ids"
elif [[ "$incomplete_24h" =~ ^[0-9]+$ ]]; then
  emit "websochat:incomplete_usage_24h" "$incomplete_24h" "0" "ALERT" "usage rows missing user/assistant link"
else
  emit "websochat:incomplete_usage_24h" "parse-fail" "0" "UNKNOWN" "usage integrity parse"
fi

if [[ "$context_failed" =~ ^[0-9]+$ ]] && [ "$context_failed" -eq 0 ]; then
  emit "websochat:context_failed" "0" "0" "OK" "tb_story_agent_context_product"
elif [[ "$context_failed" =~ ^[0-9]+$ ]]; then
  emit "websochat:context_failed" "$context_failed" "0" "WARN" "failed context products"
else
  emit "websochat:context_failed" "parse-fail" "0" "UNKNOWN" "context failed parse"
fi

if [[ "$context_missing" =~ ^[0-9]+$ ]] && [ "$context_missing" -eq 0 ]; then
  emit "websochat:context_missing_open_episode_products" "0" "0" "OK" "all open episode summaries present"
elif [[ "$context_missing" =~ ^[0-9]+$ ]]; then
  emit "websochat:context_missing_open_episode_products" "$context_missing" "0" "WARN" "open episode summaries missing"
else
  emit "websochat:context_missing_open_episode_products" "parse-fail" "0" "UNKNOWN" "context missing parse"
fi
