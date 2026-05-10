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
if [[ -t 0 ]]; then
  info "(manual run: no pre-push ref update stream)"
else
  while read -r local_ref local_sha remote_ref remote_sha; do
    [[ -z "${local_ref:-}" ]] && continue

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

    if [[ "$remote_sha" == "$ZERO_SHA" ]]; then
      changed_files="$(git diff-tree --no-commit-id --name-only -r "$local_sha")"
    else
      changed_files="$(git diff --name-only "$remote_sha" "$local_sha")"
    fi

    if printf '%s\n' "$changed_files" | grep -Fxq "$SUBMODULE_PATH"; then
      if [[ "${ALLOW_SUBMODULE_POINTER_PUSH:-}" == "1" ]]; then
        info "ALLOW_SUBMODULE_POINTER_PUSH=1 set; pushed submodule pointer is intentional."
        if [[ "$remote_sha" != "$ZERO_SHA" ]]; then
          git diff --submodule=log "$remote_sha" "$local_sha" -- "$SUBMODULE_PATH" >&2 || true
        fi
      else
        fail "push contains submodule pointer change: $SUBMODULE_PATH"
      fi
    fi
  done
fi
info ""

if (( failures > 0 )); then
  info "pre-push safety check failed with $failures blocker(s)."
  info "If a blocker is intentional, state the reason and use the explicit ALLOW_* env var only for that command."
  exit 1
fi

info "pre-push safety check passed."
