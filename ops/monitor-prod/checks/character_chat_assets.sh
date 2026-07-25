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
    if start < 0:
        raise ValueError("JSON summary missing")
    summary = json.loads(text[start:])
    product_count = summary["productCount"]
    counts = summary["actionPlanCounts"]
    out_of_cohort_hold_count = summary["outOfCohortHoldCount"]
    if (
        isinstance(product_count, bool)
        or not isinstance(product_count, int)
        or product_count < 0
        or isinstance(out_of_cohort_hold_count, bool)
        or not isinstance(out_of_cohort_hold_count, int)
        or out_of_cohort_hold_count < 0
        or not isinstance(counts, dict)
        or any(
            isinstance(count, bool)
            or not isinstance(count, int)
            or count < 0
            for count in counts.values()
        )
    ):
        raise ValueError("invalid audit summary")
    non_actionable = (
        int(counts.get("ready") or 0)
        + int(counts.get("no_public_character_candidate") or 0)
        + out_of_cohort_hold_count
    )
    if non_actionable > product_count:
        raise ValueError("invalid non-actionable product count")
    actionable = product_count - non_actionable
    ready_count = int(counts.get("ready") or 0)
    ready_without_main = summary.get("readyWithoutMainProtagonistCount")
    if (
        isinstance(ready_without_main, bool)
        or not isinstance(ready_without_main, int)
        or ready_without_main < 0
        or ready_without_main > ready_count
    ):
        ready_without_main = "invalid"
    print("%s|%s|%s" % (product_count, actionable, ready_without_main))
except (json.JSONDecodeError, KeyError, TypeError, ValueError):
    print("invalid|invalid|invalid")
')
product_count="${metrics%%|*}"
remaining_metrics="${metrics#*|}"
actionable_count="${remaining_metrics%%|*}"
ready_without_main_count="${remaining_metrics##*|}"

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

if [ "$audit_rc" = "0" ] || [ "$audit_rc" = "1" ]; then
  if ! [[ "$ready_without_main_count" =~ ^[0-9]+$ ]]; then
    emit "character_chat:protagonist" "invalid" "0 ready without main" "UNKNOWN" "audit schema has invalid protagonist metric"
  elif [ "$ready_without_main_count" -eq 0 ]; then
    emit "character_chat:protagonist" "0 products" "0 ready without main" "OK" "identified protagonist coverage"
  else
    emit "character_chat:protagonist" "${ready_without_main_count} products" "0 ready without main" "WARN" "ready character surface has no identified main protagonist"
  fi
fi
