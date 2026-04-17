# Visual Page Editor

A modern visual editor for Page XML files, based on [nw-page-editor](https://github.com/mauvilsa/nw-page-editor).

**Upstream lineage:** [nw-page-editor](https://github.com/mauvilsa/nw-page-editor) → [buzzcauldron/visual-page-editor](https://github.com/buzzcauldron/visual-page-editor). If this copy lives in **your own repo**, update the clone URL in the sections below to your remote.

### New repository

After you create an **empty** repository on GitHub or GitLab (no README, no license—avoid merge conflicts on first push), from this repo run:

```bash
chmod +x ./scripts/publish-new-repo.sh
./scripts/publish-new-repo.sh git@github.com:YOUR_USER/your-repo-name.git new-world-xml
```

Use HTTPS or SSH depending on your setup. The script adds a remote named `neworigin` and pushes the branch. Then set the **default branch** and description in the hosting UI.

## Description

Visual Page Editor is an application for viewing and editing ground truth or predicted information for document processing and text recognition. Editing is done interactively on top of images of scanned documents.

## Features

- Visual editing of Page XML with live feedback
- Supports omni:us Pages Format, PRImA Page XML, ALTO v2/v3, TET, Poppler
- Desktop app (**Electron** on branch `new-world-xml`; legacy builds used NW.js) and web-app variant
- Keyboard shortcuts (see [KEYBOARD-SHORTCUTS.md](KEYBOARD-SHORTCUTS.md))

---

## Quick start (desktop)

```bash
git clone https://github.com/buzzcauldron/visual-page-editor.git
cd visual-page-editor
./scripts/install-desktop.sh
./bin/visual-page-editor examples/lorem.xml
```

That installs dependencies (and bootstraps Node into `.tools/` if you do not have Node 18+), then opens the sample Page XML with the local **Electron** binary from `npm` (`node_modules/.bin/electron`). No separate native SDK download (unlike the old NW.js flow).

**Windows (PowerShell):** `.\scripts\install-desktop.ps1` then `.\bin\visual-page-editor.ps1 examples\lorem.xml`

Optional: `./scripts/install-desktop.sh --start` runs install and then launches the app in one step. On Windows: `.\scripts\install-desktop.ps1 -Start`.

More detail — Docker desktop image, tests, packaging, Apple Silicon notes: [README-DOCKER.md](README-DOCKER.md), [TESTING.md](TESTING.md), [BUILD.md](BUILD.md), [INSTALL-MAC.md](INSTALL-MAC.md).

**Open multiple files:** `./bin/visual-page-editor examples/lorem.xml examples/lorem2.xml`

---

## Container (Docker)

**Recommended:** from the repo root, use **`./docker-run.sh`** — it builds a version-tagged image (`visual-page-editor:<VERSION>` from [`VERSION`](VERSION)), configures **XQuartz** on macOS or **X11** on Linux, and mounts your project so saves stay on the host. First run builds the image; after upgrades use `./docker-run.sh --build …`.

```bash
./docker-run.sh examples/lorem.xml
```

No Node is required on the host for the Docker workflow—only Docker (and XQuartz on macOS for a visible window). *Note:* existing Dockerfiles may still reference NW.js until updated for Electron. See **[README-DOCKER.md](README-DOCKER.md)**.

---

## Usage

| Shortcut | Action |
|----------|--------|
| `Mod + O` / `Mod + S` | Open / Save |
| `Page Up/Down` or arrows | Navigate pages (arrows pan when zoomed) |
| `Mod + 0` / `Mod + 2` | Fit page / Zoom to selection |
| `Tab` / `Shift + Tab` | Next / previous element |
| Full list | [KEYBOARD-SHORTCUTS.md](KEYBOARD-SHORTCUTS.md) |

## Supported formats

- omni:us Pages Format, PRImA Page XML (2013-07-15, 2010-03-19), ALTO v2/v3, TET, Poppler

## Web app

The `web-app` directory provides a web-based variant for remote use. See that directory for setup.

## Development

```bash
git clone https://github.com/buzzcauldron/visual-page-editor.git
cd visual-page-editor
./scripts/install-desktop.sh   # or: npm install
./bin/visual-page-editor
# or: npm start
```

Verification: `npm run verify:electron` checks the local Electron CLI. Other scripts in [TESTING.md](TESTING.md) may still mention NW.js until docs are refreshed.

**Testing:**
- `npm run test:unit` — vitest unit tests (Point2f, golden Page XML, etc.)
- `npm run test:launcher` — Electron launcher smoke checks (`scripts/test-electron-launcher.sh`)
- `npm run review` / `./scripts/code-review.sh` — code review; see [CODE_REVIEW.md](CODE_REVIEW.md)

**Build:** `npm run build` bundles `src/entry.js` → `js/bundle.js` via esbuild (runs automatically on `npm install` via the `prepare` script). Use `npm run build:watch` during development.

**Packaged desktop installers:** `npm run dist` (or `npm run dist:dir` for an unpacked directory) runs **electron-builder** after `npm run build`. Output goes to `dist/` (gitignored).

### Migration / rewrite (scope and install simplification)

- Parity checklist: [docs/MIGRATION-PARITY.md](docs/MIGRATION-PARITY.md)
- Desktop shell choice (Electron vs Tauri vs web-first): [docs/DESKTOP-SHELL-CHOICE.md](docs/DESKTOP-SHELL-CHOICE.md)
- NW.js API audit: [docs/NWJS-AUDIT.md](docs/NWJS-AUDIT.md)
- CI, installers, deprecation: [docs/CI-INSTALLERS.md](docs/CI-INSTALLERS.md)
- Branch strategy and build gates: [docs/BRANCH-BUILD.md](docs/BRANCH-BUILD.md)

## License and links

- **License:** MIT — [LICENSE.md](LICENSE.md)
- **This project:** [github.com/buzzcauldron/visual-page-editor](https://github.com/buzzcauldron/visual-page-editor)
- **Original:** [nw-page-editor](https://github.com/mauvilsa/nw-page-editor) by Mauricio Villegas
- **Page format:** [omni-us/pageformat](https://github.com/omni-us/pageformat)
