import unittest
from pathlib import Path


class WebsochatMonitorTest(unittest.TestCase):
    def test_context_failed_counts_only_visible_free_products(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        script = (repo_root / "ops" / "monitor-prod" / "checks" / "websochat.sh").read_text(encoding="utf-8")

        self.assertIn("SELECT 'CONTEXT_FAILED', COUNT(*)", script)
        self.assertIn("JOIN tb_product p ON p.product_id=sacp.product_id", script)
        self.assertIn("sacp.context_status='failed'", script)
        self.assertIn("p.price_type='free'", script)
        self.assertIn("p.open_yn='Y'", script)
        self.assertIn("p.blind_yn='N'", script)

    def test_context_missing_counts_only_active_episode_summaries(self) -> None:
        repo_root = Path(__file__).resolve().parents[3]
        script = (repo_root / "ops" / "monitor-prod" / "checks" / "websochat.sh").read_text(encoding="utf-8")

        self.assertIn("sacs.summary_type='episode_summary'", script)
        self.assertIn("sacs.is_active='Y'", script)
        self.assertIn("sacs.scope_key=CONCAT('episode:', pe.episode_id)", script)


if __name__ == "__main__":
    unittest.main()
