# Branch strategy and build gates

## Branching model

- **`main`:** Always releasable; tags cut from here for production installers when using NW.js or after migration.
- **Long-lived integration branch (optional):** e.g. `rewrite/electron-shell` — all migration PRs merge here until parity is achieved; then merge to `main` in one coordinated release (or squash policy per team preference).
- **Topic branches:** Short-lived `feat/*`, `fix/*`, `chore/*` — open PRs against `main` or the integration branch.

## Build gates (local and CI)

Every PR should pass:

| Step | Command |
|------|---------|
| Install | `npm ci` |
| Bundle | `npm run build` |
| Types | `npm run typecheck` |
| Unit + golden | `npm run test:unit` |
| Launcher | `npm run test:launcher` (until NW launchers are removed) |
| Lint | `npm run lint` |

Optional before merge: `./scripts/code-review.sh` (mirrors CI).

## CI triggers

GitHub Actions should run the same gates on:

- Pushes to protected branches (`main`, `develop`, `rebuild`, etc.).
- **All pull requests** so feature and integration branches get feedback without retargeting.

See [.github/workflows/code-review.yml](../.github/workflows/code-review.yml).

## Release builds

- **Tag push** (e.g. `v2.1.0`): build signed installers and attach to Releases (see [CI-INSTALLERS.md](./CI-INSTALLERS.md)).
- **Manual:** `workflow_dispatch` for nightly or test artifacts.

## Portable Node (`.tools/`)

[scripts/bootstrap-node.sh](../scripts/bootstrap-node.sh) is for contributors without Node 18+. It is **not** required in CI (Actions provides Node). Post-migration, document “Node 20 LTS + npm ci” as the only dev path if bootstrap is retired.
