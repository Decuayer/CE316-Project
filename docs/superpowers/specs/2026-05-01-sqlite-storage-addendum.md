# SQLite Storage Addendum

**Date:** 2026-05-01
**Status:** Approved (refines `2026-04-20-iae-design.md`)
**Scope:** Replaces the JSON-file storage model in the original IAE spec with SQLite as the single source of truth. Configuration sharing (R5) keeps a JSON-file format strictly as the on-disk interchange medium.

---

## Decision

| Layer | Original spec | This addendum |
|---|---|---|
| Configurations | `~/.iae/configurations/<id>.json` | row in `configurations` table |
| Projects | `~/.iae/projects/<id>/project.json` | row in `projects` table |
| Per-student results | `~/.iae/projects/<id>/results/results.json` | rows in `student_results` table |
| Extracted submissions | `~/.iae/projects/<id>/submissions/<sid>/` | unchanged - filesystem |
| R5 sharing | file copy of the JSON config | DB row -> JSON file -> DB row on the other machine |

The DB lives at `~/.iae/iae.db`. Schema and migrations are defined in `electron/services/schema.ts`.

## Why

- **R5 still trivially satisfied** - one row to one JSON file on disk; no SQL server in sight.
- **Cross-project queries become cheap** - Dashboard stats are a single `SELECT` instead of scanning every project folder.
- **Atomic results writes** - a `student_results` insert is one transaction; partial-run state is consistent if the process crashes mid-batch.
- **Single file = easy backup** - copy `iae.db` to back up everything except the extracted source-file submissions.

## What stays on disk

Compiled binaries, extracted source files, and any artifacts from the per-student pipeline live under `~/.iae/projects/<projectId>/submissions/<studentId>/`. The `projects.submissionsDir` column stores the path. Putting student source code in SQLite is the wrong shape - the compiler/interpreter wants files on disk, and the DB row count would balloon for no benefit.

## R5 sharing format

A `.json` file produced by `ConfigService.export(id, targetPath)` contains the full `Configuration` shape from `shared/types.ts`. `ConfigService.import(filePath)` reads, validates, regenerates the id, rewrites the timestamps, and inserts a fresh row.

The exported file is portable across machines. Bringing the same `.json` back into the same database produces a second row (different id) - this is by design; we never silently overwrite an existing configuration on import.

## Native module ABI

`better-sqlite3` is a native module. Its compiled binding must match the runtime that loads it (Electron's Node ABI vs system Node ABI - they differ by minor version).

The `package.json` scripts handle this transparently:
- `predev` -> rebuilds for Electron's ABI before starting `vite` / Electron
- `pretest` -> rebuilds for system Node's ABI before running vitest
- `dist` -> electron-builder rebuilds again as part of packaging

Manual escape hatches: `npm run rebuild:electron` and `npm run rebuild:node`.

## Migration story

This is greenfield. There are no existing JSON files to migrate. The Database service runs migration version 1 on first app launch and is idempotent on subsequent launches.
