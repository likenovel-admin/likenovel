#!/usr/bin/env bash
# AI 파이프라인 배치(deep): cron, 프로세스/락, 최근 실행 로그, DB 결과를 함께 확인한다.
set -uo pipefail
CHECK_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "${CHECK_DIR}/../lib.sh"
ERROR_CLASSIFIER="${CHECK_DIR}/../classify_batch_error.py"

out=$(cat <<'REMOTE' | ssh_was_stdin 2>/dev/null
set -uo pipefail

active_cron=$(crontab -l 2>/dev/null | sed -E '/^[[:space:]]*#/d' || true)
if [ -z "$active_cron" ]; then
  echo "CRON_STATUS=empty-or-unreadable"
else
  echo "CRON_STATUS=ok"
fi

cron_count() {
  local pattern="$1"
  printf '%s\n' "$active_cron" | grep -Ec "$pattern" || true
}

echo "CRON_STORYCTX=$(cron_count 'build_story_agent_context_batch\.sh')"
echo "CRON_AI_DNA=$(cron_count 'ai_dna_extract_daily_batch\.sh')"
echo "CRON_AI_SIGNAL=$(cron_count 'ai_signal_daily_batch\.sh')"
echo "CRON_AI_TASTE=$(cron_count 'ai_taste_hourly_batch\.sh')"
echo "CRON_AI_TASTE_MANUAL=$(cron_count 'ai_taste_manual_replay_batch\.sh')"

STORYCTX_PROC=$(pgrep -fc '[/]scripts/build_story_agent_context\.py|[/]batch/build_story_agent_context_batch\.sh' || true)
AI_DNA_PROC=$(pgrep -fc '[/]batch/extract_product_dna\.py|[/]batch/ai_dna_extract_daily_batch\.sh' || true)
AI_SIGNAL_PROC=$(pgrep -fc '[/]batch/ai_signal_daily_batch\.sh' || true)
AI_TASTE_PROC=$(pgrep -fc '[/]batch/ai_taste_hourly_batch\.sh' || true)
export STORYCTX_PROC AI_DNA_PROC AI_SIGNAL_PROC AI_TASTE_PROC
echo "PROC_STORYCTX=$STORYCTX_PROC"
echo "PROC_AI_DNA=$AI_DNA_PROC"
echo "PROC_AI_SIGNAL=$AI_SIGNAL_PROC"
echo "PROC_AI_TASTE=$AI_TASTE_PROC"

lock_state() {
  local path="$1"
  local process_count="$2"
  if [ ! -d "$path" ]; then
    echo "absent"
  elif [ "$process_count" -gt 0 ]; then
    echo "active"
  else
    echo "stale"
  fi
}

echo "LOCK_STORYCTX=$(lock_state /tmp/build-story-agent-context-batch.lock "$STORYCTX_PROC")"
echo "LOCK_AI_DNA=$(lock_state /tmp/ai-dna-extract-daily-batch.lock "$AI_DNA_PROC")"

python3 - <<'PY'
from __future__ import annotations

import datetime as dt
import os
import re
from pathlib import Path

BATCH_DIR = Path("/home/ln-admin/likenovel/batch")
NOW = dt.datetime.now()
TIMESTAMP = re.compile(r"\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})(?: [A-Z]+)?\]")
STORYCTX_COMPLETION_RE = re.compile(r"build_story_agent_context_batch completed (?=[^\n]*\bready=(\d+)\b)(?=[^\n]*\bfailed=(\d+)\b)[^\n]*")


def safe(value: object) -> str:
    return str(value).replace("|", "/").replace("\n", " ")[:240]


def read_tail(path: Path, max_bytes: int = 5_000_000) -> str:
    if not path.exists():
        return ""
    with path.open("rb") as handle:
        size = handle.seek(0, 2)
        handle.seek(max(size - max_bytes, 0))
        return handle.read().decode("utf-8", errors="replace")


def last_run_block(text: str, start_pattern: re.Pattern[str]) -> tuple[str, dt.datetime | None]:
    lines = text.splitlines()
    start_index = -1
    started_at = None
    for index, line in enumerate(lines):
        if start_pattern.search(line):
            start_index = index
            match = TIMESTAMP.search(line)
            if match:
                try:
                    started_at = dt.datetime.strptime(match.group(1), "%Y-%m-%d %H:%M:%S")
                except ValueError:
                    started_at = None
    return ("\n".join(lines[start_index:]) if start_index >= 0 else ""), started_at


def find_error_sample(block: str) -> str:
    lines = block.splitlines()
    coded_patterns = (
        r"(?:status|code|http(?:\s+error)?)\s*[=:]?\s*(?:402|408|429|500|502|503|504|529)\b",
        r"\bERROR\s+(?:1205|1213|2003|2006|2013)\b",
        r"requires more credits|insufficient credit|lost connection to mysql",
    )
    for pattern in coded_patterns:
        for line in reversed(lines):
            if re.search(pattern, line, re.I):
                return safe(line)
    for line in reversed(lines):
        if re.search(r"timeout|timed out|connection refused|connection reset|Traceback|\[(?:error|fail)\]|failed", line, re.I):
            return safe(line)
    return ""


def emit_log(job: str, filename: str, start_regex: str, process_env: str) -> None:
    path = BATCH_DIR / filename
    text = read_tail(path)
    block, started_at = last_run_block(text, re.compile(start_regex, re.I))
    process_count = int(os.environ.get(process_env, "0") or 0)
    age_minutes = -1
    if started_at is not None:
        age_minutes = max(int((NOW - started_at).total_seconds() // 60), 0)

    status = "unknown"
    detail = "last run boundary not found"
    if not path.exists():
        status = "missing"
        detail = f"missing {filename}"
    elif block:
        if job == "storyctx":
            completed = STORYCTX_COMPLETION_RE.findall(block)
            if completed:
                ready, failed = completed[-1]
                status = "success" if int(failed) == 0 else "failed"
                detail = f"ready={ready} failed={failed}"
            elif re.search(r"\[(?:error|fail)\]|Traceback|ERROR 20\d\d", block, re.I):
                status = "failed"
                detail = "error/fail marker in latest run"
            elif process_count > 0:
                status = "running"
                detail = f"processes={process_count}"
            else:
                detail = "latest run has no terminal marker and no process"
        elif job == "ai_dna":
            done = re.findall(r"\[DONE\]\s*성공:\s*(\d+),\s*실패:\s*(\d+)", block)
            exits = re.findall(r"completed with exit=(\d+)", block)
            if done:
                success_count, failure_count = done[-1]
                status = "success" if int(failure_count) == 0 and (not exits or exits[-1] == "0") else "failed"
                detail = f"success={success_count} failed={failure_count} exit={exits[-1] if exits else '?'}"
            elif process_count > 0:
                status = "running"
                detail = f"processes={process_count}"
            elif exits:
                status = "success" if exits[-1] == "0" else "failed"
                detail = f"exit={exits[-1]} result-counts=missing"
            else:
                detail = "latest run has no result counts or terminal marker"
        else:
            exits = re.findall(r"completed with exit=(\d+)", block)
            if exits:
                status = "success" if exits[-1] == "0" else "failed"
                detail = f"exit={exits[-1]}"
            elif process_count > 0:
                status = "running"
                detail = f"processes={process_count}"
            elif re.search(r"\[ERROR\]|Traceback|failed", block, re.I):
                status = "failed"
                detail = "error/fail marker in latest run"
            else:
                detail = "latest run has no terminal marker and no process"

    print(f"LOG_{job.upper()}_STATUS={safe(status)}")
    print(f"LOG_{job.upper()}_AGE_MIN={age_minutes}")
    print(f"LOG_{job.upper()}_DETAIL={safe(detail)}")
    print(f"LOG_{job.upper()}_ERROR_SAMPLE={find_error_sample(block) if status == 'failed' else ''}")


emit_log(
    "storyctx",
    "build_story_agent_context_batch.log",
    r"build_story_agent_context_batch started",
    "STORYCTX_PROC",
)
emit_log(
    "ai_dna",
    "ai_dna_extract_daily_batch.log",
    r"ai_dna_extract_daily_batch started|Starting AI DNA extract batch",
    "AI_DNA_PROC",
)
emit_log(
    "ai_signal",
    "ai_signal_daily_batch.log",
    r"ai_signal_daily_batch started|Starting AI signal daily batch",
    "AI_SIGNAL_PROC",
)
emit_log(
    "ai_taste",
    "ai_taste_hourly_batch.log",
    r"ai_taste_hourly_batch started|Starting AI taste hourly batch",
    "AI_TASTE_PROC",
)

manual_logs = sorted(BATCH_DIR.glob("character_chat_*.log"), key=lambda item: item.stat().st_mtime)
recent_manual_logs = [item for item in manual_logs if NOW.timestamp() - item.stat().st_mtime <= 7 * 86400]
print(f"CHARACTER_MANUAL_LOGS_7D={len(recent_manual_logs)}")
if manual_logs:
    latest = manual_logs[-1]
    latest_age = max(int((NOW.timestamp() - latest.stat().st_mtime) // 60), 0)
    print(f"CHARACTER_MANUAL_LATEST={safe(latest.name)}")
    print(f"CHARACTER_MANUAL_LATEST_AGE_MIN={latest_age}")
else:
    print("CHARACTER_MANUAL_LATEST=none")
    print("CHARACTER_MANUAL_LATEST_AGE_MIN=-1")
PY

if [ ! -r /home/ln-admin/likenovel/batch/cron_env.sh ]; then
  echo "DB_STATUS=missing-env"
  exit 0
fi
# shellcheck disable=SC1091
source /home/ln-admin/likenovel/batch/cron_env.sh >/dev/null 2>&1 || true
if [ -z "${DB_HOST:-}" ] || [ -z "${DB_PORT:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PW:-}" ] || [ -z "${DB_NAME:-}" ]; then
  echo "DB_STATUS=missing-env"
  exit 0
fi

export MYSQL_PWD="$DB_PW"
MYSQL=(mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -D "$DB_NAME" --connect-timeout=5 -N -B)
if ! "${MYSQL[@]}" -e "SELECT 1" >/dev/null 2>&1; then
  echo "DB_STATUS=connect-fail"
  exit 0
fi
echo "DB_STATUS=ok"

for job in ai_dna_extract_daily_batch.sh ai_signal_daily_batch.sh ai_taste_hourly_batch.sh; do
  key=$(printf '%s' "$job" | tr '[:lower:].-' '[:upper:]__')
  value=$("${MYSQL[@]}" -e "
    SELECT CONCAT(
      COALESCE(completed_yn, '?'), ',',
      COALESCE(DATE_FORMAT(updated_date, '%Y-%m-%d %H:%i:%s'), '?'), ',',
      COALESCE(DATE_FORMAT(last_processed_date, '%Y-%m-%d %H:%i:%s'), '?')
    )
    FROM tb_cms_batch_job_process
    WHERE job_file_id='${job}'
    ORDER BY updated_date DESC, id DESC
    LIMIT 1
  " 2>/dev/null || true)
  echo "JOB_${key}=${value:-missing}"
done

"${MYSQL[@]}" 2>/dev/null <<'SQL' | awk -F'\t' 'NF >= 2 {print $1"="$2}'
SELECT 'CONTEXT_FAILED_VISIBLE_ONGOING', COUNT(*)
FROM tb_story_agent_context_product cp
JOIN tb_product p ON p.product_id=cp.product_id
WHERE cp.context_status='failed'
  AND p.price_type IN ('free','paid')
  AND p.status_code='ongoing'
  AND p.open_yn='Y'
  AND p.blind_yn='N';

WITH ranked_public_episodes AS (
  SELECT public_episode.product_id,
         public_episode.episode_id,
         ROW_NUMBER() OVER (
           PARTITION BY public_episode.product_id
           ORDER BY public_episode.episode_no ASC, public_episode.episode_id ASC
         ) AS public_episode_rank
  FROM tb_product_episode public_episode
  WHERE public_episode.use_yn = 'Y'
    AND public_episode.open_yn = 'Y'
),
collected_episode_scopes AS (
  SELECT ranked_episode.product_id,
         CONCAT('episode:', ranked_episode.episode_id) AS scope_key
  FROM ranked_public_episodes ranked_episode
  WHERE ranked_episode.public_episode_rank <= 30
),
foundation_mismatches AS (
  SELECT p.product_id,
         CASE
           WHEN COALESCE(p.ai_content_service_enabled_yn, 'N') = 'Y'
            AND COALESCE(cp.context_status, 'pending') <> 'disabled'
            AND (
              COALESCE(cp.context_status, 'pending') = 'ready'
              OR EXISTS (
                SELECT 1
                FROM tb_product_episode cohort_episode
                WHERE cohort_episode.product_id = p.product_id
                  AND cohort_episode.use_yn = 'Y'
                  AND cohort_episode.open_yn = 'Y'
                GROUP BY cohort_episode.product_id
                HAVING COUNT(*) >= 15
                   AND MIN(COALESCE(
                     cohort_episode.open_changed_date,
                     cohort_episode.publish_reserve_date,
                     cohort_episode.created_date
                   )) >= '2026-03-01 00:00:00'
              )
            )
           THEN 1
           ELSE 0
         END AS actionable,
         COUNT(DISTINCT CASE WHEN s.summary_type='episode_summary' AND collected_episode.scope_key IS NOT NULL THEN s.scope_key END) AS episode_summary_count,
         COUNT(DISTINCT CASE WHEN s.summary_type='episode_character_signals' AND collected_episode.scope_key IS NOT NULL THEN s.scope_key END) AS signal_count,
         COUNT(DISTINCT CASE WHEN s.summary_type='character_inventory' THEN s.scope_key END) AS inventory_count,
         COUNT(DISTINCT CASE WHEN s.summary_type='character_inventory_v3' THEN s.scope_key END) AS inventory_v3_count
  FROM tb_product p
  LEFT JOIN tb_story_agent_context_product cp
    ON cp.product_id=p.product_id
  LEFT JOIN tb_story_agent_context_summary s
    ON s.product_id=p.product_id
   AND s.is_active='Y'
  LEFT JOIN collected_episode_scopes collected_episode
    ON collected_episode.product_id=s.product_id
   AND collected_episode.scope_key=s.scope_key
  WHERE p.price_type IN ('free','paid')
    AND p.status_code='ongoing'
    AND p.open_yn='Y'
    AND COALESCE(p.blind_yn, 'N')='N'
  GROUP BY p.product_id, p.ai_content_service_enabled_yn, cp.context_status
  HAVING episode_summary_count <> signal_count
      OR (signal_count > 0 AND inventory_count = 0)
      OR (signal_count > 0 AND inventory_v3_count = 0)
)
SELECT 'STORY_FOUNDATION_MISMATCH_ACTIONABLE', COALESCE(SUM(actionable), 0)
FROM foundation_mismatches
UNION ALL
SELECT 'STORY_FOUNDATION_MISMATCH_OUT_OF_POLICY', COALESCE(SUM(actionable = 0), 0)
FROM foundation_mismatches;

SELECT CONCAT('SUMMARY_', UPPER(summary_type)), COUNT(*)
FROM tb_story_agent_context_summary s
JOIN tb_product p ON p.product_id=s.product_id
WHERE s.is_active='Y'
  AND p.price_type IN ('free','paid')
  AND p.status_code='ongoing'
  AND p.open_yn='Y'
  AND p.blind_yn='N'
  AND s.summary_type IN (
    'episode_summary', 'range_summary', 'product_summary',
    'character_snapshot', 'relation_snapshot', 'world_snapshot',
    'episode_character_signals', 'episode_scene_extraction',
    'character_inventory', 'character_inventory_v3', 'relation_inventory',
    'character_rp_profile', 'character_rp_examples', 'character_chat_opening_v1'
  )
GROUP BY s.summary_type;

SELECT CONCAT('DNA_STATUS_', UPPER(COALESCE(analysis_status, 'missing'))), COUNT(*)
FROM tb_product_ai_metadata
GROUP BY COALESCE(analysis_status, 'missing');

SELECT 'DNA_FAILED_24H', COUNT(*)
FROM tb_product_ai_metadata
WHERE analysis_status='failed'
  AND updated_date >= DATE_SUB(NOW(), INTERVAL 24 HOUR);

SELECT 'AI_SIGNAL_DAILY_YESTERDAY_ROWS', COUNT(*)
FROM tb_user_ai_signal_event_daily
WHERE stat_date=DATE_SUB(CURDATE(), INTERVAL 1 DAY);

SELECT 'AI_TASTE_FACTOR_ROWS', COUNT(*) FROM tb_user_taste_factor_score;
SELECT 'AI_TASTE_UPDATED_2H_ROWS', COUNT(*)
FROM tb_user_taste_factor_score
WHERE updated_date >= DATE_SUB(NOW(), INTERVAL 2 HOUR);
SQL
REMOTE
)

if [ -z "$out" ]; then
  emit "ai_pipeline:ssh" "failed" "reachable" "UNKNOWN" "ssh_was failed"
  exit 0
fi

get_value() {
  printf '%s\n' "$out" | awk -F= -v key="$1" '$1==key {print substr($0, length(key) + 2); exit}'
}

emit_cron() {
  local key="$1" label="$2"
  local value
  value=$(get_value "$key")
  if [[ "$value" =~ ^[0-9]+$ ]] && [ "$value" -eq 1 ]; then
    emit "ai_pipeline:cron:${label}" "$value" "1 active entry" "OK" "live crontab"
  elif [[ "$value" =~ ^[0-9]+$ ]]; then
    emit "ai_pipeline:cron:${label}" "$value" "1 active entry" "ALERT" "missing or duplicate live cron entry"
  else
    emit "ai_pipeline:cron:${label}" "parse-fail" "1 active entry" "UNKNOWN" "live crontab parse"
  fi
}

emit_log() {
  local key="$1" label="$2" max_age="$3"
  local status age detail error_sample classification error_source error_class error_code error_meaning
  status=$(get_value "LOG_${key}_STATUS")
  age=$(get_value "LOG_${key}_AGE_MIN")
  detail=$(get_value "LOG_${key}_DETAIL")
  error_sample=$(get_value "LOG_${key}_ERROR_SAMPLE")
  if [ "$status" = "failed" ]; then
    classification=$(python3 "$ERROR_CLASSIFIER" "$error_sample" 2>/dev/null || true)
    IFS=$'\t' read -r error_source error_class error_code error_meaning <<< "$classification"
    emit \
      "ai_pipeline:log:${label}" \
      "failed source=${error_source:-unknown} class=${error_class:-unknown_error} code=${error_code:-UNKNOWN} age=${age:-?}m" \
      "success/running <= ${max_age}m" \
      "ALERT" \
      "${detail:-latest run failed}; ${error_meaning:-classification failed}"
  elif [ "$status" = "running" ] && [[ "$age" =~ ^[0-9]+$ ]]; then
    emit "ai_pipeline:log:${label}" "running age=${age}m" "success/running <= ${max_age}m" "OK" "${detail:-in flight}"
  elif [ "$status" = "success" ] && [[ "$age" =~ ^[0-9]+$ ]] && [ "$age" -le "$max_age" ]; then
    emit "ai_pipeline:log:${label}" "success age=${age}m" "success/running <= ${max_age}m" "OK" "${detail:-latest run succeeded}"
  elif [ "$status" = "success" ] && [[ "$age" =~ ^[0-9]+$ ]]; then
    emit "ai_pipeline:log:${label}" "stale-success age=${age}m" "success/running <= ${max_age}m" "ALERT" "${detail:-latest success is stale}"
  else
    emit "ai_pipeline:log:${label}" "${status:-parse-fail} age=${age:-?}m" "success/running <= ${max_age}m" "UNKNOWN" "${detail:-latest run parse}"
  fi
}

emit_process() {
  local key="$1" label="$2"
  local value
  value=$(get_value "$key")
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    emit "ai_pipeline:process:${label}" "$value" "informational" "OK" "$([ "$value" -gt 0 ] && echo active || echo idle)"
  else
    emit "ai_pipeline:process:${label}" "parse-fail" "informational" "UNKNOWN" "process count"
  fi
}

emit_lock() {
  local key="$1" label="$2"
  local value
  value=$(get_value "$key")
  case "$value" in
    absent|active) emit "ai_pipeline:lock:${label}" "$value" "absent/active" "OK" "runtime lock" ;;
    stale) emit "ai_pipeline:lock:${label}" "$value" "absent/active" "ALERT" "lock exists without matching process" ;;
    *) emit "ai_pipeline:lock:${label}" "${value:-parse-fail}" "absent/active" "UNKNOWN" "lock state" ;;
  esac
}

emit_job() {
  local key="$1" label="$2" process_key="$3"
  local value status process_count
  value=$(get_value "$key")
  status="${value%%,*}"
  process_count=$(get_value "$process_key")
  case "$status" in
    Y) emit "ai_pipeline:db_job:${label}" "$value" "completed_yn=Y" "OK" "tb_cms_batch_job_process" ;;
    N)
      if [[ "$process_count" =~ ^[0-9]+$ ]] && [ "$process_count" -gt 0 ]; then
        emit "ai_pipeline:db_job:${label}" "$value" "Y or active N" "OK" "batch currently running"
      else
        emit "ai_pipeline:db_job:${label}" "$value" "Y or active N" "ALERT" "N without matching process"
      fi
      ;;
    F) emit "ai_pipeline:db_job:${label}" "$value" "completed_yn=Y" "ALERT" "recorded failure" ;;
    missing) emit "ai_pipeline:db_job:${label}" "missing" "job row present" "UNKNOWN" "no job row" ;;
    *) emit "ai_pipeline:db_job:${label}" "${value:-parse-fail}" "completed_yn=Y" "UNKNOWN" "job status parse" ;;
  esac
}

emit_nonzero_warn() {
  local key="$1" label="$2" reason="$3"
  local value
  value=$(get_value "$key")
  if [[ "$value" =~ ^[0-9]+$ ]] && [ "$value" -eq 0 ]; then
    emit "$label" "$value" "0" "OK" "$reason"
  elif [[ "$value" =~ ^[0-9]+$ ]]; then
    emit "$label" "$value" "0" "WARN" "$reason"
  else
    emit "$label" "parse-fail" "0" "UNKNOWN" "$reason"
  fi
}

emit_informational_count() {
  local key="$1" label="$2" reason="$3" missing_is_zero="${4:-0}"
  local value
  value=$(get_value "$key")
  if [[ "$value" =~ ^[0-9]+$ ]]; then
    emit "$label" "$value" "informational" "OK" "$reason"
  elif [ -z "$value" ] && [ "$missing_is_zero" = "1" ]; then
    emit "$label" "0" "informational" "OK" "$reason"
  else
    emit "$label" "parse-fail" "informational" "UNKNOWN" "$reason"
  fi
}

cron_status=$(get_value CRON_STATUS)
if [ "$cron_status" != "ok" ]; then
  emit "ai_pipeline:cron" "${cron_status:-parse-fail}" "readable" "UNKNOWN" "live crontab unavailable"
fi
emit_cron CRON_STORYCTX storyctx
emit_cron CRON_AI_DNA ai_dna
emit_cron CRON_AI_SIGNAL ai_signal
emit_cron CRON_AI_TASTE ai_taste

manual_cron=$(get_value CRON_AI_TASTE_MANUAL)
if [[ "$manual_cron" =~ ^[0-9]+$ ]] && [ "$manual_cron" -eq 0 ]; then
  emit "ai_pipeline:cron:ai_taste_manual_replay" "0" "0 active entries" "OK" "manual-only batch"
elif [[ "$manual_cron" =~ ^[0-9]+$ ]]; then
  emit "ai_pipeline:cron:ai_taste_manual_replay" "$manual_cron" "0 active entries" "WARN" "manual replay is scheduled"
else
  emit "ai_pipeline:cron:ai_taste_manual_replay" "parse-fail" "0 active entries" "UNKNOWN" "live crontab parse"
fi

emit_process PROC_STORYCTX storyctx
emit_process PROC_AI_DNA ai_dna
emit_process PROC_AI_SIGNAL ai_signal
emit_process PROC_AI_TASTE ai_taste
emit_lock LOCK_STORYCTX storyctx
emit_lock LOCK_AI_DNA ai_dna

emit_log STORYCTX storyctx 90
emit_log AI_DNA ai_dna 1620
emit_log AI_SIGNAL ai_signal 1620
emit_log AI_TASTE ai_taste 90

manual_logs=$(get_value CHARACTER_MANUAL_LOGS_7D)
manual_latest=$(get_value CHARACTER_MANUAL_LATEST)
manual_age=$(get_value CHARACTER_MANUAL_LATEST_AGE_MIN)
if [[ "$manual_logs" =~ ^[0-9]+$ ]]; then
  emit "ai_pipeline:character_manual_logs_7d" "$manual_logs" "informational" "OK" "latest=${manual_latest:-none} age=${manual_age:-?}m"
else
  emit "ai_pipeline:character_manual_logs_7d" "parse-fail" "informational" "UNKNOWN" "manual character-chat log inventory"
fi

db_status=$(get_value DB_STATUS)
if [ "$db_status" != "ok" ]; then
  emit "ai_pipeline:db" "${db_status:-parse-fail}" "ok" "UNKNOWN" "prod DB readback unavailable"
  exit 0
fi

emit_job JOB_AI_DNA_EXTRACT_DAILY_BATCH_SH ai_dna PROC_AI_DNA
emit_job JOB_AI_SIGNAL_DAILY_BATCH_SH ai_signal PROC_AI_SIGNAL
emit_job JOB_AI_TASTE_HOURLY_BATCH_SH ai_taste PROC_AI_TASTE

emit_nonzero_warn CONTEXT_FAILED_VISIBLE_ONGOING "ai_pipeline:storyctx_failed_products" "visible ongoing free/paid products"
emit_nonzero_warn STORY_FOUNDATION_MISMATCH_ACTIONABLE "ai_pipeline:story_foundation_mismatch" "collector-eligible episode summary/signal/inventory invariant"
emit_informational_count STORY_FOUNDATION_MISMATCH_OUT_OF_POLICY "ai_pipeline:story_foundation_mismatch_out_of_policy" "mismatches outside current collection policy"

summary_types=(
  EPISODE_SUMMARY RANGE_SUMMARY PRODUCT_SUMMARY
  CHARACTER_SNAPSHOT RELATION_SNAPSHOT WORLD_SNAPSHOT
  EPISODE_CHARACTER_SIGNALS EPISODE_SCENE_EXTRACTION
  CHARACTER_INVENTORY CHARACTER_INVENTORY_V3 RELATION_INVENTORY
  CHARACTER_RP_PROFILE CHARACTER_RP_EXAMPLES CHARACTER_CHAT_OPENING_V1
)
for summary_type in "${summary_types[@]}"; do
  emit_informational_count "SUMMARY_${summary_type}" "ai_pipeline:summary:${summary_type,,}" "active rows on visible ongoing products" 1
done

emit_informational_count DNA_STATUS_SUCCESS "ai_pipeline:dna_status_success" "tb_product_ai_metadata" 1
emit_informational_count DNA_STATUS_FAILED "ai_pipeline:dna_status_failed" "tb_product_ai_metadata" 1
emit_informational_count DNA_STATUS_PENDING "ai_pipeline:dna_status_pending" "tb_product_ai_metadata" 1
emit_nonzero_warn DNA_FAILED_24H "ai_pipeline:dna_failed_24h" "metadata rows failed in last 24h"
emit_informational_count AI_SIGNAL_DAILY_YESTERDAY_ROWS "ai_pipeline:signal_daily_yesterday" "daily aggregate rows"
emit_informational_count AI_TASTE_FACTOR_ROWS "ai_pipeline:taste_factor_rows" "current factor rows"
emit_informational_count AI_TASTE_UPDATED_2H_ROWS "ai_pipeline:taste_updated_2h" "recent aggregate writes; zero can be no input"
