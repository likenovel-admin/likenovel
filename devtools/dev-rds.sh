#!/usr/bin/env bash
set -euo pipefail

DB_ID="${DEV_RDS_INSTANCE_ID:-likenovel-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"
WORK_TTL_TAG="likenovel-dev-work-until-epoch"
WORK_LEASE_SECONDS=3600

usage() {
  cat <<'USAGE'
Usage: devtools/dev-rds.sh <status|up|start|down|stop|endpoint|work-start|reconcile>

Controls only the LikeNovel DEV RDS instance.

  work-start  Start likenovel-dev if needed and renew its one-hour work lease.
  reconcile   Stop likenovel-dev after the recorded work lease expires.

The up/start aliases behave like work-start. Re-run work-start before an
existing lease expires when local testing needs more than one hour.
USAGE
}

require_dev_target() {
  if [ "$DB_ID" != "likenovel-dev" ]; then
    echo "[dev-rds] refusing non-DEV DB target: $DB_ID" >&2
    exit 2
  fi
}

now_epoch() {
  date -u '+%s'
}

current_status() {
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].DBInstanceStatus' \
    --output text
}

db_arn() {
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].DBInstanceArn' \
    --output text
}

show_status() {
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].{Id:DBInstanceIdentifier,Status:DBInstanceStatus,Class:DBInstanceClass,Endpoint:Endpoint.Address,MultiAZ:MultiAZ,BackupRetention:BackupRetentionPeriod}' \
    --output table
}

show_endpoint() {
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
}

read_work_until_epoch() {
  local arn
  arn="$(db_arn)"

  aws rds list-tags-for-resource \
    --region "$REGION" \
    --resource-name "$arn" \
    --query "TagList[?Key=='$WORK_TTL_TAG'].Value | [0]" \
    --output text
}

renew_work_lease() {
  local candidate current deadline observed arn

  candidate="$(( $(now_epoch) + WORK_LEASE_SECONDS ))"
  current="$(read_work_until_epoch)"
  deadline="$candidate"
  if [[ "$current" =~ ^[0-9]+$ ]] && [ "$current" -gt "$candidate" ]; then
    deadline="$current"
  fi

  arn="$(db_arn)"
  aws rds add-tags-to-resource \
    --region "$REGION" \
    --resource-name "$arn" \
    --tags "Key=$WORK_TTL_TAG,Value=$deadline"

  for _ in $(seq 1 12); do
    observed="$(read_work_until_epoch)"
    if [[ "$observed" =~ ^[0-9]+$ ]] && [ "$observed" -ge "$deadline" ]; then
      echo "[dev-rds] work lease recorded until epoch=$observed"
      return
    fi
    sleep 2
  done

  echo "[dev-rds] work lease write was not visible after retry: expected=$deadline observed=$observed" >&2
  exit 1
}

wait_for_status() {
  local desired="$1"
  local status

  for _ in $(seq 1 120); do
    status="$(current_status)"
    if [ "$status" = "$desired" ]; then
      return
    fi
    echo "[dev-rds] waiting for $DB_ID status=$desired current=$status"
    sleep 10
  done

  echo "[dev-rds] timed out waiting for $DB_ID status=$desired" >&2
  exit 1
}

start_db() {
  local status
  status="$(current_status)"

  case "$status" in
    available)
      echo "[dev-rds] $DB_ID is already available"
      ;;
    stopped)
      echo "[dev-rds] starting $DB_ID"
      aws rds start-db-instance \
        --region "$REGION" \
        --db-instance-identifier "$DB_ID" >/dev/null
      wait_for_status available
      ;;
    starting)
      echo "[dev-rds] waiting for $DB_ID to become available"
      wait_for_status available
      ;;
    stopping)
      echo "[dev-rds] $DB_ID is stopping; waiting before start"
      wait_for_status stopped
      start_db
      ;;
    *)
      echo "[dev-rds] cannot start $DB_ID from status: $status" >&2
      exit 1
      ;;
  esac
}

stop_db() {
  local status
  status="$(current_status)"

  case "$status" in
    stopped)
      echo "[dev-rds] $DB_ID is already stopped"
      ;;
    available)
      echo "[dev-rds] stopping $DB_ID"
      aws rds stop-db-instance \
        --region "$REGION" \
        --db-instance-identifier "$DB_ID" >/dev/null
      wait_for_status stopped
      ;;
    stopping)
      echo "[dev-rds] waiting for $DB_ID to stop"
      wait_for_status stopped
      ;;
    starting)
      echo "[dev-rds] $DB_ID is starting; waiting before stop"
      wait_for_status available
      stop_db
      ;;
    *)
      echo "[dev-rds] cannot stop $DB_ID from status: $status" >&2
      exit 1
      ;;
  esac
}

work_start() {
  # Lease before and after startup so a concurrent reconcile cannot leave the
  # database stopped between the tag write and the available state.
  renew_work_lease
  start_db
  renew_work_lease
  show_status
}

reconcile() {
  local status deadline latest_deadline now
  status="$(current_status)"

  case "$status" in
    stopped|stopping)
      echo "[dev-rds] $DB_ID status=$status; no reconcile action needed"
      return
      ;;
    available)
      ;;
    *)
      echo "[dev-rds] $DB_ID status=$status; skip reconcile"
      return
      ;;
  esac

  deadline="$(read_work_until_epoch)"
  if [ -z "$deadline" ] || [ "$deadline" = "None" ] || [[ ! "$deadline" =~ ^[0-9]+$ ]]; then
    echo "[dev-rds] work lease is missing or malformed; keep $DB_ID available" >&2
    return 1
  fi

  now="$(now_epoch)"
  if [ "$now" -lt "$deadline" ]; then
    echo "[dev-rds] work lease active until epoch=$deadline; keep $DB_ID available"
    return
  fi

  latest_deadline="$(read_work_until_epoch)"
  if [ "$latest_deadline" != "$deadline" ]; then
    echo "[dev-rds] work lease changed during reconcile; keep $DB_ID available"
    return
  fi

  echo "[dev-rds] work lease expired at epoch=$deadline"
  stop_db

  latest_deadline="$(read_work_until_epoch)"
  now="$(now_epoch)"
  if [[ "$latest_deadline" =~ ^[0-9]+$ ]] && [ "$now" -lt "$latest_deadline" ]; then
    echo "[dev-rds] work lease renewed while stopping; restoring $DB_ID"
    start_db
  fi
  show_status
}

main() {
  require_dev_target

  case "${1:-}" in
    status)
      show_status
      ;;
    up|start|work-start)
      work_start
      ;;
    reconcile)
      reconcile
      ;;
    down|stop)
      stop_db
      show_status
      ;;
    endpoint)
      show_endpoint
      ;;
    -h|--help|help|'')
      usage
      ;;
    *)
      usage >&2
      exit 2
      ;;
  esac
}

main "$@"
