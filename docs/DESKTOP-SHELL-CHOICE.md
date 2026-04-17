# Desktop shell choice (Electron vs Tauri vs web-first)

This document records a **recommended direction** for simplifying install and architecture while keeping the existing editor (HTML/CSS/JS) as the UI.

## Goals

- **End users:** Install from a prebuilt binary (or store package), not `git clone` + `npm install` + NW.js SDK download.
- **Developers:** Standard `npm ci`, one obvious dev entry (`npm run dev`), minimal OS-specific launcher scripts.
- **Parity:** Replace [js/nw-app.js](../js/nw-app.js) behaviors (files, argv, windows, print) with explicit main-process APIs.

## Options compared

### A. Electron

**Pros:** Mature ecosystem; `electron-builder` / Forge for `.dmg`, `.exe`, AppImage, `.deb`; most teams can hire for it; maps cleanly to Chromium + Node main process + preload.

**Cons:** Large install size; Chromium security updates require Electron upgrades; main process is Node (familiar but not minimal).

**Fit:** **Best default** for this codebase: the renderer can stay almost unchanged; IPC replaces `nw.App` / `nw.Window` / `require('fs')` in the renderer gradually.

### B. Tauri

**Pros:** Smaller binaries; Rust-backed security model; webview uses OS web engine where applicable.

**Cons:** Rust toolchain for maintainers; different packaging and IPC patterns; webview behavior differs slightly from “Chrome everywhere.”

**Fit:** Strong if binary size and non-Chromium webviews are priorities and the team accepts Rust in the build.

### C. Web-first + optional wrapper

**Pros:** Simplest deploy for remote users (HTTPS + browser); PWA possible.

**Cons:** File system story varies by browser (File System Access API); macOS/Linux quirks; harder to match NW file dialogs, multi-window, and CLI `open file.xml` without a desktop shell.

**Fit:** Good for **server-hosted** editing; pair with Electron/Tauri only if desktop parity is required.

## Recommendation

1. **Primary:** **Electron** main + **preload** (contextBridge) for `fs` dialog paths, `argv`, and window management — smallest conceptual jump from NW.js.
2. **Keep** a single web build for optional hosted use; **replace** ad hoc PHP with a documented static + small API server only if remote workflows must stay.
3. **Revisit Tauri** after Electron parity if install size drives a second iteration.

## Deprecations (when switching)

- npm package `nw` and [bin/visual-page-editor](../bin/visual-page-editor) path resolution
- [Dockerfile.desktop](../Dockerfile.desktop) NW.js download path (replace with Electron or thin X11 wrapper image)
- RPM/DEB scripts that bundle NW.js (regenerate against new artifact layout)

See [CI-INSTALLERS.md](./CI-INSTALLERS.md) for packaging and CI.
