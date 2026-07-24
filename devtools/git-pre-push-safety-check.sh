#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"
ZERO_SHA="0000000000000000000000000000000000000000"

failures=0
backend_refs_ready=0
gitlink_oid_result=""
push_diff_base_result=""

info() {
  printf '%s\n' "$*" >&2
}

fail() {
  failures=$((failures + 1))
  printf 'ERROR: %s\n' "$*" >&2
}

backend_git() {
  env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE \
    git -C "$SUBMODULE_PATH" "$@"
}

is_protected_branch_ref() {
  case "$1" in
    refs/heads/main | refs/heads/dev | refs/heads/prod)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

read_gitlink() {
  local git_ref label tree_row mode object_type object_sha
  git_ref="$1"
  label="$2"
  gitlink_oid_result=""

  tree_row="$(git ls-tree "$git_ref" -- "$SUBMODULE_PATH" 2>/dev/null || true)"
  if [[ -z "$tree_row" ]]; then
    fail "$label does not contain a valid submodule gitlink: $SUBMODULE_PATH"
    return 1
  fi

  read -r mode object_type object_sha _ <<<"$tree_row"
  if [[ "$mode" != "160000" || "$object_type" != "commit" || -z "$object_sha" ]]; then
    fail "$label does not contain a valid submodule gitlink: $SUBMODULE_PATH"
    return 1
  fi

  gitlink_oid_result="$object_sha"
  return 0
}

resolve_push_diff_base() {
  local local_ref local_sha remote_ref remote_sha base_ref base_sha
  local_ref="$1"
  local_sha="$2"
  remote_ref="$3"
  remote_sha="$4"
  push_diff_base_result=""

  if [[ "$remote_sha" != "$ZERO_SHA" ]]; then
    push_diff_base_result="$remote_sha"
    return 0
  fi

  case "$remote_ref" in
    refs/heads/main)
      base_ref="origin/main"
      ;;
    refs/heads/dev)
      base_ref="origin/main"
      ;;
    refs/heads/prod)
      base_ref="origin/dev"
      ;;
    *)
      base_ref="origin/main"
      ;;
  esac

  if ! git rev-parse --verify --quiet "$base_ref^{commit}" >/dev/null; then
    return 1
  fi

  base_sha="$(git merge-base "$base_ref" "$local_sha" || true)"
  if [[ -z "$base_sha" ]]; then
    return 1
  fi

  info "new branch diff base: $base_ref $base_sha"
  push_diff_base_result="$base_sha"
  return 0
}

ensure_backend_remote_refs() {
  if (( backend_refs_ready == 1 )); then
    return 0
  fi

  if ! backend_git rev-parse --git-dir >/dev/null 2>&1; then
    fail "backend repository is not initialized; cannot verify pushed gitlink: $SUBMODULE_PATH"
    return 1
  fi

  if ! backend_git fetch origin --quiet; then
    fail "failed to fetch backend origin; cannot verify pushed gitlink."
    return 1
  fi

  backend_refs_ready=1
  return 0
}

verify_changed_gitlink() {
  local old_pointer new_pointer remote_ref target_branch containing_ref
  old_pointer="$1"
  new_pointer="$2"
  remote_ref="$3"

  if ! ensure_backend_remote_refs; then
    return
  fi

  if ! backend_git cat-file -e "$new_pointer^{commit}" 2>/dev/null; then
    fail "pushed submodule pointer is not present in the backend repository: $new_pointer"
    return
  fi

  case "$remote_ref" in
    refs/heads/main)
      target_branch="main"
      ;;
    refs/heads/dev)
      target_branch="dev"
      ;;
    refs/heads/prod)
      target_branch="prod"
      ;;
    *)
      target_branch=""
      ;;
  esac

  if [[ -n "$target_branch" ]]; then
    if ! backend_git rev-parse \
      --verify --quiet "origin/$target_branch^{commit}" >/dev/null; then
      fail "missing backend origin/$target_branch; cannot verify pushed gitlink."
    elif ! backend_git merge-base \
      --is-ancestor "$new_pointer" "origin/$target_branch"; then
      fail "$new_pointer is not reachable from backend origin/$target_branch"
    fi
  else
    containing_ref="$(
      backend_git for-each-ref \
        --format='%(refname)' \
        --contains "$new_pointer" \
        refs/remotes/origin |
        head -n 1
    )"
    if [[ -z "$containing_ref" ]]; then
      fail "$new_pointer is not reachable from any backend origin branch"
    fi
  fi

  if ! backend_git cat-file -e "$old_pointer^{commit}" 2>/dev/null; then
    fail "previous submodule pointer is not present in the backend repository: $old_pointer"
  elif ! backend_git merge-base \
    --is-ancestor "$old_pointer" "$new_pointer"; then
    fail "submodule pointer would move backward or diverge: $old_pointer -> $new_pointer"
  fi
}

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

branch="$(git branch --show-current || true)"
head_sha="$(git rev-parse --short HEAD)"

info "=== LikeNovel pre-push safety check ==="
info "repo: $repo_root"
info "branch: ${branch:-DETACHED}"
info "HEAD: $head_sha"
info ""

for state_file in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do
  state_path="$(git rev-parse --git-path "$state_file")"
  if [[ -e "$state_path" ]]; then
    fail "$state_file exists. Finish or abort the in-progress git operation before push."
  fi
done

declare -a local_refs=()
declare -a local_shas=()
declare -a remote_refs=()
declare -a remote_shas=()

while read -r local_ref local_sha remote_ref remote_sha extra; do
  if [[ -z "${local_ref:-}" ]]; then
    continue
  fi
  if [[ -z "${local_sha:-}" || -z "${remote_ref:-}" ||
        -z "${remote_sha:-}" || -n "${extra:-}" ]]; then
    fail "malformed pre-push ref update input."
    continue
  fi

  local_refs+=("$local_ref")
  local_shas+=("$local_sha")
  remote_refs+=("$remote_ref")
  remote_shas+=("$remote_sha")
done

if (( ${#local_refs[@]} == 0 )); then
  info "(no pre-push ref updates on stdin)"
else
  if ! git fetch origin --quiet; then
    fail "failed to fetch root origin before push validation."
  fi

  effective_main="$(git rev-parse --verify 'origin/main^{commit}' 2>/dev/null || true)"
  effective_dev="$(git rev-parse --verify 'origin/dev^{commit}' 2>/dev/null || true)"

  for index in "${!local_refs[@]}"; do
    if [[ "${local_shas[$index]}" == "$ZERO_SHA" ]]; then
      continue
    fi
    case "${remote_refs[$index]}" in
      refs/heads/main)
        effective_main="${local_shas[$index]}"
        ;;
      refs/heads/dev)
        effective_dev="${local_shas[$index]}"
        ;;
    esac
  done

  info "--- pushed ref checks ---"
  for index in "${!local_refs[@]}"; do
    local_ref="${local_refs[$index]}"
    local_sha="${local_shas[$index]}"
    remote_ref="${remote_refs[$index]}"
    remote_sha="${remote_shas[$index]}"

    info "$local_ref $local_sha -> $remote_ref $remote_sha"

    if [[ "$local_sha" == "$ZERO_SHA" ]]; then
      if is_protected_branch_ref "$remote_ref"; then
        fail "protected branch deletion is forbidden: $remote_ref"
      else
        info "delete push detected for non-protected ref; no commit diff to inspect."
      fi
      continue
    fi

    if ! git cat-file -e "$local_sha^{commit}" 2>/dev/null; then
      fail "outgoing object is not a readable commit: $local_sha"
      continue
    fi

    if is_protected_branch_ref "$remote_ref" &&
      [[ "$remote_sha" != "$ZERO_SHA" ]]; then
      if ! git cat-file -e "$remote_sha^{commit}" 2>/dev/null; then
        fail "remote branch tip is not a readable commit: $remote_sha"
      elif ! git merge-base --is-ancestor "$remote_sha" "$local_sha"; then
        fail "non-fast-forward push is forbidden: $remote_ref"
      fi
    fi

    case "$remote_ref" in
      refs/heads/dev)
        if [[ -z "$effective_main" ]] ||
          ! git merge-base --is-ancestor "$effective_main" "$local_sha"; then
          fail "pushed dev does not contain the effective main commit."
        else
          info "pushed dev contains effective main: OK"
        fi
        ;;
      refs/heads/prod)
        if [[ -z "$effective_dev" ]] ||
          ! git merge-base --is-ancestor "$effective_dev" "$local_sha"; then
          fail "pushed prod does not contain the effective dev commit."
        else
          info "pushed prod contains effective dev: OK"
        fi
        ;;
    esac

    if ! read_gitlink "$local_sha" "outgoing commit $local_sha"; then
      continue
    fi
    new_pointer="$gitlink_oid_result"

    if ! resolve_push_diff_base \
      "$local_ref" "$local_sha" "$remote_ref" "$remote_sha"; then
      fail "cannot determine pushed range diff base for $local_ref -> $remote_ref"
      continue
    fi
    pointer_base="$push_diff_base_result"

    if ! read_gitlink "$pointer_base" "push base $pointer_base"; then
      continue
    fi
    old_pointer="$gitlink_oid_result"

    if [[ "$old_pointer" == "$new_pointer" ]]; then
      continue
    fi

    if [[ "${ALLOW_SUBMODULE_POINTER_PUSH:-}" == "1" ]]; then
      info "ALLOW_SUBMODULE_POINTER_PUSH=1 set; pushed submodule pointer is intentional."
      git diff --submodule=log \
        "$pointer_base" "$local_sha" -- "$SUBMODULE_PATH" >&2 || true
    else
      fail "push contains submodule pointer change: $SUBMODULE_PATH"
    fi

    verify_changed_gitlink "$old_pointer" "$new_pointer" "$remote_ref"
  done
fi
info ""

if (( failures > 0 )); then
  info "pre-push safety check failed with $failures blocker(s)."
  info "If a pointer change is intentional, use ALLOW_SUBMODULE_POINTER_PUSH=1 only for that command."
  exit 1
fi

info "pre-push safety check passed."
