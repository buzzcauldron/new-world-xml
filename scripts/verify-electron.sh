#!/usr/bin/env bash
# Verify local Electron install (replaces verify-local-nw-install.sh on this branch).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if [ ! -f "$ROOT/node_modules/.bin/electron" ]; then
  echo "error: node_modules/.bin/electron missing — run npm ci" >&2
  exit 1
fi
echo "Electron OK: $("$ROOT/node_modules/.bin/electron" --version 2>/dev/null || echo unknown)"
