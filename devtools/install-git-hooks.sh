#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

hooks_dir="$(git rev-parse --git-path hooks)"
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
  local hook_path backup_path backup_tmp
  hook_path="$1"
  backup_path="$hook_path.likenovel-backup"

  if [[ -e "$backup_path" ]]; then
    return 0
  fi

  backup_tmp="$(mktemp "$hooks_dir/.pre-push-backup.XXXXXX")"
  cp -p "$hook_path" "$backup_tmp"
  mv "$backup_tmp" "$backup_path"
  printf 'Backed up previous LikeNovel pre-push hook: %s\n' "$backup_path"
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

install_wrapper_hook pre-commit devtools/git-pre-commit-safety-check.sh
install_managed_pre_push

echo "Installed LikeNovel git hooks:"
echo "  $hooks_dir/pre-commit -> devtools/git-pre-commit-safety-check.sh"
echo "  $hooks_dir/pre-push   -> self-contained managed hook"
