#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"
ZERO_SHA="0000000000000000000000000000000000000000"

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

original_sha="$(git -C "$SUBMODULE_PATH" rev-parse HEAD)"
dirty_test_file="$SUBMODULE_PATH/.submodule-hook-dirty-test"

cleanup() {
  rm -f "$dirty_test_file"
  git restore --staged "$SUBMODULE_PATH" >/dev/null 2>&1 || true
  git -C "$SUBMODULE_PATH" switch --detach "$original_sha" >/dev/null
}
trap cleanup EXIT

expect_fail() {
  local label="$1"
  shift
  if "$@" >/tmp/likenovel-hook-test.out 2>&1; then
    cat /tmp/likenovel-hook-test.out
    echo "ERROR: expected failure did not happen: $label" >&2
    exit 1
  fi
  echo "ok: $label"
}

expect_pass() {
  local label="$1"
  shift
  "$@" >/tmp/likenovel-hook-test.out 2>&1
  echo "ok: $label"
}

expect_pass "pre-commit normal" .git/hooks/pre-commit
expect_pass "pre-push normal" bash devtools/git-pre-push-safety-check.sh

git -C "$SUBMODULE_PATH" switch --detach origin/dev >/dev/null
expect_fail "pre-commit blocks submodule HEAD drift" env GIT_INDEX_FILE=.git/index .git/hooks/pre-commit

head_sha="$(git rev-parse HEAD)"
expect_fail "pre-push blocks submodule HEAD drift" bash -c \
  "printf 'HEAD %s refs/heads/test-submodule-drift %s\n' '$head_sha' '$ZERO_SHA' | bash devtools/git-pre-push-safety-check.sh"
git -C "$SUBMODULE_PATH" switch --detach "$original_sha" >/dev/null

touch "$dirty_test_file"
expect_fail "pre-commit blocks dirty submodule" .git/hooks/pre-commit
rm -f "$dirty_test_file"

dev_submodule_sha="$(git ls-tree origin/dev -- "$SUBMODULE_PATH" | awk '{print $3}')"
main_dev_base="$(git merge-base origin/main origin/dev || true)"
if [[ -n "$dev_submodule_sha" && -n "$main_dev_base" ]] &&
   git diff --name-only "$main_dev_base" origin/dev | grep -Fxq "$SUBMODULE_PATH"; then
  git -C "$SUBMODULE_PATH" switch --detach "$dev_submodule_sha" >/dev/null
  dev_sha="$(git rev-parse origin/dev)"
  expect_fail "pre-push blocks new-branch range submodule pointer" bash -c \
    "printf 'refs/heads/dev %s refs/heads/dev %s\n' '$dev_sha' '$ZERO_SHA' | bash devtools/git-pre-push-safety-check.sh"
  git -C "$SUBMODULE_PATH" switch --detach "$original_sha" >/dev/null
else
  echo "skip: origin/dev has no submodule pointer diff from origin/main"
fi

echo "git hook tests passed."
