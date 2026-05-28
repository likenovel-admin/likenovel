import os
import subprocess
import unittest
from pathlib import Path


class ActionsMonitorTest(unittest.TestCase):
    def test_backend_failure_before_latest_success_is_not_alert(self) -> None:
        tmp_path = Path(os.environ.get("TMPDIR", "/tmp")) / f"actions-monitor-test-{os.getpid()}"
        fake_bin = tmp_path / "bin"
        fake_bin.mkdir(parents=True, exist_ok=True)
        gh = fake_bin / "gh"
        gh.write_text(
            """#!/usr/bin/env bash
set -euo pipefail
if [[ "$PWD" == *"likenovel-service-api/likenovel-service-api"* ]]; then
  cat <<'JSON'
[
  {"status":"completed","conclusion":"success","headBranch":"prod","workflowName":"active aws codedeploy(fastapi backend server)","databaseId":26593123400,"createdAt":"2026-05-28T18:08:33Z"},
  {"status":"completed","conclusion":"success","headBranch":"dev","workflowName":"active aws codedeploy(fastapi backend server) - DEV","databaseId":26593068536,"createdAt":"2026-05-28T18:07:30Z"},
  {"status":"completed","conclusion":"failure","headBranch":"prod","workflowName":"active aws codedeploy(fastapi backend server)","databaseId":26585991128,"createdAt":"2026-05-28T15:55:26Z"}
]
JSON
else
  cat <<'JSON'
[
  {"status":"completed","conclusion":"success","headBranch":"prod","workflowName":"Build & Push Docker images (prod)","databaseId":26593821127,"createdAt":"2026-05-28T18:31:00Z"}
]
JSON
fi
""",
            encoding="utf-8",
        )
        gh.chmod(0o755)

        repo_root = Path(__file__).resolve().parents[3]
        env = os.environ.copy()
        env["PATH"] = f"{fake_bin}:{env['PATH']}"

        result = subprocess.run(
            [
                "bash",
                "ops/monitor-prod/checks/actions.sh",
            ],
            cwd=repo_root,
            env=env,
            text=True,
            check=True,
            capture_output=True,
        )

        self.assertNotIn("actions:backend:recent_failure|1|0|ALERT", result.stdout)
        self.assertIn("actions:backend:recent_failure|0|0|OK", result.stdout)


if __name__ == "__main__":
    unittest.main()
