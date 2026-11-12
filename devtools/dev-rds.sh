#!/usr/bin/env bash
set -euo pipefail

DB_ID="${DEV_RDS_INSTANCE_ID:-likenovel-dev}"
if [ "$DB_ID" != "likenovel-dev" ]; then
  echo "[dev-rds] refusing non-DEV target: $DB_ID" >&2
  exit 2
fi
case "${1:-}" in
  up|start|work-start) action=start ;;
  down|stop) action=stop ;;
  status|endpoint) action="$1" ;;
  reconcile)
    echo "[dev-rds] automatic reconciliation runs only on ln-was" >&2
    exit 2 ;;
  -h|--help|help|'')
    echo "Usage: devtools/dev-rds.sh <status|work-start|up|start|down|stop|endpoint>"
    echo "All mutations use the shared ln-was controller; repeated start never extends the run."
    echo "Set DEV_RDS_SSH_KEY to your existing SSH key when necessary."
    exit 0 ;;
  *) echo "[dev-rds] unknown action" >&2; exit 2 ;;
esac
key="${DEV_RDS_SSH_KEY:-$HOME/.ssh/ln_kp.pem}"
if [ ! -r "$key" ]; then
  echo "[dev-rds] existing SSH key not readable: $key" >&2
  exit 1
fi
ssh -i "$key" -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=10 \
  -o StrictHostKeyChecking=accept-new ln-admin@3.34.11.39 \
  "ssh -i /home/ln-admin/.ssh/ln_kp.pem -o IdentitiesOnly=yes -o BatchMode=yes -o ConnectTimeout=10 -o StrictHostKeyChecking=accept-new ln-admin@10.0.100.110 \"grep -qx 'LIFECYCLE_PROTOCOL = 2' /home/ln-admin/likenovel/dev-rds/dev-rds-reconcile.py && python3 /home/ln-admin/likenovel/dev-rds/dev-rds-reconcile.py $action\""
