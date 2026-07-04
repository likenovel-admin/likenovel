#!/usr/bin/env bash
set -euo pipefail

DB_ID="${DEV_RDS_INSTANCE_ID:-likenovel-dev}"
REGION="${AWS_REGION:-ap-northeast-2}"

usage() {
  cat <<'USAGE'
Usage: devtools/dev-rds.sh <status|up|start|down|stop|endpoint|idle-stop>

Controls the LikeNovel dev RDS instance. By default this script only targets
likenovel-dev. Set DEV_RDS_INSTANCE_ID only with LIKENOVEL_ALLOW_NON_DEV_RDS=1.
USAGE
}

require_dev_target() {
  if [ "$DB_ID" != "likenovel-dev" ] && [ "${LIKENOVEL_ALLOW_NON_DEV_RDS:-}" != "1" ]; then
    echo "[dev-rds] refusing non-dev DB target: $DB_ID" >&2
    echo "[dev-rds] set LIKENOVEL_ALLOW_NON_DEV_RDS=1 only for an intentional override" >&2
    exit 2
  fi
}

current_status() {
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_ID" \
    --query 'DBInstances[0].DBInstanceStatus' \
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

get_max_connections_last_hour() {
  local start_time end_time
  end_time="$(date -u '+%Y-%m-%dT%H:%M:%SZ')"
  start_time="$(date -u -d '70 minutes ago' '+%Y-%m-%dT%H:%M:%SZ')"

  aws cloudwatch get-metric-statistics \
    --region "$REGION" \
    --namespace AWS/RDS \
    --metric-name DatabaseConnections \
    --dimensions "Name=DBInstanceIdentifier,Value=$DB_ID" \
    --start-time "$start_time" \
    --end-time "$end_time" \
    --period 300 \
    --statistics Maximum \
    --query 'Datapoints[].Maximum' \
    --output text |
    awk '
      BEGIN { max = 0; seen = 0 }
      {
        for (i = 1; i <= NF; i++) {
          seen = 1
          if ($i > max) max = $i
        }
      }
      END {
        if (!seen) print "UNKNOWN"
        else print max
      }
    '
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

idle_stop_db() {
  local status max_connections
  status="$(current_status)"

  case "$status" in
    stopped|stopping)
      echo "[dev-rds] $DB_ID status=$status; no idle stop needed"
      show_status
      return
      ;;
    available)
      ;;
    *)
      echo "[dev-rds] $DB_ID status=$status; skip idle stop"
      show_status
      return
      ;;
  esac

  max_connections="$(get_max_connections_last_hour)"
  if [ "$max_connections" = "UNKNOWN" ]; then
    echo "[dev-rds] no recent DatabaseConnections metric; skip idle stop"
    show_status
    return
  fi

  echo "[dev-rds] last-hour max DatabaseConnections=$max_connections"
  if awk "BEGIN { exit !($max_connections <= 0) }"; then
    stop_db
  else
    echo "[dev-rds] active/recent connections detected; keep $DB_ID available"
    show_status
  fi
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

  show_status
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

  show_status
}

main() {
  require_dev_target

  case "${1:-}" in
    status)
      show_status
      ;;
    up|start)
      start_db
      ;;
    down|stop)
      stop_db
      ;;
    idle-stop)
      idle_stop_db
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
