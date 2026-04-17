# NW.js integration audit

Inventory of **NW.js–specific** and **Node-in-renderer** usage for migrating to Electron/Tauri or web-only.

## `package.json`

| Field / script | Role |
|----------------|------|
| `main: ./html/index.html` | NW entry HTML |
| `window` | Default window size/title |
| `dependencies.nw` | Pins SDK; **postinstall downloads large native SDK** |
| `scripts.start` / `nw` | `nw .` |
| `prepare` | `npm run build` on install |

## HTML

| Location | Usage |
|----------|--------|
| [html/index.html](../html/index.html) | `#saveFileAsDialog` — `nwsaveas` attribute |
| [html/test-example.html](../html/test-example.html) | Same `nwsaveas` |

Replace with Electron `dialog.showSaveDialog` or Tauri equivalent; attributes become no-ops on the web.

## [js/nw-app.js](../js/nw-app.js)

| API / pattern | Purpose |
|---------------|---------|
| `nw.Window.get()` | Window ref: DevTools, print, reload, close |
| `win.showDevTools()` | DevTools (Mousetrap) |
| `win.print({...})` | Print |
| `win.reloadIgnoringCache()` | Reload |
| `win.on('close', ...)` / `win.close(true)` | Quit flow |
| `nw.Window.open(...)` | New window with `#hash` |
| `nw.App.manifest` | Version, window title |
| `nw.App.argv` | CLI and `parseArgs` |
| `nw.App.on('open', ...)` | Second instance → new window + argv |
| `process.platform`, `process.versions.*`, `process.env` | OS detection, version info |
| `require('fs')`, `require('path')` | Read/write XML, backup `~`, cwd |
| `require('glob').sync` | Resolve image next to XML (transitive dep via NW/npm tree) |
| `require('image-size')` | Image dimensions for new XML from image |
| `require('intercept-stdout')` | Optional capture of xmllint validation output |
| `$('#openFileDialog').attr('nwworkingdir', ...)` | Native file dialog cwd |
| `$('#saveFileAsDialog').attr('nwsaveas' / 'nwworkingdir')` | Save-as dialog |
| `global.pageNum`, `global.pageWindows`, `global.argv` | Multi-window coordination |
| Drag-drop | `e.dataTransfer.files[i].path` (Node path in NW) |

**CLI flags parsed:** `--disable-features=nw2`, `--wd`, `--js`, `--css`, `--list`, file paths, directory expansion.

## [js/nw-winstate.js](../js/nw-winstate.js)

| API | Purpose |
|-----|---------|
| `nw` / `require('nw.gui')` | Legacy fallback |
| `gui.Window.get()` | Resize/move/maximize |
| `localStorage.windowState` | Persist geometry |

## Other JS (grep for `nw`)

- [js/nw-app.js](../js/nw-app.js) only (plus nw-winstate).

## Launchers and packaging

| Artifact | Role |
|----------|------|
| [bin/visual-page-editor](../bin/visual-page-editor) | Resolve `nw` binary, arch, cache, `NWJS_VERSION` |
| `bin/visual-page-editor.ps1`, `.bat` | Windows |
| [scripts/install-desktop.sh](../scripts/install-desktop.sh), [bootstrap-node.sh](../scripts/bootstrap-node.sh) | Node + npm + NW verify |
| [Dockerfile.desktop](../Dockerfile.desktop) | Downloads NW.js tarball |
| [BUILD.md](../BUILD.md), `build-*.sh`, `rpm/`, `debian/` | OS packages around NW layout |

## Migration mapping (sketch)

| NW | Electron (typical) |
|----|---------------------|
| `nw.App.argv` | `process.argv` in main; pass to renderer via IPC |
| `nw.App.on('open')` | `app.on('open-file', ...)` / second-instance |
| `nw.Window.open` | `new BrowserWindow` + `loadFile` |
| `require('fs')` in page | `fs` in main or `contextBridge` + limited API |
| `nwsaveas` / `nwworkingdir` | `dialog.showOpenDialog` / `showSaveDialog` |
| `win.print` | `webContents.print` |
| Window state | `electron-window-state` or custom + `preload` |

This list is for planning; exact APIs depend on the chosen Electron major version and security model (context isolation on).
