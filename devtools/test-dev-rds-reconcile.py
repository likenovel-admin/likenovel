#!/usr/bin/env python3
import importlib.util
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "devtools" / "dev-rds-reconcile.py"


class FakeRds:
    def __init__(self, status="available", tag="100", tag_on_stop=None) -> None:
        self.status = status
        self.tag = tag
        self.tag_on_stop = tag_on_stop
        self.stopped = False
        self.started = False

    def describe_db_instances(self, **_kwargs):
        return {
            "DBInstances": [
                {
                    "DBInstanceIdentifier": "likenovel-dev",
                    "DBInstanceArn": "arn:aws:rds:ap-northeast-2:123456789012:db:likenovel-dev",
                    "DBInstanceStatus": self.status,
                }
            ]
        }

    def list_tags_for_resource(self, **_kwargs):
        if self.tag is None:
            return {"TagList": []}
        return {
            "TagList": [
                {
                    "Key": "likenovel-dev-work-until-epoch",
                    "Value": self.tag,
                }
            ]
        }

    def stop_db_instance(self, **_kwargs):
        self.stopped = True
        self.status = "stopped"
        if self.tag_on_stop is not None:
            self.tag = self.tag_on_stop

    def start_db_instance(self, **_kwargs):
        self.started = True
        self.status = "starting"


def load_module():
    spec = importlib.util.spec_from_file_location("dev_rds_reconcile", SCRIPT)
    if spec is None or spec.loader is None:
        raise AssertionError(f"cannot load {SCRIPT}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


module = load_module()
client = FakeRds()
result = module.reconcile(client, now_epoch=200, sleep=lambda _seconds: None)

if result != 0:
    raise AssertionError(f"expired lease reconcile failed with rc={result}")
if not client.stopped:
    raise AssertionError("expired lease must stop likenovel-dev")

client = FakeRds(tag="300")
result = module.reconcile(client, now_epoch=200, sleep=lambda _seconds: None)
if result != 0 or client.stopped:
    raise AssertionError("active lease must keep likenovel-dev available")

for invalid_tag in (None, "not-a-time"):
    client = FakeRds(tag=invalid_tag)
    result = module.reconcile(client, now_epoch=200, sleep=lambda _seconds: None)
    if result == 0 or client.stopped:
        raise AssertionError("invalid lease must fail loudly without stopping likenovel-dev")

client = FakeRds(tag_on_stop="300")
result = module.reconcile(client, now_epoch=200, sleep=lambda _seconds: None)
if result != 0 or not client.stopped or not client.started:
    raise AssertionError("lease renewed while stopping must restore likenovel-dev")

service = (ROOT / "devtools" / "systemd" / "likenovel-dev-rds-reconcile.service").read_text()
timer = (ROOT / "devtools" / "systemd" / "likenovel-dev-rds-reconcile.timer").read_text()
if "User=ln-admin" not in service:
    raise AssertionError("server reconcile service must run as ln-admin")
if "ExecStart=/usr/bin/python3 /home/ln-admin/likenovel/dev-rds/dev-rds-reconcile.py" not in service:
    raise AssertionError("server reconcile service must use the canonical deployed script path")
for required in ("OnCalendar=*:0/5", "Persistent=true", "RandomizedDelaySec=0"):
    if required not in timer:
        raise AssertionError(f"server reconcile timer missing {required}")

print("DEV RDS server reconcile tests passed")
