# CI-built installers and deprecation path

## Current CI

[.github/workflows/code-review.yml](../.github/workflows/code-review.yml) runs on pushes to `main`, `develop`, `rebuild` and on pull requests (see workflow file for exact triggers). Gates:

1. `npm ci`
2. `npm run build`
3. `npm run typecheck`
4. `npm run test:unit`
5. `npm run test:launcher`
6. `npm run lint`
7. `./scripts/code-review.sh`

System packages: `xmlstarlet`, `libxml2-utils`, `bats` (for launcher tests and tooling).

## Target state (post–NW.js / Electron or Tauri)

1. **PR CI (every branch):** Same Node gates as today; add when available:
   - `npm run test:e2e` (Playwright or similar) against packaged or `electron .` dev.
2. **Release CI (tags, e.g. `v*`):**
   - Build installers with **electron-builder** (or Tauri `tauri build`) on `ubuntu-latest`, `macos-latest`, `windows-latest`.
   - Upload artifacts to **GitHub Releases** (and optional npm publish for CLI wrapper).
3. **Signing:** macOS notarization + Windows Authenticode as secrets allow; document in release runbook.

## Deprecation order (suggested)

1. **Ship** Electron (or Tauri) binaries on Releases; keep NW.js path in `main` until parity checklist in [MIGRATION-PARITY.md](./MIGRATION-PARITY.md) passes.
2. **Remove** `dependencies.nw`, `bin/visual-page-editor` NW resolution, and Docker NW download once users are on new installers.
3. **Trim** [BUILD.md](../BUILD.md) RPM/DEB/macOS/Windows sections that assume `node_modules/nw` layout; replace with “download from Releases” + optional `npm run package`.
4. **Web:** If PHP is retired, archive [web-app/](../web-app/) or replace with a documented Node static server; update README.

## Docker

- Replace [Dockerfile.desktop](../Dockerfile.desktop) with either:
  - **Option A:** Run the published AppImage or official Linux `.deb` inside a container with X11 (similar to today), or
  - **Option B:** Dev-focused image that runs `npm start` with Electron in headless CI only (no GUI).

## Risk

Installer pipelines are easy to break on OS upgrades; pin runner images and document manual smoke tests (open file, save, quit) before promoting a release.
