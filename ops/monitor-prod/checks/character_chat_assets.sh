#!/usr/bin/env bash
# Character-chat asset continuity audit (deep): read-only prod DB verification through the deployed backend CLI.
set -uo pipefail
# shellcheck disable=SC1091
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

out=$(cat <<'REMOTE' | ssh_was_stdin 2>/dev/null
set -uo pipefail
api_dir=/home/ln-admin/likenovel/api
audit_script="$api_dir/scripts/audit_character_chat_asset_readiness_db.py"
python_bin="$api_dir/.venv/bin/python"

if [ ! -f "$audit_script" ]; then
  echo "AUDIT_RC=127"
  echo "AUDIT_ERROR=audit-script-missing"
  exit 0
fi
if [ ! -x "$python_bin" ]; then
  echo "AUDIT_RC=126"
  echo "AUDIT_ERROR=runtime-python-missing"
  exit 0
fi

audit_out=$(cd "$api_dir" && "$python_bin" "$audit_script" \
  --env-file "$api_dir/.env" \
  --fail-on-actionable 2>&1)
audit_rc=$?
echo "AUDIT_RC=$audit_rc"
printf '%s\n' "$audit_out"
exit 0
REMOTE
)

if [ -z "$out" ]; then
  emit "character_chat:assets" "ssh-fail" "0 actionable" "UNKNOWN" "ssh_was failed"
  exit 0
fi

audit_rc=$(printf '%s\n' "$out" | awk -F= '$1=="AUDIT_RC" {print $2; exit}')
audit_error=$(printf '%s\n' "$out" | awk -F= '$1=="AUDIT_ERROR" {print $2; exit}')
metrics=$(printf '%s\n' "$out" | grep -v '^AUDIT_' | python3 -c '
import json
import sys

text = sys.stdin.read()
start = text.find("{")
try:
    summary = json.loads(text[start:]) if start >= 0 else {}
except json.JSONDecodeError:
    summary = {}
counts = dict(summary.get("actionPlanCounts") or {})
actionable = sum(
    int(count or 0)
    for action, count in counts.items()
    if action not in {"ready", "no_public_character_candidate"}
)
print("%s|%s" % (int(summary.get("productCount") or 0), actionable))
')
product_count="${metrics%%|*}"
actionable_count="${metrics##*|}"

case "$audit_rc" in
  0)
    if [[ "$product_count" =~ ^[0-9]+$ ]] && [[ "$actionable_count" =~ ^[0-9]+$ ]] && [ "$actionable_count" -eq 0 ]; then
      emit "character_chat:assets" "0 / ${product_count} products" "0 actionable" "OK" "exact-key RP and continuity audit"
    else
      emit "character_chat:assets" "parse-fail" "0 actionable" "UNKNOWN" "audit returned success without parseable zero-action summary"
    fi
    ;;
  1)
    emit "character_chat:assets" "${actionable_count:-?} / ${product_count:-?} products" "0 actionable" "ALERT" "identity/RP/scene asset repair required"
    ;;
  126|127)
    emit "character_chat:assets" "${audit_error:-runtime-missing}" "audit CLI available" "UNKNOWN" "deploy package/runtime incomplete"
    ;;
  *)
    emit "character_chat:assets" "exit=${audit_rc:-missing}" "exit 0 or 1" "UNKNOWN" "audit execution failed"
    ;;
esac
