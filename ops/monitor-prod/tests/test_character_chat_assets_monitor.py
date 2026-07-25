import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path


class CharacterChatAssetsMonitorTest(unittest.TestCase):
    def setUp(self) -> None:
        self.repo_root = Path(__file__).resolve().parents[3]
        self.check_script = (
            self.repo_root
            / "ops"
            / "monitor-prod"
            / "checks"
            / "character_chat_assets.sh"
        ).read_text(encoding="utf-8")
        self.monitor = (
            self.repo_root / "ops" / "monitor-prod" / "monitor.sh"
        ).read_text(encoding="utf-8")

    def _run_check(
        self,
        *,
        audit_rc: int | None,
        action_plan_counts: dict[str, int],
        raw_summary: str | None = None,
    ) -> str:
        with tempfile.TemporaryDirectory() as temp_dir:
            fake_ssh = Path(temp_dir) / "ssh"
            summary = raw_summary or json.dumps(
                {
                    "productCount": 50,
                    "actionPlanCounts": action_plan_counts,
                    "outOfCohortHoldCount": 0,
                },
                ensure_ascii=False,
            )
            audit_line = f"'AUDIT_RC={audit_rc}' " if audit_rc is not None else ""
            fake_ssh.write_text(
                "#!/usr/bin/env bash\n"
                "cat >/dev/null\n"
                f"printf '%s\\n' {audit_line}'{summary}'\n",
                encoding="utf-8",
            )
            fake_ssh.chmod(0o755)
            env = os.environ.copy()
            env["PATH"] = f"{temp_dir}:{env['PATH']}"
            result = subprocess.run(
                ["bash", "ops/monitor-prod/checks/character_chat_assets.sh"],
                cwd=self.repo_root,
                env=env,
                text=True,
                check=True,
                capture_output=True,
            )
        return result.stdout

    def test_deep_monitor_runs_read_only_character_asset_audit(self) -> None:
        self.assertIn("CHECKS_DEEP=", self.monitor)
        self.assertIn("character_chat_assets", self.monitor)
        self.assertIn("api_dir=/home/ln-admin/likenovel/api", self.check_script)
        self.assertIn(
            'audit_script="$api_dir/scripts/'
            'audit_character_chat_asset_readiness_db.py"',
            self.check_script,
        )
        self.assertIn("--env-file", self.check_script)
        self.assertIn("--fail-on-actionable", self.check_script)

    def test_monitor_maps_actionable_and_runtime_failures(self) -> None:
        self.assertIn('1)', self.check_script)
        self.assertIn('"ALERT"', self.check_script)
        self.assertIn('126|127)', self.check_script)
        self.assertIn('"UNKNOWN"', self.check_script)
        self.assertNotIn("--out", self.check_script)
        self.assertNotIn("--summary-out", self.check_script)

    def test_zero_actionable_products_are_ok(self) -> None:
        output = self._run_check(
            audit_rc=0,
            action_plan_counts={"ready": 48, "no_public_character_candidate": 2},
        )

        self.assertIn(
            "MON|character_chat:assets|0 / 50 products|0 actionable|OK|",
            output,
        )

    def test_actionable_products_are_alert(self) -> None:
        output = self._run_check(
            audit_rc=1,
            action_plan_counts={"ready": 49, "rebuild_rp_assets_with_v3_scope": 1},
        )

        self.assertIn(
            "MON|character_chat:assets|1 / 50 products|0 actionable|ALERT|",
            output,
        )

    def test_multiple_actions_for_one_product_count_once(self) -> None:
        output = self._run_check(
            audit_rc=1,
            action_plan_counts={
                "ready": 49,
                "generate_rp_profile_examples": 1,
                "generate_episode_scene_extraction": 1,
                "rebuild_rp_assets_with_v3_scope": 1,
            },
        )

        self.assertIn(
            "MON|character_chat:assets|1 / 50 products|0 actionable|ALERT|",
            output,
        )

    def test_malformed_or_incomplete_success_is_unknown(self) -> None:
        invalid_summaries = (
            "not-json",
            json.dumps({"productCount": 50}),
            json.dumps(
                {
                    "actionPlanCounts": {},
                    "outOfCohortHoldCount": 0,
                }
            ),
            json.dumps(
                {
                    "productCount": 50,
                    "actionPlanCounts": {},
                }
            ),
        )

        for summary in invalid_summaries:
            with self.subTest(summary=summary):
                output = self._run_check(
                    audit_rc=0,
                    action_plan_counts={},
                    raw_summary=summary,
                )
                self.assertIn("|UNKNOWN|", output)
                self.assertNotIn("|OK|", output)

    def test_missing_audit_rc_is_unknown(self) -> None:
        output = self._run_check(
            audit_rc=None,
            action_plan_counts={"ready": 50},
        )

        self.assertIn("|UNKNOWN|", output)
        self.assertNotIn("|OK|", output)


if __name__ == "__main__":
    unittest.main()
