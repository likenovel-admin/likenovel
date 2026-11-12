#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT
mkdir "$TMP_DIR/bin"
touch "$TMP_DIR/key"
cat > "$TMP_DIR/bin/ssh" <<'SSH'
#!/usr/bin/env bash
printf '%s\n' "$*" >> "$DEV_TEST_CALLS"
SSH
chmod +x "$TMP_DIR/bin/ssh"
export PATH="$TMP_DIR/bin:$PATH" DEV_RDS_SSH_KEY="$TMP_DIR/key" DEV_TEST_CALLS="$TMP_DIR/calls"
for action in work-start up start down stop status endpoint; do
  bash "$ROOT_DIR/devtools/dev-rds.sh" "$action"
done
python3 - "$DEV_TEST_CALLS" <<'PY'
import sys, re
from pathlib import Path
calls=Path(sys.argv[1]).read_text().splitlines()
assert [re.search(r'dev-rds-reconcile.py (start|stop|status|endpoint)', c).group(1) for c in calls] == ['start','start','start','stop','stop','status','endpoint']
assert all('LIFECYCLE_PROTOCOL = 2' in c and 'ln-admin@10.0.100.110' in c for c in calls)
PY
before="$(wc -l < "$DEV_TEST_CALLS")"
if DEV_RDS_INSTANCE_ID=prod bash "$ROOT_DIR/devtools/dev-rds.sh" start >/dev/null 2>&1; then exit 1; fi
if bash "$ROOT_DIR/devtools/dev-rds.sh" reconcile >/dev/null 2>&1; then exit 1; fi
[ "$(wc -l < "$DEV_TEST_CALLS")" = "$before" ]
echo '[PASS] all supported clients use the single server lifecycle owner'

# Execute both SSH command layers locally with external boundaries faked.
cat > "$TMP_DIR/bin/ssh" <<'SSH'
#!/bin/bash
exec /bin/bash -c "${@: -1}"
SSH
cat > "$TMP_DIR/bin/grep" <<'GREP'
#!/bin/bash
printf '%s\n' guard >> "$DEV_TEST_CALLS"
exit "${DEV_TEST_PROTOCOL_RC:-0}"
GREP
cat > "$TMP_DIR/bin/python3" <<'PYTHON'
#!/bin/bash
printf '%s\n' "python:$*" >> "$DEV_TEST_CALLS"
PYTHON
chmod +x "$TMP_DIR/bin/grep" "$TMP_DIR/bin/python3"
: > "$DEV_TEST_CALLS"
bash "$ROOT_DIR/devtools/dev-rds.sh" start
[[ "$(cat "$DEV_TEST_CALLS")" == $'guard\npython:/home/ln-admin/likenovel/dev-rds/dev-rds-reconcile.py start' ]]
: > "$DEV_TEST_CALLS"
if DEV_TEST_PROTOCOL_RC=42 bash "$ROOT_DIR/devtools/dev-rds.sh" start; then exit 1; fi
[[ "$(cat "$DEV_TEST_CALLS")" == guard ]]
echo '[PASS] two-hop SSH executes new protocol and refuses old server before Python'
