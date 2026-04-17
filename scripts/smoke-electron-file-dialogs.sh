#!/usr/bin/env bash
# Smoke: native Electron dialogs wired; build + unit tests + launcher. Run from repo root.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

fail() { echo "FAIL: $*" >&2; exit 1; }

grep -q "vpe-show-open-dialog" electron/main.js || fail "main process missing vpe-show-open-dialog"
grep -q "vpe-show-save-dialog" electron/main.js || fail "main process missing vpe-show-save-dialog"
grep -q "ipcRenderer.invoke( 'vpe-show-open-dialog'" js/nw-app.js || fail "nw-app must invoke vpe-show-open-dialog under Electron"
grep -q "ipcRenderer.invoke( 'vpe-show-save-dialog'" js/nw-app.js || fail "nw-app must invoke vpe-show-save-dialog under Electron"

npm run build >/dev/null
npm run lint
npm run typecheck
npm run test:unit
./scripts/test-electron-launcher.sh
npm test >/dev/null
echo "OK: smoke-electron-file-dialogs (build, lint, typecheck, unit, launcher, review)"
