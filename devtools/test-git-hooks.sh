#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"
ZERO_SHA="0000000000000000000000000000000000000000"

repo_root="$(git rev-parse --show-toplevel)"
pre_commit_under_test="$repo_root/devtools/git-pre-commit-safety-check.sh"
pre_push_under_test="$repo_root/devtools/git-pre-push-safety-check.sh"
fixture_root="$(mktemp -d)"
backend_remote="$fixture_root/backend-origin.git"
backend_work="$fixture_root/backend-work"
root_remote="$fixture_root/root-origin.git"
root_work="$fixture_root/root-work"
linked_work="$fixture_root/root-linked"

cleanup() {
  if [[ -n "${fixture_root:-}" && -d "$fixture_root" ]]; then
    rm -rf -- "$fixture_root"
  fi
}
trap cleanup EXIT

expect_fail() {
  local label expected output status
  label="$1"
  expected="$2"
  shift 2

  set +e
  output="$("$@" 2>&1)"
  status=$?
  set -e

  if (( status == 0 )); then
    printf '%s\n' "$output"
    echo "ERROR: expected failure did not happen: $label" >&2
    exit 1
  fi
  if ! grep -Fq -- "$expected" <<<"$output"; then
    printf '%s\n' "$output"
    echo "ERROR: expected blocker was not reported for $label: $expected" >&2
    exit 1
  fi
  echo "ok: $label"
}

expect_pass() {
  local label output status
  label="$1"
  shift

  set +e
  output="$("$@" 2>&1)"
  status=$?
  set -e

  if (( status != 0 )); then
    printf '%s\n' "$output"
    echo "ERROR: expected pass failed: $label" >&2
    exit 1
  fi
  echo "ok: $label"
}

git_setup_identity() {
  git -C "$1" config user.name "LikeNovel Hook Test"
  git -C "$1" config user.email "hook-test@likenovel.invalid"
}

make_root_commit() {
  local parent pointer message index_path tree
  parent="$1"
  pointer="$2"
  message="$3"
  index_path="$fixture_root/root-index-$RANDOM-$RANDOM"

  rm -f -- "$index_path"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" read-tree "$parent"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" update-index \
    --add --cacheinfo "160000,$pointer,$SUBMODULE_PATH"
  tree="$(GIT_INDEX_FILE="$index_path" git -C "$root_work" write-tree)"
  rm -f -- "$index_path"
  printf '%s\n' "$message" | git -C "$root_work" commit-tree "$tree" -p "$parent"
}

make_root_merge_commit() {
  local pointer message first_parent index_path tree parent
  local -a parent_args=()
  pointer="$1"
  message="$2"
  shift 2
  first_parent="$1"
  index_path="$fixture_root/root-index-$RANDOM-$RANDOM"

  rm -f -- "$index_path"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" read-tree "$first_parent"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" update-index \
    --add --cacheinfo "160000,$pointer,$SUBMODULE_PATH"
  tree="$(GIT_INDEX_FILE="$index_path" git -C "$root_work" write-tree)"
  rm -f -- "$index_path"

  for parent in "$@"; do
    parent_args+=(-p "$parent")
  done
  printf '%s\n' "$message" |
    git -C "$root_work" commit-tree "$tree" "${parent_args[@]}"
}

make_root_commit_without_submodule() {
  local parent message index_path tree
  parent="$1"
  message="$2"
  index_path="$fixture_root/root-index-$RANDOM-$RANDOM"

  rm -f -- "$index_path"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" read-tree "$parent"
  GIT_INDEX_FILE="$index_path" git -C "$root_work" update-index \
    --force-remove "$SUBMODULE_PATH"
  tree="$(GIT_INDEX_FILE="$index_path" git -C "$root_work" write-tree)"
  rm -f -- "$index_path"
  printf '%s\n' "$message" | git -C "$root_work" commit-tree "$tree" -p "$parent"
}

run_pre_commit_at() {
  (
    cd "$1"
    bash "$pre_commit_under_test"
  )
}

run_pre_push_at() {
  local worktree updates git_dir index_file
  worktree="$1"
  updates="$2"
  git_dir="$(git -C "$worktree" rev-parse --absolute-git-dir)"
  index_file="$(git -C "$worktree" rev-parse --git-path index)"
  (
    cd "$worktree"
    printf '%s\n' "$updates" |
      env \
        GIT_DIR="$git_dir" \
        GIT_WORK_TREE="$worktree" \
        GIT_INDEX_FILE="$index_file" \
        bash "$pre_push_under_test" origin "$root_remote"
  )
}

run_pre_push_with_pointer_allow_at() {
  local worktree updates git_dir index_file
  worktree="$1"
  updates="$2"
  git_dir="$(git -C "$worktree" rev-parse --absolute-git-dir)"
  index_file="$(git -C "$worktree" rev-parse --git-path index)"
  (
    cd "$worktree"
    printf '%s\n' "$updates" |
      env \
        GIT_DIR="$git_dir" \
        GIT_WORK_TREE="$worktree" \
        GIT_INDEX_FILE="$index_file" \
        ALLOW_SUBMODULE_POINTER_PUSH=1 \
        bash "$pre_push_under_test" origin "$root_remote"
  )
}

git init --bare --initial-branch=main "$backend_remote" >/dev/null
git init --initial-branch=main "$backend_work" >/dev/null
git_setup_identity "$backend_work"
printf 'backend base\n' >"$backend_work/backend.txt"
git -C "$backend_work" add backend.txt
git -C "$backend_work" commit -m "backend base" >/dev/null
backend_base="$(git -C "$backend_work" rev-parse HEAD)"
git -C "$backend_work" remote add origin "$backend_remote"
git -C "$backend_work" push origin "$backend_base:refs/heads/main" >/dev/null
git -C "$backend_work" push origin "$backend_base:refs/heads/dev" >/dev/null
git -C "$backend_work" push origin "$backend_base:refs/heads/prod" >/dev/null

printf 'backend forward one\n' >>"$backend_work/backend.txt"
git -C "$backend_work" commit -am "backend forward one" >/dev/null
backend_forward_one="$(git -C "$backend_work" rev-parse HEAD)"
git -C "$backend_work" push origin "$backend_forward_one:refs/heads/prod" >/dev/null

printf 'backend forward two\n' >>"$backend_work/backend.txt"
git -C "$backend_work" commit -am "backend forward two" >/dev/null
backend_forward_two="$(git -C "$backend_work" rev-parse HEAD)"
git -C "$backend_work" push origin "$backend_forward_two:refs/heads/dev" >/dev/null

backend_base_tree="$(git -C "$backend_work" rev-parse "$backend_base^{tree}")"
backend_off_target="$(
  printf 'backend off target\n' |
    git -C "$backend_work" commit-tree "$backend_base_tree" -p "$backend_base"
)"
git -C "$backend_work" push \
  origin "$backend_off_target:refs/heads/feature-only" >/dev/null
backend_local_only="$(
  printf 'backend local only\n' |
    git -C "$backend_work" commit-tree \
      "$(git -C "$backend_work" rev-parse "$backend_forward_two^{tree}")" \
      -p "$backend_forward_two"
)"

git init --bare --initial-branch=main "$root_remote" >/dev/null
git init --initial-branch=main "$root_work" >/dev/null
git_setup_identity "$root_work"
printf 'root base\n' >"$root_work/README.md"
git -C "$root_work" add README.md
git -C "$root_work" update-index \
  --add --cacheinfo "160000,$backend_base,$SUBMODULE_PATH"
git -C "$root_work" commit -m "root base" >/dev/null
root_main="$(git -C "$root_work" rev-parse HEAD)"
git -C "$root_work" remote add origin "$root_remote"
git -C "$root_work" push origin "$root_main:refs/heads/main" >/dev/null

root_dev="$(make_root_commit "$root_main" "$backend_base" "root dev")"
root_prod="$(make_root_commit "$root_dev" "$backend_base" "root prod")"
root_pointer_old="$(
  make_root_commit "$root_main" "$backend_forward_one" "root pointer old"
)"
git -C "$root_work" push origin "$root_dev:refs/heads/dev" >/dev/null
git -C "$root_work" push origin "$root_prod:refs/heads/prod" >/dev/null
git -C "$root_work" push \
  origin "$root_pointer_old:refs/heads/pointer-test" >/dev/null
git -C "$root_work" fetch origin \
  '+refs/heads/*:refs/remotes/origin/*' >/dev/null

mkdir -p "$root_work/likenovel-service-api"
git clone "$backend_remote" "$root_work/$SUBMODULE_PATH" >/dev/null
git -C "$root_work/$SUBMODULE_PATH" fetch origin \
  '+refs/heads/*:refs/remotes/origin/*' >/dev/null
git -C "$root_work/$SUBMODULE_PATH" fetch \
  "$backend_work" "$backend_local_only" >/dev/null

root_main_ff="$(make_root_commit "$root_main" "$backend_base" "root main ff")"
root_dev_ff="$(make_root_commit "$root_dev" "$backend_base" "root dev ff")"
root_prod_ff="$(make_root_commit "$root_prod" "$backend_base" "root prod ff")"
root_multi_main="$(
  make_root_commit "$root_main" "$backend_base" "root multi main"
)"
root_multi_dev="$(
  make_root_merge_commit \
    "$backend_base" "root multi dev" "$root_dev" "$root_multi_main"
)"
root_multi_prod="$(
  make_root_merge_commit \
    "$backend_base" "root multi prod" "$root_prod" "$root_multi_dev"
)"
root_main_non_ff="$(
  printf 'root main non-ff\n' |
    git -C "$root_work" commit-tree \
      "$(git -C "$root_work" rev-parse "$root_main^{tree}")"
)"
root_dev_non_ff="$(
  make_root_commit "$root_main" "$backend_base" "root dev non-ff"
)"
root_prod_non_ff="$(
  make_root_commit "$root_dev" "$backend_base" "root prod non-ff"
)"
root_feature_non_ff="$(
  make_root_commit "$root_main" "$backend_forward_one" "root feature non-ff"
)"
root_dev_forward="$(
  make_root_commit "$root_dev" "$backend_forward_one" "root dev forward"
)"
root_prod_forward="$(
  make_root_commit "$root_prod" "$backend_forward_one" "root prod forward"
)"
root_dev_local_only="$(
  make_root_commit "$root_dev" "$backend_local_only" "root dev local only"
)"
root_dev_off_target="$(
  make_root_commit "$root_dev" "$backend_off_target" "root dev off target"
)"
root_pointer_downgrade="$(
  make_root_commit "$root_pointer_old" "$backend_base" "root pointer downgrade"
)"
root_pointer_missing="$(
  make_root_commit_without_submodule "$root_pointer_old" "root pointer missing"
)"

expect_pass "pre-commit normal" run_pre_commit_at "$root_work"

git -C "$root_work/$SUBMODULE_PATH" switch \
  --detach "$backend_forward_one" >/dev/null
expect_fail \
  "pre-commit blocks submodule HEAD drift" \
  "submodule working tree HEAD does not match the root index gitlink" \
  run_pre_commit_at "$root_work"
git -C "$root_work/$SUBMODULE_PATH" switch --detach "$backend_base" >/dev/null

dirty_test_file="$root_work/$SUBMODULE_PATH/.submodule-hook-dirty-test"
touch "$dirty_test_file"
expect_fail \
  "pre-commit blocks dirty submodule" \
  "submodule has its own dirty worktree" \
  run_pre_commit_at "$root_work"
expect_pass \
  "pre-push ignores unrelated dirty physical submodule" \
  run_pre_push_at "$root_work" \
  "refs/heads/dev $root_dev_ff refs/heads/dev $root_dev"
rm -f -- "$dirty_test_file"

git -C "$root_work" worktree add --detach "$linked_work" "$root_dev_ff" >/dev/null
expect_pass \
  "linked worktree exact-SHA safe fast-forward" \
  run_pre_push_at "$linked_work" \
  "$root_dev_ff $root_dev_ff refs/heads/dev $root_dev"

for state_file in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do
  state_path="$(git -C "$linked_work" rev-parse --git-path "$state_file")"
  printf '%s\n' "$root_dev" >"$state_path"
  expect_fail \
    "linked worktree blocks $state_file" \
    "$state_file exists" \
    run_pre_push_at "$linked_work" \
    "HEAD $root_dev_ff refs/heads/dev $root_dev"
  rm -f -- "$state_path"
done

for protected_branch in main dev prod; do
  expect_fail \
    "protected branch deletion: $protected_branch" \
    "protected branch deletion is forbidden: refs/heads/$protected_branch" \
    run_pre_push_at "$root_work" \
    "(delete) $ZERO_SHA refs/heads/$protected_branch $(git -C "$root_work" rev-parse "origin/$protected_branch")"
done

expect_fail \
  "main non-fast-forward" \
  "non-fast-forward push is forbidden: refs/heads/main" \
  run_pre_push_at "$root_work" \
  "HEAD $root_main_non_ff refs/heads/main $root_main"
expect_fail \
  "dev non-fast-forward" \
  "non-fast-forward push is forbidden: refs/heads/dev" \
  run_pre_push_at "$root_work" \
  "HEAD $root_dev_non_ff refs/heads/dev $root_dev"
expect_fail \
  "prod non-fast-forward" \
  "non-fast-forward push is forbidden: refs/heads/prod" \
  run_pre_push_at "$root_work" \
  "HEAD $root_prod_non_ff refs/heads/prod $root_prod"
expect_pass \
  "feature branch non-fast-forward remains allowed" \
  run_pre_push_at "$root_work" \
  "$root_feature_non_ff $root_feature_non_ff refs/heads/pointer-test $root_pointer_old"

expect_pass \
  "main fast-forward" \
  run_pre_push_at "$root_work" \
  "HEAD $root_main_ff refs/heads/main $root_main"
expect_pass \
  "dev fast-forward" \
  run_pre_push_at "$root_work" \
  "HEAD $root_dev_ff refs/heads/dev $root_dev"
expect_pass \
  "prod fast-forward" \
  run_pre_push_at "$root_work" \
  "HEAD $root_prod_ff refs/heads/prod $root_prod"

expect_fail \
  "pointer change requires intent" \
  "push contains submodule pointer change: $SUBMODULE_PATH" \
  run_pre_push_at "$root_work" \
  "HEAD $root_dev_forward refs/heads/dev $root_dev"
expect_pass \
  "intentional dev pointer forward" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_dev_forward refs/heads/dev $root_dev"
expect_pass \
  "intentional prod pointer forward" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_prod_forward refs/heads/prod $root_prod"
expect_fail \
  "local-only pointer rejected" \
  "is not reachable from backend origin/dev" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_dev_local_only refs/heads/dev $root_dev"
expect_fail \
  "off-target pointer rejected" \
  "is not reachable from backend origin/dev" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_dev_off_target refs/heads/dev $root_dev"
expect_fail \
  "pointer downgrade rejected" \
  "would move backward or diverge" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_pointer_downgrade refs/heads/pointer-test $root_pointer_old"
expect_fail \
  "missing gitlink rejected" \
  "does not contain a valid submodule gitlink" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_pointer_missing refs/heads/pointer-test $root_pointer_old"

expect_fail \
  "multi-ref second blocker fails whole push" \
  "protected branch deletion is forbidden: refs/heads/prod" \
  run_pre_push_at "$root_work" \
  "HEAD $root_dev_ff refs/heads/dev $root_dev
(delete) $ZERO_SHA refs/heads/prod $root_prod"

expect_pass \
  "reverse-order simultaneous main-dev-prod fast-forward" \
  run_pre_push_at "$root_work" \
  "$root_multi_prod $root_multi_prod refs/heads/prod $root_prod
$root_multi_dev $root_multi_dev refs/heads/dev $root_dev
$root_multi_main $root_multi_main refs/heads/main $root_main"

expect_fail \
  "simultaneous prod must contain outgoing dev" \
  "pushed prod does not contain the effective dev commit" \
  run_pre_push_at "$root_work" \
  "$root_prod_ff $root_prod_ff refs/heads/prod $root_prod
$root_multi_dev $root_multi_dev refs/heads/dev $root_dev
$root_multi_main $root_multi_main refs/heads/main $root_main"

echo "git hook tests passed."
