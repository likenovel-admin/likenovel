#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"
ZERO_SHA="0000000000000000000000000000000000000000"

repo_root="$(git rev-parse --show-toplevel)"
pre_commit_under_test="$repo_root/devtools/git-pre-commit-safety-check.sh"
pre_push_under_test="$repo_root/devtools/git-pre-push-safety-check.sh"
installer_under_test="$repo_root/devtools/install-git-hooks.sh"
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

expect_pass_with_output() {
  local label expected output status
  label="$1"
  expected="$2"
  shift 2

  set +e
  output="$("$@" 2>&1)"
  status=$?
  set -e

  if (( status != 0 )); then
    printf '%s\n' "$output"
    echo "ERROR: expected pass failed: $label" >&2
    exit 1
  fi
  if ! grep -Fq -- "$expected" <<<"$output"; then
    printf '%s\n' "$output"
    echo "ERROR: expected output was not reported for $label: $expected" >&2
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
  local worktree updates remote_name remote_url git_dir index_file
  worktree="$1"
  updates="$2"
  remote_name="${3:-origin}"
  remote_url="${4:-$root_remote}"
  git_dir="$(git -C "$worktree" rev-parse --absolute-git-dir)"
  index_file="$(git -C "$worktree" rev-parse --git-path index)"
  (
    cd "$worktree"
    printf '%s\n' "$updates" |
      env \
        GIT_DIR="$git_dir" \
        GIT_WORK_TREE="$worktree" \
        GIT_INDEX_FILE="$index_file" \
        bash "$pre_push_under_test" "$remote_name" "$remote_url"
  )
}

run_pre_push_with_pointer_allow_at() {
  local worktree updates remote_name remote_url git_dir index_file
  worktree="$1"
  updates="$2"
  remote_name="${3:-origin}"
  remote_url="${4:-$root_remote}"
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
        bash "$pre_push_under_test" "$remote_name" "$remote_url"
  )
}

run_installer_at() {
  (
    cd "$1"
    bash "$installer_under_test"
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
root_feature_off_target="$(
  make_root_commit "$root_main" "$backend_off_target" "root feature off target"
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
expect_pass \
  "non-protected branch deletion remains allowed" \
  run_pre_push_at "$root_work" \
  "(delete) $ZERO_SHA refs/heads/pointer-test $root_pointer_old"

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
expect_fail \
  "protected branch push rejects non-origin remote" \
  "protected branch push must target remote 'origin'" \
  run_pre_push_at "$root_work" \
  "HEAD $root_dev_ff refs/heads/dev $root_dev" \
  backup "$root_remote"
expect_pass \
  "new feature ref remains allowed on alternate remote" \
  run_pre_push_at "$root_work" \
  "HEAD $root_main_ff refs/heads/new-feature $ZERO_SHA" \
  backup "$root_remote"

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
expect_pass_with_output \
  "simultaneous dev warns when it lacks outgoing main" \
  "WARNING: pushed dev does not contain the effective main commit; push is allowed for solo-operated hotfix flow." \
  run_pre_push_at "$root_work" \
  "$root_dev_ff $root_dev_ff refs/heads/dev $root_dev
$root_main_ff $root_main_ff refs/heads/main $root_main"

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
expect_pass \
  "intentional new feature pointer is reachable before prune" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_feature_off_target refs/heads/new-pointer $ZERO_SHA"
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

expect_pass_with_output \
  "simultaneous prod warns when it lacks outgoing dev" \
  "WARNING: pushed prod does not contain the effective dev commit; push is allowed for solo-operated hotfix flow." \
  run_pre_push_at "$root_work" \
  "$root_prod_ff $root_prod_ff refs/heads/prod $root_prod
$root_multi_dev $root_multi_dev refs/heads/dev $root_dev
$root_multi_main $root_multi_main refs/heads/main $root_main"

git --git-dir="$backend_remote" update-ref -d refs/heads/feature-only
git -C "$root_work/$SUBMODULE_PATH" show-ref \
  --verify --quiet refs/remotes/origin/feature-only
expect_fail \
  "stale backend feature ref is pruned" \
  "is not reachable from any backend origin branch" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_feature_off_target refs/heads/new-pointer $ZERO_SHA"
if git -C "$root_work/$SUBMODULE_PATH" show-ref \
  --verify --quiet refs/remotes/origin/feature-only; then
  echo "ERROR: stale backend feature ref was not pruned" >&2
  exit 1
fi

git --git-dir="$root_remote" update-ref -d refs/heads/dev
git -C "$root_work" show-ref --verify --quiet refs/remotes/origin/dev
expect_pass_with_output \
  "stale root dev ref is pruned before prod ancestry warning" \
  "WARNING: pushed prod does not contain the effective dev commit; push is allowed for solo-operated hotfix flow." \
  run_pre_push_at "$root_work" \
  "HEAD $root_prod_ff refs/heads/prod $root_prod"
if git -C "$root_work" show-ref --verify --quiet refs/remotes/origin/dev; then
  echo "ERROR: stale root dev ref was not pruned" >&2
  exit 1
fi
git --git-dir="$root_remote" update-ref refs/heads/dev "$root_dev"
git -C "$root_work" fetch origin \
  '+refs/heads/dev:refs/remotes/origin/dev' >/dev/null

git --git-dir="$backend_remote" update-ref -d refs/heads/dev
git -C "$root_work/$SUBMODULE_PATH" show-ref \
  --verify --quiet refs/remotes/origin/dev
expect_fail \
  "stale protected backend ref is pruned" \
  "missing backend origin/dev" \
  run_pre_push_with_pointer_allow_at "$root_work" \
  "HEAD $root_dev_forward refs/heads/dev $root_dev"
if git -C "$root_work/$SUBMODULE_PATH" show-ref \
  --verify --quiet refs/remotes/origin/dev; then
  echo "ERROR: stale backend dev ref was not pruned" >&2
  exit 1
fi

installer_remote="$fixture_root/installer-origin.git"
installer_primary="$fixture_root/installer-primary"
installer_linked="$fixture_root/installer-linked"
installer_backend="$fixture_root/installer-backend"

git init --bare --initial-branch=main "$installer_remote" >/dev/null
git init --initial-branch=main "$installer_backend" >/dev/null
git_setup_identity "$installer_backend"
touch "$installer_backend/backend.txt"
git -C "$installer_backend" add backend.txt
git -C "$installer_backend" commit -m "installer backend base" >/dev/null
installer_backend_sha="$(git -C "$installer_backend" rev-parse HEAD)"

git init --initial-branch=main "$installer_primary" >/dev/null
git_setup_identity "$installer_primary"
mkdir -p \
  "$installer_primary/devtools" \
  "$installer_primary/likenovel-service-api"
printf 'installer fixture\n' >"$installer_primary/README.md"
cp "$pre_commit_under_test" \
  "$installer_primary/devtools/git-pre-commit-safety-check.sh"
cp "$installer_under_test" \
  "$installer_primary/devtools/install-git-hooks.sh"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'echo "ERROR: primary loaded checkout-relative old pre-push" >&2' \
  'exit 86' \
  >"$installer_primary/devtools/git-pre-push-safety-check.sh"
chmod +x "$installer_primary/devtools/"*.sh
git -C "$installer_primary" add \
  README.md \
  devtools/git-pre-commit-safety-check.sh \
  devtools/git-pre-push-safety-check.sh \
  devtools/install-git-hooks.sh
git -C "$installer_primary" update-index \
  --add --cacheinfo \
  "160000,$installer_backend_sha,$SUBMODULE_PATH"
git -C "$installer_primary" commit -m "installer legacy primary" >/dev/null
installer_legacy_sha="$(git -C "$installer_primary" rev-parse HEAD)"
git -C "$installer_primary" remote add origin "$installer_remote"
git -C "$installer_primary" push \
  origin "$installer_legacy_sha:refs/heads/main" >/dev/null

cp "$pre_push_under_test" \
  "$installer_primary/devtools/git-pre-push-safety-check.sh"
git -C "$installer_primary" add \
  devtools/git-pre-push-safety-check.sh
git -C "$installer_primary" commit -m "installer self-contained pre-push" >/dev/null
installer_new_sha="$(git -C "$installer_primary" rev-parse HEAD)"
git -C "$installer_primary" worktree add \
  --detach "$installer_linked" "$installer_new_sha" >/dev/null
git -C "$installer_primary" switch --detach "$installer_legacy_sha" >/dev/null

installer_hooks_dir="$(
  git -C "$installer_linked" rev-parse --path-format=absolute --git-path hooks
)"
primary_hooks_dir="$(
  git -C "$installer_primary" rev-parse --path-format=absolute --git-path hooks
)"
if [[ "$installer_hooks_dir" != "$primary_hooks_dir" ]]; then
  echo "ERROR: linked and primary worktrees resolved different hooks dirs" >&2
  exit 1
fi
legacy_pre_push="$fixture_root/legacy-pre-push"
printf '%s\n' \
  '#!/usr/bin/env bash' \
  'exec bash devtools/git-pre-push-safety-check.sh "$@"' \
  >"$legacy_pre_push"
cp "$legacy_pre_push" "$installer_hooks_dir/pre-push"
chmod +x "$installer_hooks_dir/pre-push"

expect_pass \
  "installer migrates legacy hook from linked worktree" \
  run_installer_at "$installer_linked"
test -x "$installer_hooks_dir/pre-push"
grep -Fqx \
  "# LikeNovel managed pre-push hook" \
  "$installer_hooks_dir/pre-push"
grep -Fq \
  "# source-sha256:" \
  "$installer_hooks_dir/pre-push"
cmp -s \
  "$legacy_pre_push" \
  "$installer_hooks_dir/pre-push.likenovel-backup"
grep -Fq \
  'exec bash devtools/git-pre-commit-safety-check.sh "$@"' \
  "$installer_hooks_dir/pre-commit"
backup_checksum_before="$(
  sha256sum "$installer_hooks_dir/pre-push.likenovel-backup"
)"
expect_pass \
  "installer is idempotent" \
  run_installer_at "$installer_linked"
backup_checksum_after="$(
  sha256sum "$installer_hooks_dir/pre-push.likenovel-backup"
)"
if [[ "$backup_checksum_before" != "$backup_checksum_after" ]]; then
  echo "ERROR: idempotent install rewrote the rollback backup" >&2
  exit 1
fi

installer_outgoing="$(
  printf 'installer primary dry-run\n' |
    git -C "$installer_primary" commit-tree \
      "$installer_legacy_sha^{tree}" \
      -p "$installer_legacy_sha"
)"
expect_pass \
  "actual primary dry-run uses shared self-contained hook" \
  git -C "$installer_primary" push --dry-run \
  origin "$installer_outgoing:refs/heads/main"

printf '%s\n' \
  '#!/usr/bin/env bash' \
  'echo custom hook' \
  >"$installer_hooks_dir/pre-push"
chmod +x "$installer_hooks_dir/pre-push"
expect_fail \
  "installer preserves unknown custom hook" \
  "existing hook differs" \
  run_installer_at "$installer_linked"
grep -Fqx 'echo custom hook' "$installer_hooks_dir/pre-push"

printf '%s\n' \
  '#!/usr/bin/env bash' \
  '# LikeNovel managed pre-push hook' \
  'echo marker-shaped custom hook' \
  >"$installer_hooks_dir/pre-push"
chmod +x "$installer_hooks_dir/pre-push"
expect_fail \
  "installer rejects marker-only custom hook" \
  "existing hook differs" \
  run_installer_at "$installer_linked"
grep -Fqx \
  'echo marker-shaped custom hook' \
  "$installer_hooks_dir/pre-push"

echo "git hook tests passed."
