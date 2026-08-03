#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

configured_hooks_path="$(git config --get core.hooksPath || true)"
if [[ -n "$configured_hooks_path" && "$configured_hooks_path" != /* ]]; then
  echo "ERROR: relative core.hooksPath is unsupported: $configured_hooks_path" >&2
  echo "Use an absolute path so every linked worktree shares one dispatcher." >&2
  exit 1
fi

common_git_dir="$(git rev-parse --path-format=absolute --git-common-dir)"
hooks_dir="$(readlink -m -- "$common_git_dir/hooks")"
active_hooks_dir="$(readlink -m -- "$(
  git rev-parse --path-format=absolute --git-path hooks
)")"
mkdir -p "$hooks_dir"

write_wrapper() {
  local target_script output_path
  target_script="$1"
  output_path="$2"

  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf 'exec bash %s "$@"\n' "$target_script"
  } >"$output_path"
}

install_wrapper_hook() {
  local hook_name target_script hook_path tmp
  hook_name="$1"
  target_script="$2"
  hook_path="$hooks_dir/$hook_name"
  tmp="$(mktemp "$hooks_dir/.${hook_name}.XXXXXX")"
  write_wrapper "$target_script" "$tmp"

  if [[ -e "$hook_path" ]] && ! cmp -s "$hook_path" "$tmp"; then
    rm -f "$tmp"
    echo "ERROR: existing hook differs: $hook_path" >&2
    echo "Review or back it up before installing the LikeNovel hook." >&2
    exit 1
  fi

  mv "$tmp" "$hook_path"
  chmod +x "$hook_path"
}

backup_known_hook() {
  local hook_path hook_dir backup_path backup_tmp
  hook_path="$1"
  hook_dir="$(dirname "$hook_path")"
  backup_path="$hook_path.likenovel-backup"

  if [[ -e "$backup_path" ]]; then
    return 0
  fi

  backup_tmp="$(mktemp "$hook_dir/.pre-push-backup.XXXXXX")"
  cp -p "$hook_path" "$backup_tmp"
  mv "$backup_tmp" "$backup_path"
  printf 'Backed up previous LikeNovel pre-push hook: %s\n' "$backup_path"
}

write_pre_push_dispatcher() {
  local output_path
  output_path="$1"

  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf '%s\n' '# LikeNovel managed pre-push dispatcher'
    printf '%s\n' '# managed-by: devtools/install-git-hooks.sh'
    printf '%s\n' '# dispatcher-version: 1'
    printf '%s\n' 'set -euo pipefail'
    printf '%s\n' ''
    printf '%s\n' 'fail() {'
    printf '%s\n' "  printf 'ERROR: %s\\n' \"\$*\" >&2"
    printf '%s\n' '  exit 1'
    printf '%s\n' '}'
    printf '%s\n' ''
    printf '%s\n' 'if ! common_git_dir="$(git rev-parse --path-format=absolute --git-common-dir)"; then'
    printf '%s\n' '  fail "could not resolve the common Git directory"'
    printf '%s\n' 'fi'
    printf '%s\n' 'managed_hook="$common_git_dir/hooks/pre-push"'
    printf '%s\n' ''
    printf '%s\n' 'if [[ ! -f "$managed_hook" || ! -x "$managed_hook" || -L "$managed_hook" ]]; then'
    printf '%s\n' '  fail "managed common pre-push hook is missing or not executable: $managed_hook"'
    printf '%s\n' 'fi'
    printf '%s\n' ''
    printf '%s\n' 'dispatcher_path="$(readlink -f -- "$0")"'
    printf '%s\n' 'managed_hook_path="$(readlink -f -- "$managed_hook")"'
    printf '%s\n' 'if [[ -z "$dispatcher_path" || -z "$managed_hook_path" || "$dispatcher_path" == "$managed_hook_path" ]]; then'
    printf '%s\n' '  fail "managed pre-push dispatcher recursion detected"'
    printf '%s\n' 'fi'
    printf '%s\n' ''
    printf '%s\n' 'source_blob="$(sed -n '\''4s/^# source-blob: //p'\'' "$managed_hook")"'
    printf '%s\n' 'source_sha="$(sed -n '\''5s/^# source-sha256: //p'\'' "$managed_hook")"'
    printf '%s\n' 'if [[ "$(sed -n '\''1p'\'' "$managed_hook")" != "#!/usr/bin/env bash" ||'
    printf '%s\n' '  "$(sed -n '\''2p'\'' "$managed_hook")" != "# LikeNovel managed pre-push hook" ||'
    printf '%s\n' '  "$(sed -n '\''3p'\'' "$managed_hook")" != "# source: devtools/git-pre-push-safety-check.sh" ||'
    printf '%s\n' '  ! "$source_blob" =~ ^[0-9a-f]{40}$ || ! "$source_sha" =~ ^[0-9a-f]{64}$ ]]; then'
    printf '%s\n' '  fail "managed common pre-push hook integrity check failed: $managed_hook"'
    printf '%s\n' 'fi'
    printf '%s\n' ''
    printf '%s\n' 'actual_sha="$('
    printf '%s\n' '  { sed -n '\''1p'\'' "$managed_hook"; tail -n +6 "$managed_hook"; } |'
    printf '%s\n' "    sha256sum | awk '{print \$1}'"
    printf '%s\n' ')"'
    printf '%s\n' 'actual_blob="$('
    printf '%s\n' '  { sed -n '\''1p'\'' "$managed_hook"; tail -n +6 "$managed_hook"; } |'
    printf '%s\n' '    git hash-object --stdin'
    printf '%s\n' ')"'
    printf '%s\n' 'if [[ "$actual_sha" != "$source_sha" || "$actual_blob" != "$source_blob" ]]; then'
    printf '%s\n' '  fail "managed common pre-push hook integrity check failed: $managed_hook"'
    printf '%s\n' 'fi'
    printf '%s\n' ''
    printf '%s\n' 'exec "$managed_hook" "$@"'
  } >"$output_path"
}

write_legacy_active_pre_push() {
  local output_path
  output_path="$1"

  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf '%s\n' ''
    printf '%s\n' 'set -euo pipefail'
    printf '%s\n' ''
    printf '%s\n' 'repo_root="$(git rev-parse --show-toplevel)"'
    printf '%s\n' 'exec bash "$repo_root/devtools/git-pre-push-safety-check.sh" "$@"'
  } >"$output_path"
}

is_managed_dispatcher() {
  local hook_path
  hook_path="$1"

  [[ "$(sed -n '1p' "$hook_path")" == "#!/usr/bin/env bash" ]] &&
    [[ "$(sed -n '2p' "$hook_path")" == \
      "# LikeNovel managed pre-push dispatcher" ]] &&
    [[ "$(sed -n '3p' "$hook_path")" == \
      "# managed-by: devtools/install-git-hooks.sh" ]] &&
    [[ "$(sed -n '4p' "$hook_path")" =~ \
      ^#\ dispatcher-version:\ [0-9]+$ ]]
}

preflight_active_pre_push_dispatcher() {
  local hook_path tmp legacy_tmp

  if [[ "$active_hooks_dir" == "$hooks_dir" ]]; then
    return 0
  fi

  hook_path="$active_hooks_dir/pre-push"
  if [[ ! -e "$hook_path" && ! -L "$hook_path" ]]; then
    return 0
  fi

  tmp="$(mktemp "${TMPDIR:-/tmp}/likenovel-pre-push-dispatcher.XXXXXX")"
  legacy_tmp="$(mktemp "${TMPDIR:-/tmp}/likenovel-pre-push-legacy.XXXXXX")"
  write_pre_push_dispatcher "$tmp"
  write_legacy_active_pre_push "$legacy_tmp"

  if cmp -s "$hook_path" "$tmp" ||
    cmp -s "$hook_path" "$legacy_tmp" ||
    is_managed_dispatcher "$hook_path"; then
    rm -f "$tmp" "$legacy_tmp"
    return 0
  fi

  rm -f "$tmp" "$legacy_tmp"
  echo "ERROR: existing active pre-push hook differs: $hook_path" >&2
  echo "Review or back it up before installing the LikeNovel dispatcher." >&2
  exit 1
}

install_active_pre_push_dispatcher() {
  local hook_path tmp legacy_tmp

  if [[ "$active_hooks_dir" == "$hooks_dir" ]]; then
    return 0
  fi

  mkdir -p "$active_hooks_dir"
  hook_path="$active_hooks_dir/pre-push"
  tmp="$(mktemp "$active_hooks_dir/.pre-push-dispatcher.XXXXXX")"
  legacy_tmp="$(mktemp "$active_hooks_dir/.pre-push-legacy.XXXXXX")"
  write_pre_push_dispatcher "$tmp"
  write_legacy_active_pre_push "$legacy_tmp"

  if [[ -e "$hook_path" ]]; then
    if cmp -s "$hook_path" "$tmp"; then
      rm -f "$tmp" "$legacy_tmp"
      chmod +x "$hook_path"
      return 0
    fi

    if cmp -s "$hook_path" "$legacy_tmp" ||
      is_managed_dispatcher "$hook_path"; then
      backup_known_hook "$hook_path"
    else
      rm -f "$tmp" "$legacy_tmp"
      echo "ERROR: existing active pre-push hook differs: $hook_path" >&2
      echo "Review or back it up before installing the LikeNovel dispatcher." >&2
      exit 1
    fi
  fi

  rm -f "$legacy_tmp"
  chmod +x "$tmp"
  mv "$tmp" "$hook_path"
}

is_managed_pre_push() {
  local hook_path
  hook_path="$1"

  [[ "$(sed -n '1p' "$hook_path")" == "#!/usr/bin/env bash" ]] &&
    [[ "$(sed -n '2p' "$hook_path")" == "# LikeNovel managed pre-push hook" ]] &&
    [[ "$(sed -n '3p' "$hook_path")" == \
      "# source: devtools/git-pre-push-safety-check.sh" ]] &&
    [[ "$(sed -n '4p' "$hook_path")" =~ ^#\ source-blob:\ [0-9a-f]{40}$ ]] &&
    [[ "$(sed -n '5p' "$hook_path")" =~ ^#\ source-sha256:\ [0-9a-f]{64}$ ]]
}

install_managed_pre_push() {
  local source_path hook_path tmp legacy_tmp source_blob source_sha marker
  source_path="devtools/git-pre-push-safety-check.sh"
  hook_path="$hooks_dir/pre-push"
  marker="# LikeNovel managed pre-push hook"
  tmp="$(mktemp "$hooks_dir/.pre-push.XXXXXX")"
  legacy_tmp="$(mktemp "$hooks_dir/.pre-push-legacy.XXXXXX")"
  source_blob="$(git hash-object "$source_path")"
  source_sha="$(sha256sum "$source_path" | awk '{print $1}')"

  {
    printf '%s\n' '#!/usr/bin/env bash'
    printf '%s\n' "$marker"
    printf '# source: %s\n' "$source_path"
    printf '# source-blob: %s\n' "$source_blob"
    printf '# source-sha256: %s\n' "$source_sha"
    tail -n +2 "$source_path"
  } >"$tmp"
  write_wrapper "$source_path" "$legacy_tmp"

  if [[ -e "$hook_path" ]]; then
    if cmp -s "$hook_path" "$tmp"; then
      rm -f "$tmp" "$legacy_tmp"
      chmod +x "$hook_path"
      return 0
    fi

    if cmp -s "$hook_path" "$legacy_tmp" ||
      is_managed_pre_push "$hook_path"; then
      backup_known_hook "$hook_path"
    else
      rm -f "$tmp" "$legacy_tmp"
      echo "ERROR: existing hook differs: $hook_path" >&2
      echo "Review or back it up before installing the LikeNovel hook." >&2
      exit 1
    fi
  fi

  rm -f "$legacy_tmp"
  chmod +x "$tmp"
  mv "$tmp" "$hook_path"
}

preflight_active_pre_push_dispatcher
install_wrapper_hook pre-commit devtools/git-pre-commit-safety-check.sh
install_managed_pre_push
install_active_pre_push_dispatcher

echo "Installed LikeNovel git hooks:"
echo "  $hooks_dir/pre-commit -> devtools/git-pre-commit-safety-check.sh"
echo "  $hooks_dir/pre-push   -> self-contained managed hook"
if [[ "$active_hooks_dir" != "$hooks_dir" ]]; then
  echo "  $active_hooks_dir/pre-push -> common managed hook dispatcher"
  echo "  $active_hooks_dir/pre-commit -> preserved external guard"
fi
