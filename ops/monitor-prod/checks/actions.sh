#!/usr/bin/env bash
# GitHub Actions 최근 6건 (root + submodule): in_progress / 최근 failure
set -uo pipefail
source "$(dirname "${BASH_SOURCE[0]}")/../lib.sh"

if ! command -v gh >/dev/null 2>&1; then
  emit "actions:gh" "missing" "installed" "UNKNOWN" "gh cli not installed"
  exit 0
fi

root_dir=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -z "$root_dir" ]; then
  emit "actions:repo" "not-a-repo" "git repo" "UNKNOWN" "cwd is not inside a git repo"
  exit 0
fi

scan_repo() {
  local dir="$1" label="$2"
  local json
  json=$(cd "$dir" && gh run list --limit 6 --json status,conclusion,headBranch,workflowName,databaseId,createdAt 2>/dev/null || true)
  if [ -z "$json" ]; then
    emit "actions:$label" "no-data" "n/a" "UNKNOWN" "gh run list failed in $dir"
    return
  fi
  python3 - "$label" <<PY
import json, sys
label = sys.argv[1]
data = json.loads('''$json''')
if not data:
    print(f"MON|actions:{label}|empty|n/a|UNKNOWN|no recent runs")
    sys.exit(0)
in_progress = [r for r in data if r['status'] == 'in_progress']
completed = sorted(
    [r for r in data if r['status'] == 'completed'],
    key=lambda r: r.get('createdAt') or '',
    reverse=True,
)
latest_by_branch_workflow = {}
for r in completed:
    key = (r.get('headBranch'), r.get('workflowName'))
    latest_by_branch_workflow.setdefault(key, r)
failures = [
    r
    for r in latest_by_branch_workflow.values()
    if r.get('conclusion') == 'failure'
]
# in-progress는 정보성 OK
if in_progress:
    names = ", ".join(f"{r['headBranch']}/{r['workflowName'][:30]}" for r in in_progress)
    print(f"MON|actions:{label}:in_progress|{len(in_progress)}|n/a|OK|{names}")
# 최근 failure
if failures:
    latest = sorted(failures, key=lambda r: r.get('createdAt') or '', reverse=True)[0]
    info = f"{latest['headBranch']}/{latest['workflowName'][:30]} run={latest['databaseId']}"
    print(f"MON|actions:{label}:recent_failure|1|0|ALERT|{info}")
else:
    print(f"MON|actions:{label}:recent_failure|0|0|OK|latest completed runs are not failures in last 6 runs")
PY
}

scan_repo "$root_dir" "root"
sub="$root_dir/likenovel-service-api/likenovel-service-api"
if [ -d "$sub/.git" ] || [ -f "$sub/.git" ]; then
  scan_repo "$sub" "backend"
fi
