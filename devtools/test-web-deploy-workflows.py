#!/usr/bin/env python3
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


def require(content: str, needle: str, workflow: str) -> None:
    if needle not in content:
        raise AssertionError(f"{workflow}: missing {needle!r}")


def require_before(content: str, first: str, second: str, workflow: str) -> None:
    require(content, first, workflow)
    require(content, second, workflow)
    if content.index(first) >= content.index(second):
        raise AssertionError(f"{workflow}: {first!r} must precede {second!r}")


def verify_dev_budget_ssh_preserves_deploy_script(content: str, workflow: str) -> None:
    remote_script = content.split("<< 'ENDSSH'\n", 1)[1].split("\n          ENDSSH", 1)[0]
    budget_check = remote_script.split("            compose_dirs=", 1)[0]
    result = subprocess.run(
        ["bash", "-s"],
        input=(
            "ssh() {\n"
            "  printf 'budget check reached\\n'\n"
            '  for option; do [[ "$option" == -n ]] && return 0; done\n'
            "  cat >/dev/null\n"
            "}\n"
            + budget_check
            + "printf 'compose stage reached\\n'\n"
        ),
        text=True,
        capture_output=True,
        check=True,
        timeout=5,
    )
    if result.stdout != "budget check reached\ncompose stage reached\n":
        raise AssertionError(f"{workflow}: DEV budget SSH consumed the remaining deploy script")


def verify_workflow(
    name: str,
    ports: tuple[int, int, int],
    urls: tuple[str, str, str],
    *,
    remove_orphans: bool,
    prod_only: bool,
) -> None:
    path = ROOT / ".github" / "workflows" / name
    content = path.read_text(encoding="utf-8")

    require(
        content,
        "      - name: Checkout\n"
        "        uses: actions/checkout@v4\n"
        "        with:\n"
        "          submodules: recursive",
        name,
    )

    for command in (
        "bash devtools/test-git-hooks.sh",
        "python3 devtools/test-web-deploy-workflows.py",
        "corepack yarn install --immutable",
        "corepack yarn lint --no-cache",
        "corepack yarn test:utils",
        "npm ci --no-audit --no-fund",
        "npm run test:contracts",
    ):
        require_before(content, command, "Configure AWS credentials", name)

    require(
        content,
        "      - name: Lint service\n"
        "        working-directory: service\n"
        "        run: corepack yarn lint --no-cache\n\n"
        "      - name: Test service utilities and contracts\n"
        "        working-directory: service\n"
        "        run: corepack yarn test:utils",
        name,
    )
    if prod_only:
        require(
            content,
            "  build-and-push:\n    if: github.ref == 'refs/heads/prod'",
            name,
        )
    else:
        verify_dev_budget_ssh_preserves_deploy_script(content, name)

    if 'printf \'%s\' "${{ secrets.' in content:
        raise AssertionError(f"{name}: secret must not be interpolated into shell source")
    if 'echo "${{ secrets.SSH_PRIVATE_KEY_B64 }}"' in content:
        raise AssertionError(f"{name}: SSH key must not be interpolated into shell source")
    if "docker compose down" in content:
        raise AssertionError(f"{name}: must not stop containers before pulling")
    if "docker rm -f" in content:
        raise AssertionError(f"{name}: must not remove containers before pulling")

    require(content, ' bash -s" << \'ENDSSH\'', name)
    require_before(content, "docker compose pull", "docker compose up -d", name)
    if remove_orphans:
        require(content, "docker compose up -d --remove-orphans", name)
    elif "docker compose up -d --remove-orphans" in content:
        raise AssertionError(f"{name}: shared DEV compose project must preserve sibling containers")
    require(content, "wait_for_url()", name)
    require(content, '[[ "$status" == 2* ]]', name)
    require(content, "id: build-service", name)
    require(content, "id: build-partner", name)
    require(content, "id: build-cms", name)
    require(content, "steps.build-service.outputs.digest", name)
    require(content, "steps.build-partner.outputs.digest", name)
    require(content, "steps.build-cms.outputs.digest", name)
    require(content, "verify_service_digest()", name)
    require(content, 'grep -F "@$expected_digest"', name)

    for port in ports:
        require(content, f"http://127.0.0.1:{port}/", name)
    for url in urls:
        require(content, url, name)


verify_workflow(
    "docker-dev.yml",
    (3100, 3101, 3102),
    (
        "https://likenovel.dev",
        "https://partner.likenovel.dev",
        "https://cms.likenovel.dev",
    ),
    remove_orphans=False,
    prod_only=False,
)
verify_workflow(
    "docker-prod.yml",
    (3000, 3001, 3002),
    (
        "https://www.likenovel.net",
        "https://partner.likenovel.net",
        "https://cms.likenovel.net",
    ),
    remove_orphans=True,
    prod_only=True,
)

dev_content = (ROOT / ".github" / "workflows" / "docker-dev.yml").read_text(
    encoding="utf-8"
)
prod_content = (ROOT / ".github" / "workflows" / "docker-prod.yml").read_text(
    encoding="utf-8"
)
for command in (
    "bash devtools/test-dev-rds.sh",
    "python3 devtools/test-dev-rds-workflow.py",
):
    require_before(dev_content, command, "Configure AWS credentials", "docker-dev.yml")
require_before(
    dev_content,
    "Build & Push - cms",
    "bash devtools/dev-rds.sh work-start",
    "docker-dev.yml",
)
require_before(
    dev_content,
    "bash devtools/dev-rds.sh work-start",
    "Deploy to dev server (ln-web)",
    "docker-dev.yml",
)
if "dev-rds.sh" in prod_content:
    raise AssertionError("docker-prod.yml: DEV RDS lifecycle must not affect PROD")

# Execute the real remote shell with a denied budget; no Docker command may run.
import os
import subprocess
import tempfile
import textwrap

remote = dev_content.split("<< 'ENDSSH'", 1)[1].split("\n          ENDSSH", 1)[0]
with tempfile.TemporaryDirectory() as directory:
    temp = Path(directory)
    trace = temp / "calls"
    for name, code in (("ssh", 23), ("docker", 99)):
        command = temp / name
        command.write_text('#!/bin/sh\nprintf "%s\n" "' + name + '" >> "$DEV_GUARD_TRACE"\nexit ' + str(code) + '\n')
        command.chmod(0o700)
    result = subprocess.run(["/bin/bash"], input=textwrap.dedent(remote), text=True,
        capture_output=True, timeout=5,
        env={"PATH": str(temp), "DEV_GUARD_TRACE": str(trace)})
    if result.returncode != 23 or trace.read_text().splitlines() != ["ssh"]:
        raise AssertionError("DEV web must reject insufficient runtime before any Docker mutation")

print("web deploy workflow contract tests passed")
