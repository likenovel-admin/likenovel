import unittest
import sqlite3
from pathlib import Path


class WebsochatMonitorTest(unittest.TestCase):
    def _missing_product_count(self, *, missing_rank: int, consent: str = "Y") -> int:
        script = (Path(__file__).resolve().parents[3] / "ops/monitor-prod/checks/websochat.sh").read_text()
        query = script.split("SELECT 'CONTEXT_MISSING_PRODUCTS', COUNT(*)", 1)[1].split(";", 1)[0]
        with sqlite3.connect(":memory:") as db:
            db.executescript("""
                CREATE TABLE tb_product(product_id,price_type,open_yn,blind_yn,ai_content_service_enabled_yn,status_code);
                CREATE TABLE tb_product_episode(product_id,episode_id,episode_no,use_yn,open_yn);
                CREATE TABLE tb_story_agent_context_product(product_id,context_status);
                CREATE TABLE tb_story_agent_context_summary(product_id,summary_id,summary_type,is_active,scope_key);
            """)
            db.create_function("CONCAT", -1, lambda *parts: "".join(map(str, parts)))
            db.execute("INSERT INTO tb_product VALUES(1,'free','Y','N',?,'ongoing')", (consent,))
            for rank in range(1, 32):
                db.execute("INSERT INTO tb_product_episode VALUES(1,?,?, 'Y','Y')", (rank, rank * 2))
                if rank != missing_rank:
                    db.execute("INSERT INTO tb_story_agent_context_summary VALUES(1,?,'episode_summary','Y',?)", (rank, f"episode:{rank}"))
            return db.execute("SELECT COUNT(*) " + query).fetchone()[0]

    def test_missing_episode_after_thirtieth_public_ordinal_is_not_backlog(self):
        self.assertEqual(self._missing_product_count(missing_rank=31), 0)

    def test_missing_thirtieth_public_ordinal_still_alerts_despite_number_gaps(self):
        self.assertEqual(self._missing_product_count(missing_rank=30), 1)

    def test_nonconsenting_product_is_not_backlog(self):
        self.assertEqual(self._missing_product_count(missing_rank=1, consent="N"), 0)

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
