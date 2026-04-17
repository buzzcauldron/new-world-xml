#!/usr/bin/env bash
# Push this project to a new empty remote (new GitHub/GitLab repo you create in the browser first).
#
# 1. Create a NEW empty repository (no README/license) on GitHub or GitLab.
# 2. Run:
#      ./scripts/publish-new-repo.sh git@github.com:YOUR_USER/your-repo-name.git
#    or with HTTPS:
#      ./scripts/publish-new-repo.sh https://github.com/YOUR_USER/your-repo-name.git
#
# Optional second argument is the branch to push (default: current branch).
#
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ "${1:-}" = "" ]; then
  echo "Usage: $0 <new-remote-url> [branch]" >&2
  echo "Example: $0 git@github.com:you/new-world-xml.git nwxml" >&2
  exit 1
fi

NEW_URL="$1"
BRANCH="${2:-$(git branch --show-current)}"
REMOTE_NAME="${NEW_REMOTE_NAME:-neworigin}"

if git remote get-url "$REMOTE_NAME" >/dev/null 2>&1; then
  git remote set-url "$REMOTE_NAME" "$NEW_URL"
  echo "==> Updated remote '$REMOTE_NAME' -> $NEW_URL"
else
  git remote add "$REMOTE_NAME" "$NEW_URL"
  echo "==> Added remote '$REMOTE_NAME' -> $NEW_URL"
fi

echo "==> Pushing branch '$BRANCH' to '$REMOTE_NAME'..."
git push -u "$REMOTE_NAME" "$BRANCH"

echo ""
echo "Next (on the hosting site):"
echo "  - Set the default branch to '$BRANCH' if desired."
echo "  - Add a repo description and topics."
echo ""
echo "Optional — keep syncing from the original project:"
echo "  git fetch origin"
echo "  git merge origin/main   # when you want upstream changes"
