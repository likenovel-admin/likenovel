#!/usr/bin/env python3
import contextlib
import fcntl
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import sys
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("dev_rds", ROOT / "devtools/dev-rds-reconcile.py")
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)


class FakeRds:
    def __init__(self, statuses=None, identifier="likenovel-dev"):
        self.statuses = list(statuses or ["available"])
        self.identifier = identifier
        self.starts = 0
        self.stops = 0

    def describe_db_instances(self, **kwargs):
        assert kwargs == {"DBInstanceIdentifier": "likenovel-dev"}
        status = self.statuses[0]
        if len(self.statuses) > 1:
            self.statuses.pop(0)
        return {"DBInstances": [{"DBInstanceIdentifier": self.identifier, "DBInstanceStatus": status}]}

    def start_db_instance(self, **kwargs):
        self.starts += 1
        self.statuses = ["starting", "configuring-enhanced-monitoring", "available"]

    def stop_db_instance(self, **kwargs):
        assert kwargs == {"DBInstanceIdentifier": "likenovel-dev"}
        self.stops += 1
        self.statuses = ["stopping"]


class LifecycleTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.path = Path(self.temp.name) / "state.json"
        self.rds = FakeRds()
        self.now = 1000

    def clock(self):
        return self.now

    def running(self, start=1000):
        m.save_state(self.path, {"db_id": "likenovel-dev", "phase": "running", "run_id": "run-one", "started_at": start})

    def test_start_records_once_after_available(self):
        self.rds = FakeRds(["stopped"])
        m.start(self.rds, self.path, clock=self.clock, sleep=lambda _: None)
        self.assertEqual(self.rds.starts, 1)
        first = m.load_state(self.path)
        self.now = 2000
        m.start(self.rds, self.path, clock=self.clock)
        self.assertEqual(m.load_state(self.path), first)
        self.assertEqual(first["started_at"], 1000)
        self.assertEqual(self.rds.starts, 1)

    def test_engine_restart_does_not_extend_rds_run(self):
        self.running()
        self.rds.statuses = ["rebooting"]
        self.now = 4000
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(m.load_state(self.path)["started_at"], 1000)
        self.rds.statuses = ["available"]
        self.now = 4600
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 1)

    def test_start_waits_through_reboot_and_configuration(self):
        m.save_state(self.path, {"db_id": "likenovel-dev", "phase": "starting", "run_id": "pending"})
        self.rds.statuses = ["configuring-enhanced-monitoring", "rebooting", "configuring-log-exports", "available"]
        m.start(self.rds, self.path, self.clock, lambda _: None)
        self.assertEqual(self.rds.starts, 0)
        self.assertEqual(m.load_state(self.path)["run_id"], "pending")

    def test_wait_is_bounded_for_unknown_intermediate_state(self):
        m.save_state(self.path, {"db_id": "likenovel-dev", "phase": "starting", "run_id": "pending"})
        self.rds.statuses = ["configuring-enhanced-monitoring"]
        with self.assertRaisesRegex(RuntimeError, "timed out"):
            m.start(self.rds, self.path, self.clock, lambda _: None)
        self.assertEqual(self.rds.starts, 0)

    def test_timer_skips_busy_lock_without_false_failure(self):
        with (self.path.parent / "lock").open("a") as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            with patch.object(m, "STATE_DIR", self.path.parent), patch.object(sys, "argv", ["controller", "reconcile"]):
                m.main()

    def test_hour_boundary(self):
        for now, stops in ((4599, 0), (4600, 1)):
            self.running()
            self.rds = FakeRds()
            self.now = now
            m.reconcile(self.rds, self.path, self.clock)
            self.assertEqual(self.rds.stops, stops)

    def test_fractional_start_is_not_rounded_down(self):
        self.running(1000.9)
        self.now = 4600.8
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 0)
        self.now = 4600.9
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 1)

    def test_manager_restart_keeps_clock(self):
        self.running()
        self.now = 4500
        self.assertEqual(m.check_budget(self.rds, self.path, 100, self.clock), 100)
        self.assertEqual(m.load_state(self.path)["started_at"], 1000)

    def test_new_managed_start_gets_new_run(self):
        self.running()
        self.rds.statuses = ["stopped"]
        m.reconcile(self.rds, self.path, self.clock)
        self.now = 9000
        m.start(self.rds, self.path, self.clock, lambda _: None)
        self.assertEqual(m.load_state(self.path)["started_at"], 9000)
        self.assertNotEqual(m.load_state(self.path)["run_id"], "run-one")

    def test_unmanaged_start_is_not_assigned_old_deadline(self):
        m.save_state(self.path, {"db_id": "likenovel-dev", "phase": "idle"})
        with self.assertRaisesRegex(RuntimeError, "unmanaged"):
            m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 0)

    def test_missing_record_does_not_invent_a_clock(self):
        with self.assertRaises(RuntimeError):
            m.check_budget(self.rds, self.path, 600, self.clock)
        self.assertFalse(self.path.exists())

    def test_interrupted_start_is_finished_by_timer(self):
        m.save_state(self.path, {"db_id": "likenovel-dev", "phase": "starting", "run_id": "pending"})
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(m.load_state(self.path)["started_at"], self.now)
        self.assertEqual(self.rds.stops, 0)

    def test_pending_receipt_survives_stale_stopped_response(self):
        state = {"db_id": "likenovel-dev", "phase": "starting", "run_id": "pending"}
        m.save_state(self.path, state)
        self.rds.statuses = ["stopped"]
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(m.load_state(self.path), state)
        with self.assertRaisesRegex(RuntimeError, "pending"):
            m.start(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.starts, 0)

    def test_starting_before_stop_is_not_waited_out(self):
        self.running()
        self.now = 4600
        self.rds.statuses = ["available", "starting"]
        m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 0)

    def test_ambiguous_start_response_is_not_retried(self):
        self.rds.statuses = ["stopped"]
        with patch.object(self.rds, "start_db_instance", side_effect=TimeoutError):
            with self.assertRaises(TimeoutError):
                m.start(self.rds, self.path, self.clock)
        self.assertEqual(m.load_state(self.path)["phase"], "starting")

    def test_ambiguous_stop_response_is_not_retried(self):
        self.running()
        self.now = 4600
        with patch.object(self.rds, "stop_db_instance", side_effect=TimeoutError) as stop:
            with self.assertRaises(TimeoutError):
                m.reconcile(self.rds, self.path, self.clock)
            with self.assertRaises(RuntimeError):
                m.reconcile(self.rds, self.path, self.clock)
            self.assertEqual(stop.call_count, 1)
        self.assertEqual(m.load_state(self.path)["phase"], "stopping")

    def test_budget_boundary_and_no_extension(self):
        self.running()
        self.now = 4000
        before = self.path.read_bytes()
        self.assertEqual(m.check_budget(self.rds, self.path, 600, self.clock), 600)
        with self.assertRaisesRegex(RuntimeError, "deployment blocked"):
            m.check_budget(self.rds, self.path, 601, self.clock)
        self.assertEqual(self.path.read_bytes(), before)
        self.assertEqual(self.rds.starts + self.rds.stops, 0)

    def test_budget_rechecked_after_queue_delay(self):
        self.running()
        m.check_budget(self.rds, self.path, 600, self.clock)
        self.now = 4500
        with self.assertRaises(RuntimeError):
            m.check_budget(self.rds, self.path, 600, self.clock)

    def test_clock_rollback_is_visible(self):
        self.running(2000)
        with self.assertRaises(RuntimeError):
            m.check_budget(self.rds, self.path, 600, self.clock)

    def test_wrong_target_and_bad_record_fail(self):
        self.rds.identifier = "prod"
        with self.assertRaises(RuntimeError):
            m.reconcile(self.rds, self.path, self.clock)
        self.path.write_text('{"db_id":"prod","phase":"idle"}')
        with self.assertRaises(RuntimeError):
            m.load_state(self.path)

    def test_slow_stop_decision_is_aborted(self):
        self.running()
        self.now = 4600
        with patch.object(m.time, "monotonic", side_effect=[0, 11]):
            with self.assertRaises(RuntimeError):
                m.reconcile(self.rds, self.path, self.clock)
        self.assertEqual(self.rds.stops, 0)


if __name__ == "__main__":
    unittest.main()
