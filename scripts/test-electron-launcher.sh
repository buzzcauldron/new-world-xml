#!/usr/bin/env bash
# Portable launcher smoke tests (no bats required). Run: npm run test:launcher
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

node -e "const p=require('./package.json'); if (p.main !== 'electron/main.js') process.exit(1);" || fail "package.json main must be electron/main.js"
test -f "$ROOT/node_modules/.bin/electron" || fail "node_modules/.bin/electron missing"
test -f "$ROOT/electron/nw-shim.js" || fail "electron/nw-shim.js missing"
test -x "$ROOT/bin/visual-page-editor" || fail "bin/visual-page-editor must be executable"
grep -q 'node_modules/.bin/electron' "$ROOT/bin/visual-page-editor" || fail "launcher must invoke electron"

echo "OK: electron launcher checks passed."
