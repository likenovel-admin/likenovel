#!/usr/bin/env bash

set -euo pipefail

SUBMODULE_PATH="likenovel-service-api/likenovel-service-api"
ZERO_SHA="0000000000000000000000000000000000000000"

failures=0

info() {
  printf '%s\n' "$*" >&2
}

fail() {
  failures=$((failures + 1))
  printf 'ERROR: %s\n' "$*" >&2
}

warn() {
  printf 'WARN: %s\n' "$*" >&2
}

submodule_git() {
  env -u GIT_DIR -u GIT_WORK_TREE -u GIT_INDEX_FILE git -C "$SUBMODULE_PATH" "$@"
}

check_submodule_worktree_alignment() {
  info "--- submodule worktree readback ---"

  local git_ref label tree_row expected_sha actual_sha submodule_status
  git_ref="$1"
  label="$2"
  tree_row="$(git ls-tree "$git_ref" -- "$SUBMODULE_PATH" 2>/dev/null || true)"
  if [[ -z "$tree_row" ]]; then
    fail "submodule path is not tracked in $label: $SUBMODULE_PATH"
    info ""
    return
  fi

  expected_sha="$(printf '%s\n' "$tree_row" | awk '{print $3}')"
  actual_sha="$(submodule_git rev-parse HEAD 2>/dev/null || true)"
  if [[ -z "$actual_sha" ]]; then
    fail "submodule is not initialized or has no readable HEAD: $SUBMODULE_PATH"
    info "Run: git submodule update --init --checkout $SUBMODULE_PATH"
    info ""
    return
  fi

  info "$label expects: $expected_sha"
  info "submodule HEAD:  $actual_sha"

  if [[ "$actual_sha" != "$expected_sha" ]]; then
    fail "submodule working tree HEAD does not match $label gitlink: $SUBMODULE_PATH"
    info "Run: git submodule update --init --checkout $SUBMODULE_PATH"
  fi

  submodule_status="$(submodule_git status --porcelain)"
  if [[ -n "$submodule_status" ]]; then
    fail "submodule has its own dirty worktree: $SUBMODULE_PATH"
    printf '%s\n' "$submodule_status" >&2
    info "Commit or stash backend changes in the submodule before pushing from the root repo."
  fi

  info ""
}

push_diff_base_result=""

resolve_push_diff_base() {
  local local_ref local_sha remote_ref remote_sha base_ref base_sha local_branch upstream
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
    refs/heads/dev)
      base_ref="origin/main"
      ;;
    refs/heads/prod)
      base_ref="origin/dev"
      ;;
    *)
      base_ref=""
      if [[ "$local_ref" == refs/heads/* ]]; then
        local_branch="${local_ref#refs/heads/}"
        upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "$local_branch@{upstream}" 2>/dev/null || true)"
        if [[ -n "$upstream" ]]; then
          base_ref="$upstream"
        fi
      elif [[ "$local_ref" == "HEAD" && -n "${branch:-}" ]]; then
        upstream="$(git rev-parse --abbrev-ref --symbolic-full-name "$branch@{upstream}" 2>/dev/null || true)"
        if [[ -n "$upstream" ]]; then
          base_ref="$upstream"
        fi
      fi
      if [[ -z "$base_ref" ]]; then
        base_ref="origin/main"
      fi
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

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

branch="$(git branch --show-current || true)"
head_sha="$(git rev-parse --short HEAD)"

info "=== LikeNovel pre-push safety check ==="
info "repo: $repo_root"
info "branch: ${branch:-DETACHED}"
info "HEAD: $head_sha"
info ""

if [[ -f .git ]]; then
  fail "linked git worktree detected. Do not push from git worktree in this repo."
fi

for state_file in CHERRY_PICK_HEAD REBASE_HEAD MERGE_HEAD; do
  if [[ -e ".git/$state_file" ]]; then
    fail "$state_file exists. Finish or abort the in-progress git operation before push."
  fi
done

info "--- status --short --branch ---"
git status --short --branch >&2
info ""

info "--- staged files ---"
staged_files="$(git diff --cached --name-status)"
if [[ -n "$staged_files" ]]; then
  printf '%s\n' "$staged_files" >&2
else
  info "(none)"
fi
info ""

if git diff --cached --name-only -- "$SUBMODULE_PATH" | grep -q .; then
  if [[ "${ALLOW_SUBMODULE_POINTER_COMMIT:-}" == "1" ]]; then
    info "ALLOW_SUBMODULE_POINTER_COMMIT=1 set; staged submodule pointer is intentional."
    git diff --cached --submodule=log -- "$SUBMODULE_PATH" >&2 || true
  else
    fail "submodule pointer is staged: $SUBMODULE_PATH"
  fi
fi

info "--- remote ancestry readback ---"
git fetch origin --quiet

if git show-ref --verify --quiet refs/remotes/origin/main &&
   git show-ref --verify --quiet refs/remotes/origin/dev &&
   git show-ref --verify --quiet refs/remotes/origin/prod; then
  if git merge-base --is-ancestor origin/main origin/dev; then
    info "origin/main -> origin/dev: OK"
  else
    warn "origin/main is not ancestor of origin/dev. Expected only before pushing a dev merge."
  fi

  if git merge-base --is-ancestor origin/dev origin/prod; then
    info "origin/dev -> origin/prod: OK"
  else
    warn "origin/dev is not ancestor of origin/prod. Expected only before pushing a prod merge."
  fi
else
  fail "missing origin/main, origin/dev, or origin/prod ref."
fi
info ""

if [[ "$branch" == "dev" ]]; then
  if git merge-base --is-ancestor origin/main HEAD; then
    info "local dev contains origin/main: OK"
  else
    fail "local dev does not contain origin/main. Merge main into dev before push."
  fi
elif [[ "$branch" == "prod" ]]; then
  if git merge-base --is-ancestor origin/dev HEAD; then
    info "local prod contains origin/dev: OK"
  else
    fail "local prod does not contain origin/dev. Merge dev into prod before push."
  fi
fi

info "--- pushed ref checks ---"
processed_ref_updates=0
if [[ -t 0 ]]; then
  info "(manual run: no pre-push ref update stream)"
  check_submodule_worktree_alignment HEAD "HEAD"
else
  while read -r local_ref local_sha remote_ref remote_sha; do
    [[ -z "${local_ref:-}" ]] && continue
    processed_ref_updates=$((processed_ref_updates + 1))

    info "$local_ref $local_sha -> $remote_ref $remote_sha"
    if [[ "$local_sha" == "$ZERO_SHA" ]]; then
      info "delete push detected; no commit diff to inspect."
      continue
    fi

    case "$remote_ref" in
      refs/heads/dev)
        if git merge-base --is-ancestor origin/main "$local_sha"; then
          info "pushed dev contains origin/main: OK"
        else
          fail "pushed dev does not contain origin/main. Merge main into dev before push."
        fi
        ;;
      refs/heads/prod)
        if git merge-base --is-ancestor origin/dev "$local_sha"; then
          info "pushed prod contains origin/dev: OK"
        else
          fail "pushed prod does not contain origin/dev. Merge dev into prod before push."
        fi
        ;;
    esac

    check_submodule_worktree_alignment "$local_sha" "$local_ref"

    if resolve_push_diff_base "$local_ref" "$local_sha" "$remote_ref" "$remote_sha"; then
      changed_files="$(git diff --name-only "$push_diff_base_result" "$local_sha")"
    else
      changed_files=""
      fail "cannot determine pushed range diff base for $local_ref -> $remote_ref"
    fi

    if printf '%s\n' "$changed_files" | grep -Fxq "$SUBMODULE_PATH"; then
      if [[ "${ALLOW_SUBMODULE_POINTER_PUSH:-}" == "1" ]]; then
        info "ALLOW_SUBMODULE_POINTER_PUSH=1 set; pushed submodule pointer is intentional."
        git diff --submodule=log "$push_diff_base_result" "$local_sha" -- "$SUBMODULE_PATH" >&2 || true
      else
        fail "push contains submodule pointer change: $SUBMODULE_PATH"
      fi
    fi
  done

  if (( processed_ref_updates == 0 )); then
    info "(no pre-push ref updates on stdin; checking HEAD)"
    check_submodule_worktree_alignment HEAD "HEAD"
  fi
fi
info ""

if (( failures > 0 )); then
  info "pre-push safety check failed with $failures blocker(s)."
  info "If a blocker is intentional, state the reason and use the explicit ALLOW_* env var only for that command."
  exit 1
fi

info "pre-push safety check passed."
