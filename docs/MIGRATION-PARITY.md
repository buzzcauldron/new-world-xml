# Migration parity checklist

Use this checklist when replacing NW.js with another desktop shell (or when changing the web stack). Mark items **Pass / Fail / N/A** per release candidate.

Sources: [README.md](../README.md), [KEYBOARD-SHORTCUTS.md](../KEYBOARD-SHORTCUTS.md), [web-app/](../web-app/).

## Supported formats and I/O

| Item | Notes |
|------|--------|
| Open/save Page XML | Multi-page file list, dirty state, `*` in title, backup `~` on save |
| omni:us Pages Format | As in README |
| PRImA Page XML (2013-07-15, 2010-03-19) | Namespace handling |
| ALTO v2/v3, TET, Poppler | Import/export paths |
| Image-backed new XML | Create XML beside image when opening non-XML |
| CLI / drag-drop | Multiple files, `--wd`, `--list`, launcher args (see [NWJS-AUDIT.md](./NWJS-AUDIT.md)) |

## Desktop behaviors (NW-specific today)

| Item | Notes |
|------|--------|
| New window (`Mod+N`) | Second window with hash routing |
| Second-instance open (`nw.App` `open`) | Forwards argv to new window |
| Quit / close (`Mod+Q` / `Mod+W`) | Optional save prompt, autosave path |
| Print | `win.print` equivalent |
| DevTools toggle | Platform-specific chords per KEYBOARD-SHORTCUTS |
| Reload / reload ignoring cache | Prompt if unsaved |
| Window state | Position/size/maximized persistence (see `nw-winstate.js`) |
| Version in title / About | Manifest version vs `PAGE_EDITOR_VERSION` |
| Update check | GitHub `package.json` compare (optional to keep) |

## Web app (`web-app/`)

| Item | Notes |
|------|--------|
| PHP auth / file read / save | `authGetFile.php`, `saveFile.php`, `index.php` |
| Keyboard: `Mod+S` / `Alt+S` | Per KEYBOARD-SHORTCUTS web section |
| Parity with desktop | Same editor bundle behavior where applicable |

If the migration retires PHP, document the replacement (static hosting + API, or desktop-only).

## Keyboard and editing

Treat [KEYBOARD-SHORTCUTS.md](../KEYBOARD-SHORTCUTS.md) as authoritative. Pay special attention to:

- Edit modes: `Mod+,` / `Mod+.` (and Shift variants), single-key `c`/`b`/`m`/`d` vs text focus
- Navigation: Page Up/Down, arrows (pan vs page), zoom chords
- Selection: Tab, Ctrl+Tab on drag points, delete/backspace rules
- Table and sequence shortcuts (`-` `.`, `+` `.`, etc.)

## Validation and tooling

| Item | Notes |
|------|--------|
| Page XML schema validation | XSD load (submodule / fetch-xsd / GitHub fallback) |
| Lazy `xmllint.js` | Loaded on first validate |
| “Validate text as XML” preference | User-facing option in drawer |

## Non-functional

| Item | Notes |
|------|--------|
| Large-document performance | Pan/zoom, many regions |
| Startup time | Deferred argv load, first paint |
| Offline | XSD and validation without network when possible |

## Automated coverage

- Unit: `npm run test:unit` (Vitest)
- Launcher: `npm run test:launcher` (Bats) until the bash/PowerShell launcher is removed
- Golden XML: `test/golden-xml.test.mjs` (fixture integrity + optional `xmllint`)
- Full UI edit/save parity: add end-to-end tests (e.g. Playwright) when the new shell is stable
