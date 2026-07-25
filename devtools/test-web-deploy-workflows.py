#!/usr/bin/env python3
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


def verify_workflow(
    name: str,
    ports: tuple[int, int, int],
    urls: tuple[str, str, str],
    *,
    remove_orphans: bool,
) -> None:
    path = ROOT / ".github" / "workflows" / name
    content = path.read_text(encoding="utf-8")

    for command in (
        "bash devtools/test-git-hooks.sh",
        "python3 devtools/test-web-deploy-workflows.py",
        "corepack yarn install --immutable",
        "corepack yarn lint --no-cache",
        "npm ci --no-audit --no-fund",
        "npm run test:contracts",
    ):
        require_before(content, command, "Configure AWS credentials", name)

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
)

print("web deploy workflow contract tests passed")
