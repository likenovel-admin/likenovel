#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SCRIPT="$ROOT_DIR/devtools/dev-rds.sh"
TMP_DIR="$(mktemp -d)"
FAKE_BIN="$TMP_DIR/bin"
STATE_DIR="$TMP_DIR/state"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

mkdir -p "$FAKE_BIN" "$STATE_DIR"
printf '%s\n' stopped > "$STATE_DIR/status"
printf '%s\n' 2000000000 > "$STATE_DIR/now"
: > "$STATE_DIR/calls"

cat > "$FAKE_BIN/aws" <<'FAKE_AWS'
#!/usr/bin/env bash
set -euo pipefail

printf '%q ' "$@" >> "$FAKE_AWS_STATE_DIR/calls"
printf '\n' >> "$FAKE_AWS_STATE_DIR/calls"

service="${1:-}"
operation="${2:-}"
shift 2 || true

if [ "$service" != "rds" ]; then
  echo "unexpected service: $service" >&2
  exit 2
fi

case "$operation" in
  describe-db-instances)
    query=""
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --query)
          query="$2"
          shift 2
          ;;
        *)
          shift
          ;;
      esac
    done
    case "$query" in
      *DBInstanceStatus*) cat "$FAKE_AWS_STATE_DIR/status" ;;
      *DBInstanceArn*) printf '%s\n' 'arn:aws:rds:ap-northeast-2:123456789012:db:likenovel-dev' ;;
      *) printf '%s\n' 'likenovel-dev fake status' ;;
    esac
    ;;
  start-db-instance)
    printf '%s\n' available > "$FAKE_AWS_STATE_DIR/status"
    ;;
  stop-db-instance)
    printf '%s\n' stopped > "$FAKE_AWS_STATE_DIR/status"
    if [ -f "$FAKE_AWS_STATE_DIR/tag_on_stop" ]; then
      cp "$FAKE_AWS_STATE_DIR/tag_on_stop" "$FAKE_AWS_STATE_DIR/tag"
    fi
    ;;
  add-tags-to-resource)
    tag=""
    while [ "$#" -gt 0 ]; do
      case "$1" in
        --tags)
          tag="$2"
          shift 2
          ;;
        *)
          shift
          ;;
      esac
    done
    printf '%s\n' "${tag##*Value=}" > "$FAKE_AWS_STATE_DIR/tag"
    ;;
  list-tags-for-resource)
    count=0
    if [ -f "$FAKE_AWS_STATE_DIR/list_tag_count" ]; then
      count="$(cat "$FAKE_AWS_STATE_DIR/list_tag_count")"
    fi
    count="$((count + 1))"
    printf '%s\n' "$count" > "$FAKE_AWS_STATE_DIR/list_tag_count"
    if [ "$count" -eq 2 ] && [ -f "$FAKE_AWS_STATE_DIR/tag_on_second_list" ]; then
      cp "$FAKE_AWS_STATE_DIR/tag_on_second_list" "$FAKE_AWS_STATE_DIR/tag"
    fi
    if [ -f "$FAKE_AWS_STATE_DIR/tag" ]; then
      cat "$FAKE_AWS_STATE_DIR/tag"
    else
      printf '%s\n' None
    fi
    ;;
  *)
    echo "unexpected operation: $operation" >&2
    exit 2
    ;;
esac
FAKE_AWS
chmod +x "$FAKE_BIN/aws"

cat > "$FAKE_BIN/date" <<'FAKE_DATE'
#!/usr/bin/env bash
set -euo pipefail

if [ "$*" != "-u +%s" ]; then
  echo "unexpected date arguments: $*" >&2
  exit 2
fi
cat "$FAKE_AWS_STATE_DIR/now"
FAKE_DATE
chmod +x "$FAKE_BIN/date"

run_script() {
  PATH="$FAKE_BIN:$PATH" \
    FAKE_AWS_STATE_DIR="$STATE_DIR" \
    bash "$SCRIPT" "$@"
}

assert_eq() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [ "$actual" != "$expected" ]; then
    echo "[FAIL] $label: expected=$expected actual=$actual" >&2
    exit 1
  fi
}

assert_not_called() {
  local pattern="$1"
  local label="$2"

  if grep -F "$pattern" "$STATE_DIR/calls" >/dev/null; then
    echo "[FAIL] $label: unexpected call containing '$pattern'" >&2
    cat "$STATE_DIR/calls" >&2
    exit 1
  fi
}

reset_calls() {
  : > "$STATE_DIR/calls"
  rm -f "$STATE_DIR/list_tag_count" "$STATE_DIR/tag_on_second_list" "$STATE_DIR/tag_on_stop"
}

run_script work-start >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "work-start starts a stopped DB"
assert_eq 2000003600 "$(cat "$STATE_DIR/tag")" "work-start records a one-hour lease"

reset_calls
printf '%s\n' 2000001800 > "$STATE_DIR/now"
run_script work-start >/dev/null
assert_eq 2000005400 "$(cat "$STATE_DIR/tag")" "a later work-start extends the lease"
assert_not_called stop-db-instance "work-start never stops the DB"

reset_calls
printf '%s\n' 2000000000 > "$STATE_DIR/now"
printf '%s\n' 2000000001 > "$STATE_DIR/tag"
run_script reconcile >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "reconcile keeps a non-expired lease"
assert_not_called stop-db-instance "reconcile does not stop before expiry"

reset_calls
printf '%s\n' 1999999999 > "$STATE_DIR/tag"
run_script reconcile >/dev/null
assert_eq stopped "$(cat "$STATE_DIR/status")" "reconcile stops after expiry"

reset_calls
printf '%s\n' available > "$STATE_DIR/status"
printf '%s\n' 1999999999 > "$STATE_DIR/tag"
printf '%s\n' 2000003600 > "$STATE_DIR/tag_on_second_list"
run_script reconcile >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "reconcile preserves a renewed lease"
assert_not_called stop-db-instance "a renewed lease prevents a concurrent stop"

reset_calls
printf '%s\n' 1999999999 > "$STATE_DIR/tag"
printf '%s\n' 2000003600 > "$STATE_DIR/tag_on_stop"
run_script reconcile >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "reconcile restarts after a late lease renewal"
if ! grep -F stop-db-instance "$STATE_DIR/calls" >/dev/null \
  || ! grep -F start-db-instance "$STATE_DIR/calls" >/dev/null; then
  echo "[FAIL] a late renewal must restore a DB whose stop already began" >&2
  cat "$STATE_DIR/calls" >&2
  exit 1
fi

reset_calls
rm -f "$STATE_DIR/tag"
run_script reconcile >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "reconcile fails safe when the lease is missing"
assert_not_called stop-db-instance "missing lease never stops the DB"

reset_calls
printf '%s\n' not-a-time > "$STATE_DIR/tag"
run_script reconcile >/dev/null
assert_eq available "$(cat "$STATE_DIR/status")" "reconcile fails safe for a malformed lease"
assert_not_called stop-db-instance "malformed lease never stops the DB"

reset_calls
if PATH="$FAKE_BIN:$PATH" \
  FAKE_AWS_STATE_DIR="$STATE_DIR" \
  DEV_RDS_INSTANCE_ID=ln-rds \
  bash "$SCRIPT" status >/dev/null 2>&1; then
  echo "[FAIL] non-DEV target must be rejected" >&2
  exit 1
fi
assert_not_called describe-db-instances "non-DEV target is rejected before AWS access"

echo "[PASS] dev RDS lifecycle contracts"
