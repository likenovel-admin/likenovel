#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "dev-rds.yml"
CONTENT = WORKFLOW.read_text(encoding="utf-8")


def require(needle: str) -> None:
    if needle not in CONTENT:
        raise AssertionError(f"dev-rds.yml: missing {needle!r}")


for action in ("status", "work-start", "reconcile", "down"):
    require(f"          - {action}")

require('    - cron: "7,22,37,52 * * * *"')
require("  contents: read")
require("  group: dev-rds-lifecycle")
require("  cancel-in-progress: false")
require('            action="reconcile"')
require('          bash devtools/dev-rds.sh "$action"')

if "work-done" in CONTENT:
    raise AssertionError("dev-rds.yml: work-done must not shorten another active lease")
if "pull_request:" in CONTENT or "push:" in CONTENT:
    raise AssertionError("dev-rds.yml: lifecycle mutations must not run on push or PR")

print("DEV RDS workflow contract tests passed")
