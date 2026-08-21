#!/usr/bin/env python3
import sys
import time
from typing import Callable


DB_ID = "likenovel-dev"
REGION = "ap-northeast-2"
WORK_TTL_TAG = "likenovel-dev-work-until-epoch"
WAIT_ATTEMPTS = 120
WAIT_SECONDS = 10


def read_instance(rds):
    response = rds.describe_db_instances(DBInstanceIdentifier=DB_ID)
    instance = response["DBInstances"][0]
    if instance["DBInstanceIdentifier"] != DB_ID:
        raise RuntimeError(f"refusing unexpected DB target: {instance['DBInstanceIdentifier']}")
    return instance


def read_deadline(rds, arn: str):
    response = rds.list_tags_for_resource(ResourceName=arn)
    for tag in response.get("TagList", []):
        if tag.get("Key") == WORK_TTL_TAG:
            value = tag.get("Value", "")
            return int(value) if value.isdigit() else None
    return None


def wait_until_stopped(rds, sleep: Callable[[int], None]) -> bool:
    for _ in range(WAIT_ATTEMPTS):
        status = read_instance(rds)["DBInstanceStatus"]
        if status == "stopped":
            return True
        if status not in {"available", "stopping"}:
            raise RuntimeError(f"cannot wait for {DB_ID} to stop from status: {status}")
        sleep(WAIT_SECONDS)
    return False


def reconcile(rds, now_epoch: int | None = None, sleep: Callable[[int], None] = time.sleep) -> int:
    instance = read_instance(rds)
    status = instance["DBInstanceStatus"]
    if status in {"stopped", "stopping"}:
        print(f"[dev-rds-timer] {DB_ID} status={status}; no action needed")
        return 0
    if status != "available":
        print(f"[dev-rds-timer] {DB_ID} status={status}; skip reconcile")
        return 0

    deadline = read_deadline(rds, instance["DBInstanceArn"])
    if deadline is None:
        print(
            f"[dev-rds-timer] work lease is missing or malformed; keep {DB_ID} available",
            file=sys.stderr,
        )
        return 1

    now = int(time.time()) if now_epoch is None else now_epoch
    if now < deadline:
        print(f"[dev-rds-timer] work lease active until epoch={deadline}; keep {DB_ID} available")
        return 0

    if read_deadline(rds, instance["DBInstanceArn"]) != deadline:
        print(f"[dev-rds-timer] work lease changed during reconcile; keep {DB_ID} available")
        return 0

    print(f"[dev-rds-timer] work lease expired at epoch={deadline}; stopping {DB_ID}")
    rds.stop_db_instance(DBInstanceIdentifier=DB_ID)
    if not wait_until_stopped(rds, sleep):
        raise RuntimeError(f"timed out waiting for {DB_ID} to stop")

    latest_deadline = read_deadline(rds, instance["DBInstanceArn"])
    current_time = int(time.time()) if now_epoch is None else now_epoch
    if latest_deadline is not None and current_time < latest_deadline:
        print(f"[dev-rds-timer] work lease renewed while stopping; restoring {DB_ID}")
        rds.start_db_instance(DBInstanceIdentifier=DB_ID)
    return 0


def main() -> int:
    import boto3

    return reconcile(boto3.client("rds", region_name=REGION))


if __name__ == "__main__":
    raise SystemExit(main())
