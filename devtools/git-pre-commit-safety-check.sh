#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

submodule_git() {
  env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE git -C "$SUBMODULE_PATH" "$@"
}

index_rows="$(git ls-files -s -- "$SUBMODULE_PATH")"
if [[ -z "$index_rows" ]]; then
  echo "ERROR: submodule path is not tracked in the root index: $SUBMODULE_PATH" >&2
  exit 1
fi

if [[ "$(printf '%s\n' "$index_rows" | wc -l | tr -d ' ')" != "1" ]]; then
  echo "ERROR: submodule path has multiple index stages. Resolve the submodule conflict first: $SUBMODULE_PATH" >&2
  printf '%s\n' "$index_rows" >&2
  exit 1
fi

expected_sha="$(printf '%s\n' "$index_rows" | awk '{print $2}')"
actual_sha="$(submodule_git rev-parse HEAD 2>/dev/null || true)"
if [[ -z "$actual_sha" ]]; then
  echo "ERROR: submodule is not initialized or has no readable HEAD: $SUBMODULE_PATH" >&2
  echo "Run: git submodule update --init --checkout $SUBMODULE_PATH" >&2
  exit 1
fi

if [[ "$actual_sha" != "$expected_sha" ]]; then
  echo "ERROR: submodule working tree HEAD does not match the root index gitlink: $SUBMODULE_PATH" >&2
  echo "root index expects: $expected_sha" >&2
  echo "submodule HEAD:    $actual_sha" >&2
  echo "Run: git submodule update --init --checkout $SUBMODULE_PATH" >&2
  exit 1
fi

submodule_status="$(submodule_git status --porcelain)"
if [[ -n "$submodule_status" ]]; then
  echo "ERROR: submodule has its own dirty worktree: $SUBMODULE_PATH" >&2
  printf '%s\n' "$submodule_status" >&2
  echo "Commit or stash backend changes in the submodule before committing from the root repo." >&2
  exit 1
fi

if git diff --cached --name-only -- "$SUBMODULE_PATH" | grep -q .; then
  if [[ "${ALLOW_SUBMODULE_POINTER_COMMIT:-}" == "1" ]]; then
    echo "ALLOW_SUBMODULE_POINTER_COMMIT=1 set; allowing staged submodule pointer:" >&2
    git diff --cached --submodule=log -- "$SUBMODULE_PATH" >&2 || true
    exit 0
  fi

  echo "ERROR: submodule pointer is staged: $SUBMODULE_PATH" >&2
  echo "Do not commit the backend submodule pointer from the root repo unless this is an intentional backend-linked deploy." >&2
  echo "If this is intentional, rerun commit with:" >&2
  echo "  ALLOW_SUBMODULE_POINTER_COMMIT=1 git commit ..." >&2
  echo "Unstage it first:" >&2
  echo "  git restore --staged $SUBMODULE_PATH" >&2
  exit 1
fi
