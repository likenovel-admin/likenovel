#!/usr/bin/env bash
# ln-web 도커 컨테이너 상태 (Up, Restarting, unhealthy)
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

out=$(ssh_web 'docker ps -a --format "{{.Names}}\t{{.Status}}"' 2>/dev/null)
if [ -z "$out" ]; then
  emit "containers:ln-web" "unreachable" "n/a" "UNKNOWN" "docker ps failed"
  exit 0
fi

total=0 up=0 restarting=0 unhealthy=0 exited=0
restarting_names=()
unhealthy_names=()
exited_names=()

while IFS=$'\t' read -r name status; do
  [ -z "$name" ] && continue
  total=$((total+1))
  case "$status" in
    *Up*unhealthy*) unhealthy=$((unhealthy+1)); unhealthy_names+=("$name") ;;
    *Up*)           up=$((up+1)) ;;
    *Restarting*)   restarting=$((restarting+1)); restarting_names+=("$name") ;;
    *Exited*)       exited=$((exited+1)); exited_names+=("$name") ;;
  esac
done <<< "$out"

verdict=OK reason="up=$up total=$total"
if [ "$restarting" -gt 0 ] || [ "$unhealthy" -gt 0 ]; then
  verdict=ALERT
  reason="restarting=${restarting}(${restarting_names[*]:-}) unhealthy=${unhealthy}(${unhealthy_names[*]:-})"
fi
emit "containers:ln-web" "up=$up/total=$total" "0 restarting,0 unhealthy" "$verdict" "$reason"

# Exited 컨테이너는 경고가 아닌 참고 — 의도적 stopped일 수 있음
if [ "$exited" -gt 0 ]; then
  emit "containers:exited" "$exited" "n/a" "OK" "${exited_names[*]:-} (참고용)"
fi
