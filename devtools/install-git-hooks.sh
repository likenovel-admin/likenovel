#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

mkdir -p .git/hooks

install_hook() {
  local hook_name target_script hook_path tmp
  hook_name="$1"
  target_script="$2"
  hook_path=".git/hooks/$hook_name"
  tmp="$(mktemp)"

  cat > "$tmp" <<HOOK
#!/usr/bin/env bash
exec bash $target_script "\$@"
HOOK

  if [[ -e "$hook_path" ]] && ! cmp -s "$hook_path" "$tmp"; then
    rm -f "$tmp"
    echo "ERROR: existing hook differs: $hook_path" >&2
    echo "Review or back it up before installing the LikeNovel hook." >&2
    exit 1
  fi

  mv "$tmp" "$hook_path"
  chmod +x "$hook_path"
}

install_hook pre-commit devtools/git-pre-commit-safety-check.sh
install_hook pre-push devtools/git-pre-push-safety-check.sh

echo "Installed LikeNovel git hooks:"
echo "  .git/hooks/pre-commit -> devtools/git-pre-commit-safety-check.sh"
echo "  .git/hooks/pre-push   -> devtools/git-pre-push-safety-check.sh"
