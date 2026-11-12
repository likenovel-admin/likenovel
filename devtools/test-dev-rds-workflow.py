#!/usr/bin/env python3
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
WORKFLOW = ROOT / ".github" / "workflows" / "dev-rds.yml"
CONTENT = WORKFLOW.read_text(encoding="utf-8")


def require(needle: str) -> None:
    if needle not in CONTENT:
        raise AssertionError(f"dev-rds.yml: missing {needle!r}")


for action in ("status", "work-start", "down"):
    require(f"          - {action}")

if "schedule:" in CONTENT or "          - reconcile" in CONTENT:
    raise AssertionError("GitHub must not independently stop the DB")
require("  contents: read")
require("  group: dev-rds-lifecycle")
require("  cancel-in-progress: false")
require('          DEV_RDS_SSH_KEY="$HOME/.ssh/deploy_key" bash devtools/dev-rds.sh "$action"')
require("      - name: Test DEV RDS lifecycle contracts")
require("          bash devtools/test-dev-rds.sh")
require("          python3 devtools/test-dev-rds-reconcile.py")
require("          python3 devtools/test-dev-rds-workflow.py")

test_step = CONTENT.index("      - name: Test DEV RDS lifecycle contracts")
credentials_step = CONTENT.index("      - name: Prepare existing SSH credentials")
action_step = CONTENT.index("      - name: Run DEV RDS lifecycle action")
if not test_step < credentials_step < action_step:
    raise AssertionError(
        "dev-rds.yml: lifecycle tests must pass before AWS credentials and mutation"
    )

if "work-done" in CONTENT:
    raise AssertionError("dev-rds.yml: work-done must not shorten another active lease")
if "pull_request:" in CONTENT or "push:" in CONTENT:
    raise AssertionError("dev-rds.yml: lifecycle mutations must not run on push or PR")

print("DEV RDS workflow contract tests passed")
