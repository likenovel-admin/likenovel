#!/usr/bin/env python3
"""Own DEV RDS start/stop and an immutable clock for each managed run."""
import argparse
import fcntl
import json
import math
import os
from pathlib import Path
import sys
import time
import uuid

LIFECYCLE_PROTOCOL = 2
DB_ID = "likenovel-dev"
REGION = "ap-northeast-2"
RUN_SECONDS = 3600
STATE_DIR = Path("/var/lib/likenovel-dev-rds")


def read_instance(rds):
    instance = rds.describe_db_instances(DBInstanceIdentifier=DB_ID)["DBInstances"][0]
    if instance["DBInstanceIdentifier"] != DB_ID:
        raise RuntimeError("refusing unexpected DB target")
    return instance


def save_state(path, state):
    temporary = path.with_suffix(".tmp")
    with temporary.open("w") as stream:
        os.chmod(temporary, 0o600)
        json.dump(state, stream)
        stream.flush()
        os.fsync(stream.fileno())
    os.replace(temporary, path)
    directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(directory)
    finally:
        os.close(directory)


def load_state(path):
    if not path.exists():
        return None
    state = json.loads(path.read_text())
    if state.get("db_id") != DB_ID or state.get("phase") not in {"idle", "starting", "running", "stopping"}:
        raise RuntimeError("invalid DEV run record")
    if state["phase"] == "running" and (
        type(state.get("started_at")) not in (int, float)
        or not math.isfinite(state["started_at"])
        or not state.get("run_id")
    ):
        raise RuntimeError("invalid DEV run clock")
    return state


def observe(rds, path, now):
    instance = read_instance(rds)
    status = instance["DBInstanceStatus"]
    state = load_state(path)
    if status == "stopped" and (not state or state["phase"] != "starting"):
        state = {"db_id": DB_ID, "phase": "idle"}
        save_state(path, state)
    elif status == "available":
        if state and state["phase"] == "starting":
            state = {**state, "phase": "running", "started_at": now}
            save_state(path, state)
        elif not state or state["phase"] != "running":
            raise RuntimeError("unmanaged DEV start: do not infer a clock; inspect the actual start before adoption")
    # An engine reboot/modification never replaces the current run's clock.
    return instance, state


def remaining_seconds(state, now):
    if not state or state["phase"] != "running":
        raise RuntimeError("DEV has no confirmed run clock")
    if now < state["started_at"]:
        raise RuntimeError("clock moved backwards; refusing time-based operation")
    return state["started_at"] + RUN_SECONDS - now


def check_budget(rds, path, seconds, clock=time.time):
    if type(seconds) is not int or not 0 < seconds <= RUN_SECONDS:
        raise ValueError("deployment budget must be 1..3600 seconds")
    now = clock()
    instance, state = observe(rds, path, now)
    if instance["DBInstanceStatus"] != "available":
        raise RuntimeError("DEV is not available; deployment blocked")
    remaining = remaining_seconds(state, now)
    if remaining < seconds:
        raise RuntimeError(f"deployment blocked: DEV remaining={remaining}s required={seconds}s; no automatic extension")
    print(f"[dev-rds] deployment budget OK: remaining={remaining}s required={seconds}s")
    return remaining


def start(rds, path, clock=time.time, sleep=time.sleep):
    instance = read_instance(rds)
    if instance["DBInstanceStatus"] == "stopped":
        existing = load_state(path)
        if existing and existing["phase"] == "starting":
            raise RuntimeError("previous start outcome is pending; inspect before resubmitting")
        # Persist ownership BEFORE submitting. Unknown submission outcomes retain
        # the receipt and are reconciled; they are never blindly resubmitted.
        save_state(path, {"db_id": DB_ID, "phase": "starting", "run_id": str(uuid.uuid4())})
        rds.start_db_instance(DBInstanceIdentifier=DB_ID)
    elif instance["DBInstanceStatus"] not in {"available", "starting"}:
        raise RuntimeError("DEV is transitioning; retry start after checking its state")
    for _ in range(120):
        instance, state = observe(rds, path, clock())
        if instance["DBInstanceStatus"] == "available":
            print(f"[dev-rds] available; remaining={remaining_seconds(state, clock())}s")
            return
        if instance["DBInstanceStatus"] not in {"stopped", "starting", "configuring-enhanced-monitoring", "configuring-iam-database-auth", "backing-up"}:
            raise RuntimeError("unexpected state while waiting for DEV start")
        sleep(10)
    raise RuntimeError("DEV start wait timed out; retain the run record and inspect status")


def stop(rds, path):
    instance = read_instance(rds)
    if instance["DBInstanceStatus"] == "stopped":
        save_state(path, {"db_id": DB_ID, "phase": "idle"})
        return
    if instance["DBInstanceStatus"] != "available":
        raise RuntimeError("DEV is not available; do not wait for startup and then stop")
    previous = load_state(path) or {"db_id": DB_ID}
    save_state(path, {**previous, "phase": "stopping"})
    rds.stop_db_instance(DBInstanceIdentifier=DB_ID)
    print("[dev-rds] stop requested")


def reconcile(rds, path, clock=time.time):
    decision_started = time.monotonic()
    instance, state = observe(rds, path, clock())
    if instance["DBInstanceStatus"] != "available":
        return
    if remaining_seconds(state, clock()) > 0:
        return
    latest, current = observe(rds, path, clock())
    if latest["DBInstanceStatus"] != "available" or current["run_id"] != state["run_id"]:
        return
    if time.monotonic() - decision_started > 10:
        raise RuntimeError("stale stop decision; retry with a fresh observation")
    stop(rds, path)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("action", nargs="?", default="reconcile", choices=("start", "stop", "status", "endpoint", "reconcile", "check-budget"))
    parser.add_argument("--seconds", type=int, default=0)
    args = parser.parse_args()
    import boto3
    from botocore.config import Config
    # StateDirectory is provisioned by the service, never a per-client file.
    with (STATE_DIR / "lock").open("a") as lock:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        rds = boto3.client("rds", region_name=REGION,
            config=Config(connect_timeout=3, read_timeout=5, retries={"total_max_attempts": 1}))
        path = STATE_DIR / "state.json"
        if args.action == "start":
            start(rds, path)
        elif args.action == "stop":
            stop(rds, path)
        elif args.action == "check-budget":
            check_budget(rds, path, args.seconds)
        elif args.action == "endpoint":
            print(read_instance(rds)["Endpoint"]["Address"])
        elif args.action == "status":
            instance, state = observe(rds, path, time.time())
            print(json.dumps({"status": instance["DBInstanceStatus"], "run": state}))
        else:
            reconcile(rds, path)


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        detail = str(error) if isinstance(error, (RuntimeError, ValueError)) else type(error).__name__
        print(f"[dev-rds] FAILED: {detail}; verify state before retry", file=sys.stderr)
        sys.exit(1)
