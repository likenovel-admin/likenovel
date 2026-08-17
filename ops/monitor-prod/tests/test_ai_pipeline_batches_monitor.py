import subprocess
import sys
import unittest
from pathlib import Path


class AiPipelineBatchesMonitorTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.repo_root = Path(__file__).resolve().parents[3]
        cls.check_script = (
            cls.repo_root / "ops" / "monitor-prod" / "checks" / "ai_pipeline_batches.sh"
        ).read_text(encoding="utf-8")
        cls.monitor_script = (
            cls.repo_root / "ops" / "monitor-prod" / "monitor.sh"
        ).read_text(encoding="utf-8")
        cls.classifier = cls.repo_root / "ops" / "monitor-prod" / "classify_batch_error.py"

    def test_deep_level_runs_ai_pipeline_check(self) -> None:
        deep_line = next(
            line for line in self.monitor_script.splitlines() if line.startswith("CHECKS_DEEP=")
        )
        self.assertIn("ai_pipeline_batches", deep_line)

    def test_all_scheduled_ai_batches_have_cron_log_process_and_db_checks(self) -> None:
        for batch_name in (
            "build_story_agent_context_batch.sh",
            "ai_dna_extract_daily_batch.sh",
            "ai_signal_daily_batch.sh",
            "ai_taste_hourly_batch.sh",
        ):
            with self.subTest(batch_name=batch_name):
                self.assertIn(batch_name.replace(".", r"\."), self.check_script)

        self.assertIn("PROC_STORYCTX", self.check_script)
        self.assertIn('print(f"LOG_{job.upper()}_STATUS=', self.check_script)
        self.assertIn("emit_log STORYCTX storyctx 90", self.check_script)
        self.assertIn("tb_cms_batch_job_process", self.check_script)
        self.assertIn(r"\[DONE\]\s*성공:\s*(\d+),\s*실패:\s*(\d+)", self.check_script)

    def test_story_and_character_pipeline_summary_types_are_covered(self) -> None:
        for summary_type in (
            "episode_summary",
            "episode_character_signals",
            "episode_scene_extraction",
            "character_inventory",
            "character_inventory_v3",
            "relation_inventory",
            "character_rp_profile",
            "character_rp_examples",
            "character_chat_opening_v1",
        ):
            with self.subTest(summary_type=summary_type):
                self.assertIn(summary_type, self.check_script.lower())

        self.assertIn("STORY_FOUNDATION_MISMATCH_ACTIONABLE", self.check_script)
        self.assertIn("STORY_FOUNDATION_MISMATCH_OUT_OF_POLICY", self.check_script)
        self.assertNotIn("STORY_FOUNDATION_MISMATCH_PRODUCTS", self.check_script)
        self.assertIn("COALESCE(p.ai_content_service_enabled_yn, 'N') = 'Y'", self.check_script)
        self.assertIn("COUNT(*) >= 15", self.check_script)
        self.assertIn("2026-03-01 00:00:00", self.check_script)
        self.assertIn("COALESCE(cp.context_status, 'pending') = 'ready'", self.check_script)
        self.assertIn(
            'emit_nonzero_warn STORY_FOUNDATION_MISMATCH_ACTIONABLE',
            self.check_script,
        )
        self.assertIn(
            'emit_informational_count STORY_FOUNDATION_MISMATCH_OUT_OF_POLICY',
            self.check_script,
        )
        self.assertIn("character_chat_*.log", self.check_script)
        self.assertIn('"active rows on visible ongoing products" 1', self.check_script)

    def test_story_foundation_mismatch_caps_character_signals_at_thirty_public_episodes(self) -> None:
        self.assertIn("ROW_NUMBER() OVER", self.check_script)
        self.assertIn("public_episode_rank <= 30", self.check_script)
        self.assertIn(
            "s.summary_type='episode_summary' AND collected_episode.scope_key IS NOT NULL",
            self.check_script,
        )
        self.assertIn(
            "s.summary_type='episode_character_signals' AND collected_episode.scope_key IS NOT NULL",
            self.check_script,
        )

    def test_dna_signal_and_taste_result_tables_are_covered(self) -> None:
        for table_name in (
            "tb_product_ai_metadata",
            "tb_user_ai_signal_event_daily",
            "tb_user_taste_factor_score",
        ):
            with self.subTest(table_name=table_name):
                self.assertIn(table_name, self.check_script)

    def test_error_codes_are_classified_by_source_and_cause(self) -> None:
        cases = (
            (
                "OpenRouter API error (status=402, code=402, message=This request requires more credits)",
                ("openrouter", "insufficient_credits", "HTTP_402"),
            ),
            ("OpenRouter request timeout", ("openrouter", "request_timeout", "TIMEOUT")),
            ("OpenRouter API error status=429", ("openrouter", "rate_limited", "HTTP_429")),
            ("OpenRouter API error status=503", ("openrouter", "upstream_error", "HTTP_503")),
            ("ERROR 1205 (HY000): Lock wait timeout exceeded", ("mysql", "lock_wait_timeout", "MYSQL_1205")),
            ("ERROR 1213 (40001): Deadlock found", ("mysql", "deadlock", "MYSQL_1213")),
            ("ERROR 2013 (HY000): Lost connection to MySQL server during query", ("mysql", "connection_lost", "MYSQL_2013")),
        )
        for sample, expected in cases:
            with self.subTest(sample=sample):
                result = subprocess.run(
                    [sys.executable, str(self.classifier), sample],
                    check=True,
                    capture_output=True,
                    text=True,
                )
                self.assertEqual(tuple(result.stdout.strip().split("\t")[:3]), expected)


if __name__ == "__main__":
    unittest.main()
