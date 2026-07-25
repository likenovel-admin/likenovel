#!/usr/bin/env bash
# prod 모니터링 엔트리. 레벨별로 체크 실행 → 판정 라인 수집 → 사람이 읽기 좋은 요약 출력.
set -uo pipefail

LEVEL="${1:-quick}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC1091
source "$HERE/lib.sh"

# 레벨별 체크 목록
CHECKS_QUICK=(disk memory containers http_health actions)
CHECKS_FULL=(disk memory containers http_health actions batch_recent journal_errors backend_process nginx_errors)
CHECKS_DEEP=(disk memory containers http_health actions batch_recent journal_errors backend_process nginx_errors cpu_load network mysql_status ssl_cert websochat ai_pipeline_batches character_chat_assets)

case "$LEVEL" in
  quick) CHECKS=("${CHECKS_QUICK[@]}") ;;
  full)  CHECKS=("${CHECKS_FULL[@]}") ;;
  deep)  CHECKS=("${CHECKS_DEEP[@]}") ;;
  *) echo "Usage: $0 [quick|full|deep]" >&2; exit 2 ;;
esac

header="prod 모니터링 — level=${LEVEL} — $(now_kst)"
echo "======================================================"
echo " $header"
echo "======================================================"

# 체크 실행하고 모든 MON 라인을 임시 파일에 수집
MON_LOG="$(mktemp)"
trap 'rm -f "$MON_LOG"' EXIT

for chk in "${CHECKS[@]}"; do
  script="$HERE/checks/${chk}.sh"
  if [ ! -x "$script" ] && [ ! -f "$script" ]; then
    emit "check:$chk" "missing" "n/a" "UNKNOWN" "script not found: $script" >> "$MON_LOG"
    continue
  fi
  echo ""
  echo "-- ${chk} --"
  # 체크 스크립트는 stdout에 MON 라인 + 사람 가독 라인 섞어 낼 수 있음
  # MON|... 라인만 집계, 나머지는 그대로 터미널에
  if ! bash "$script" 2>&1 | tee >(grep -E '^MON\|' >> "$MON_LOG"); then
    emit "check:$chk" "error" "n/a" "UNKNOWN" "script exited non-zero" >> "$MON_LOG"
  fi
done

echo ""
echo "======================================================"
echo " 요약"
echo "======================================================"

# 카운트 — 리터럴 매치(고정 문자열)
ok_cnt=$(grep -Fc '|OK|' "$MON_LOG" || true)
warn_cnt=$(grep -Fc '|WARN|' "$MON_LOG" || true)
alert_cnt=$(grep -Fc '|ALERT|' "$MON_LOG" || true)
unk_cnt=$(grep -Fc '|UNKNOWN|' "$MON_LOG" || true)

printf "OK=%d  WARN=%d  ALERT=%d  UNKNOWN=%d  (총 %d 항목)\n" \
  "$ok_cnt" "$warn_cnt" "$alert_cnt" "$unk_cnt" \
  "$((ok_cnt + warn_cnt + alert_cnt + unk_cnt))"

echo ""
echo "[이상 항목 — WARN/ALERT/UNKNOWN]"
awk -F'|' '$5=="WARN" || $5=="ALERT" || $5=="UNKNOWN" {printf "  [%-7s] %-30s  값=%s  임계=%s  %s\n", $5, $2, $3, $4, $6}' "$MON_LOG"
if [ $((warn_cnt + alert_cnt + unk_cnt)) -eq 0 ]; then
  echo "  (없음)"
fi

echo ""
echo "[정상 항목]"
awk -F'|' '$5=="OK" {printf "  [OK     ] %-30s  값=%s\n", $2, $3}' "$MON_LOG"

echo ""
echo "※ 각 항목은 '값 vs 임계' 명시 판정. UNKNOWN은 '정상'이 아님 — 사용자 추가 확인 필요."
