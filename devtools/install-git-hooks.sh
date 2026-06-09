#!/usr/bin/env bash

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

mkdir -p .git/hooks

cat > .git/hooks/pre-commit <<'HOOK'
#!/usr/bin/env bash
exec bash devtools/git-pre-commit-safety-check.sh "$@"
HOOK

cat > .git/hooks/pre-push <<'HOOK'
#!/usr/bin/env bash
exec bash devtools/git-pre-push-safety-check.sh "$@"
HOOK

chmod +x .git/hooks/pre-commit .git/hooks/pre-push

echo "Installed LikeNovel git hooks:"
echo "  .git/hooks/pre-commit -> devtools/git-pre-commit-safety-check.sh"
echo "  .git/hooks/pre-push   -> devtools/git-pre-push-safety-check.sh"
