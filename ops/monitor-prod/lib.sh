#!/usr/bin/env bash
# 공통 라이브러리: SSH 래퍼, 판정 포매터, 임계치
# source 전용, 직접 실행하지 말 것.

SSH_KEY="${SSH_KEY:-$HOME/.ssh/ln_kp.pem}"
LN_WEB_HOST="${LN_WEB_HOST:-ec2-3-34-11-39.ap-northeast-2.compute.amazonaws.com}"
LN_WEB_USER="${LN_WEB_USER:-ln-admin}"
LN_WAS_HOST="${LN_WAS_HOST:-10.0.100.110}"
LN_WAS_USER="${LN_WAS_USER:-ln-admin}"
LN_WAS_KEY="${LN_WAS_KEY:-/home/ln-admin/.ssh/ln_kp.pem}"
SSH_TIMEOUT="${SSH_TIMEOUT:-10}"

# 임계치 (수정 시 여기만)
THRESH_DISK_PCT=80
THRESH_MEM_PCT=90
THRESH_SWAP_MB=1800          # 1GB 메모리 인스턴스 기준으로 완화
THRESH_BATCH_FAIL_1H=0        # 최근 1시간 실패 건수 상한
THRESH_JOURNAL_ERR_1H=50      # 1시간 ERROR 로그 카운트 상한
THRESH_LOAD_MULTIPLIER="1.5"  # load avg >= CPU * multiplier → WARN

# SSH wrappers
ssh_web() {
  ssh -i "$SSH_KEY" \
      -o ConnectTimeout="$SSH_TIMEOUT" \
      -o StrictHostKeyChecking=accept-new \
      -o BatchMode=yes \
      -T "${LN_WEB_USER}@${LN_WEB_HOST}" "$@"
}

ssh_web_stdin() {
  ssh -i "$SSH_KEY" \
      -o ConnectTimeout="$SSH_TIMEOUT" \
      -o StrictHostKeyChecking=accept-new \
      -o BatchMode=yes \
      -T "${LN_WEB_USER}@${LN_WEB_HOST}" 'bash -s'
}

ssh_was() {
  # ln-web을 bastion으로 사용
  ssh -i "$SSH_KEY" \
      -o ConnectTimeout="$SSH_TIMEOUT" \
      -o StrictHostKeyChecking=accept-new \
      -o BatchMode=yes \
      -T "${LN_WEB_USER}@${LN_WEB_HOST}" \
      "ssh -i ${LN_WAS_KEY} -o ConnectTimeout=${SSH_TIMEOUT} -o StrictHostKeyChecking=accept-new -T ${LN_WAS_USER}@${LN_WAS_HOST} \"$*\""
}

ssh_was_stdin() {
  ssh -i "$SSH_KEY" \
      -o ConnectTimeout="$SSH_TIMEOUT" \
      -o StrictHostKeyChecking=accept-new \
      -o BatchMode=yes \
      -T "${LN_WEB_USER}@${LN_WEB_HOST}" \
      "ssh -i ${LN_WAS_KEY} -o ConnectTimeout=${SSH_TIMEOUT} -o StrictHostKeyChecking=accept-new -T ${LN_WAS_USER}@${LN_WAS_HOST} 'bash -s'"
}

# 판정 라인 생성 (표준 파이프 구분):
# MON|<item>|<value>|<threshold>|<verdict>|<reason>
emit() {
  local item="$1"
  local value="$2"
  local threshold="$3"
  local verdict="$4"
  local reason="${5:-}"
  printf 'MON|%s|%s|%s|%s|%s\n' "$item" "$value" "$threshold" "$verdict" "$reason"
}

# 퍼센트 비교 판정 (값 >= 임계치면 WARN)
judge_pct() {
  local value_pct="$1"
  local threshold_pct="$2"
  if [ -z "$value_pct" ] || ! [[ "$value_pct" =~ ^[0-9]+$ ]]; then
    echo "UNKNOWN"
  elif [ "$value_pct" -ge "$threshold_pct" ]; then
    echo "WARN"
  else
    echo "OK"
  fi
}

# 0 / 비-0 판정
judge_zero() {
  local value="$1"
  if [ -z "$value" ] || ! [[ "$value" =~ ^[0-9]+$ ]]; then
    echo "UNKNOWN"
  elif [ "$value" -eq 0 ]; then
    echo "OK"
  else
    echo "WARN"
  fi
}

# 현재 시각 (로그 헤더)
now_kst() {
  TZ=Asia/Seoul date +"%Y-%m-%d %H:%M:%S KST"
}

# 최근 N분 이내 타임스탬프 필터 (stdin)
# 파라미터: 분 (기본 60)
# 기대 입력: 각 라인이 "[YYYY-MM-DD HH:MM:SS TZ] ..." 형태
filter_recent_minutes() {
  local minutes="${1:-60}"
  python3 - "$minutes" <<'PY'
import sys, re, datetime
mins = int(sys.argv[1])
now = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=9)))
cutoff = now - datetime.timedelta(minutes=mins)
pat = re.compile(r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})')
for line in sys.stdin:
    m = pat.search(line)
    if not m:
        continue
    try:
        ts = datetime.datetime.strptime(m.group(1), '%Y-%m-%d %H:%M:%S')
        ts = ts.replace(tzinfo=datetime.timezone(datetime.timedelta(hours=9)))
    except ValueError:
        continue
    if ts >= cutoff:
        sys.stdout.write(line)
PY
}
