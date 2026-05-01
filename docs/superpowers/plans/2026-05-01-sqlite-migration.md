# SQLite Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shift the IAE source-of-truth from filesystem JSON files to a SQLite database (`~/.iae/iae.db`), keeping JSON only as the configuration sharing format for R5.

**Architecture:** A single `Database` service owns one `better-sqlite3` connection. Three tables (`configurations`, `projects`, `student_results`) store everything queryable. ZIP-extracted student source files still live on disk; the DB only stores the path. Configuration import/export round-trips a single SQL row to/from a JSON file — every other entity stays in SQL exclusively.

**Tech Stack:** `better-sqlite3` (synchronous SQLite for Node), `electron-builder install-app-deps` for native rebuild against Electron's ABI, `vitest` for unit tests, existing Electron + React + TypeScript stack.

---

## Context for the Implementer

You are working in an Electron + React + TypeScript desktop app for batch programming-assignment evaluation. Read these first:

- **Surrounding design:** `docs/superpowers/specs/2026-04-20-iae-design.md` (data models, requirements R1–R10) and `docs/superpowers/specs/2026-04-29-evaluation-flow-design.md` (per-student pipeline, DataSource discriminated union).
- **Existing scaffold:** `electron/services/FileService.ts` is real; `ConfigService.ts`, `ProjectService.ts`, `ExecutionService.ts`, `ZipService.ts` exist with TODO bodies that throw `Error('Not implemented: ...')`. IPC handlers in `electron/ipc/*.ts` are wired to those services. React pages in `src/pages/` are TODO blueprints.
- **Type surface:** `shared/types.ts` already has the post-evaluation-flow types — `DataSource`, `Configuration`, `Project`, `StudentResult`, `ProjectResults`, `IpcChannels`. **Do not change these.**

### What changes in this plan

| Layer | Before | After |
|---|---|---|
| Storage | `~/.iae/configurations/*.json`, `~/.iae/projects/<id>/project.json` and `results/results.json` | `~/.iae/iae.db` (one SQLite file) |
| Submissions | `~/.iae/projects/<id>/submissions/<studentId>/` (filesystem) | unchanged — stays on filesystem; DB stores the path |
| R5 sharing | export/import = `cp config.json other-machine.json` | export = `SELECT row → JSON.stringify → write file`; import = inverse |
| Tests | none | `vitest` for `Database` and JSON round-trip |

### What stays a TODO scaffold

- `ConfigService.getAll/getById/create/update/delete` — bodies remain `throw 'Not implemented'`, with SQL queries described in comments.
- `ProjectService.*` — same.
- `ExecutionService.runAll / runStudent / cleanupArtifacts` — same.

### What this plan implements for real

- `Database` service (open + migrate + close).
- `ConfigService.import` and `ConfigService.export` (the R5 sharing feature).
- Wiring of `Database` into `electron/main.ts` so the app actually opens the DB on launch.
- electron-builder native unpack so the Windows installer ships a working `better-sqlite3.node`.

---

## File Structure

### New files

| Path | Responsibility |
|---|---|
| `electron/services/schema.ts` | Migration SQL as a TypeScript constant array (pure data, no logic). |
| `electron/services/Database.ts` | Owns the `better-sqlite3` connection; runs migrations; exposes `raw` getter. |
| `electron/services/Database.test.ts` | Vitest unit tests for migrations + idempotency. |
| `electron/services/ConfigService.test.ts` | Vitest tests for the JSON export/import round-trip (the only ConfigService methods that are real after this plan). |
| `vitest.config.ts` | Test config with the same `@shared` alias as the renderer. |
| `docs/superpowers/specs/2026-05-01-sqlite-storage-addendum.md` | Addendum: SQLite is source of truth; JSON is sharing-only. |

### Modified files

| Path | Change |
|---|---|
| `package.json` | Add `better-sqlite3` + `@types/better-sqlite3`; add `vitest`; add `test` and `postinstall` scripts. |
| `electron/services/ConfigService.ts` | Constructor takes `Database`; method comments reference SQL queries; `import`/`export` are real implementations. |
| `electron/services/ProjectService.ts` | Constructor takes `Database` + `projectsRoot`; method comments reference SQL queries. Bodies stay `throw 'Not implemented'`. |
| `electron/services/ExecutionService.ts` | Constructor takes `Database`; comments describe the `student_results` write pattern (clear-then-insert-in-transaction). |
| `electron/main.ts` | Construct `Database` once during `createWindow`; pass it to each IPC registrar. |
| `electron/ipc/config.ipc.ts` | Signature: `(ipcMain, database)`. |
| `electron/ipc/project.ipc.ts` | Signature: `(ipcMain, database, projectsRoot)`. |
| `electron/ipc/execution.ipc.ts` | Signature: `(ipcMain, database, projectsRoot)`. |
| `src/pages/Configurations.tsx` | Add Import/Export buttons (UI shell with handlers calling `ipc.config.import/export`). |
| `electron-builder.yml` | `asarUnpack` better-sqlite3 native binary so the installed app can load it. |

`shared/types.ts` is **not** modified — its surface is already correct.

---

## Task 1: Test runner setup (vitest)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `electron/services/__smoke__.test.ts` (deleted at the end of this task)

- [ ] **Step 1: Install vitest**

```bash
npm install --save-dev vitest@^2.1.0
```

Expected output: `added N packages` with vitest visible. No errors.

- [ ] **Step 2: Add scripts to `package.json`**

Edit `package.json`. In the `"scripts"` block, add `test` and `test:watch` after `"preview"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "dist": "npm run build && electron-builder"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['electron/**/*.test.ts', 'src/**/*.test.ts', 'shared/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
```

- [ ] **Step 4: Smoke test**

Create `electron/services/__smoke__.test.ts`:

```ts
import { describe, it, expect } from 'vitest';

describe('vitest smoke', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2);
  });
});
```

Run: `npm test`
Expected: `Test Files  1 passed (1)` and `Tests  1 passed (1)`.

- [ ] **Step 5: Delete the smoke test**

```bash
rm electron/services/__smoke__.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest test runner"
```

---

## Task 2: better-sqlite3 dependency + native rebuild

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install better-sqlite3 and its types**

```bash
npm install better-sqlite3@^11.5.0
npm install --save-dev @types/better-sqlite3@^7.6.12
```

Expected output: `added N packages`. Likely a build step runs (`node-gyp` compiling the native binding).

- [ ] **Step 2: Add `postinstall` script to `package.json`**

`electron-builder install-app-deps` rebuilds native modules against Electron's Node ABI (different from the system Node ABI). Without this, `better-sqlite3` will throw `NODE_MODULE_VERSION` errors when Electron tries to load it.

Edit `package.json` `"scripts"`:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest",
  "postinstall": "electron-builder install-app-deps",
  "dist": "npm run build && electron-builder"
}
```

- [ ] **Step 3: Run the rebuild**

```bash
npm run postinstall
```

Expected: `• electron-builder ... • rebuilding native dependencies dependencies=better-sqlite3@<ver>` followed by no errors.

- [ ] **Step 4: Externalize better-sqlite3 in vite-plugin-electron**

The native module cannot be bundled by Rollup. Edit `vite.config.ts` line 18 (the main process `external` list):

```ts
external: ['electron', 'adm-zip', 'better-sqlite3'],
```

- [ ] **Step 5: Verify Node can load it**

```bash
node -e "const Db = require('better-sqlite3'); const d = new Db(':memory:'); d.exec('CREATE TABLE t(x)'); console.log('ok'); d.close();"
```

Expected: `ok`. (This uses system Node, not Electron, but proves the binding compiled correctly.)

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add better-sqlite3 with electron rebuild"
```

---

## Task 3: Schema definitions module

**Files:**
- Create: `electron/services/schema.ts`

- [ ] **Step 1: Write the schema module**

Create `electron/services/schema.ts`:

```ts
/**
 * Schema migrations for the IAE SQLite database.
 *
 * Each migration is applied exactly once, in `version` ascending order.
 * The `Database` service tracks which versions are applied via the
 * `schema_migrations` table.
 *
 * NEVER edit a published migration. Add a new one instead.
 */
export interface Migration {
  version: number;
  description: string;
  up: string;
}

export const SCHEMA_MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version   INTEGER PRIMARY KEY,
    appliedAt TEXT    NOT NULL
  );
`;

export const MIGRATIONS: ReadonlyArray<Migration> = [
  {
    version: 1,
    description: 'initial schema: configurations, projects, student_results',
    up: `
      CREATE TABLE configurations (
        id                  TEXT    PRIMARY KEY,
        name                TEXT    NOT NULL,
        language            TEXT    NOT NULL,
        compileCommand      TEXT,
        compileArgs         TEXT,
        runCommand          TEXT    NOT NULL,
        runArgs             TEXT,
        sourceFileExpected  TEXT    NOT NULL,
        createdAt           TEXT    NOT NULL,
        updatedAt           TEXT    NOT NULL
      );

      CREATE TABLE projects (
        id                       TEXT    PRIMARY KEY,
        name                     TEXT    NOT NULL,
        configurationId          TEXT    NOT NULL,
        configurationSnapshot    TEXT    NOT NULL,
        inputType                TEXT    NOT NULL CHECK (inputType IN ('text','file')),
        inputValue               TEXT    NOT NULL,
        expectedOutputType       TEXT    NOT NULL CHECK (expectedOutputType IN ('text','file')),
        expectedOutputValue      TEXT    NOT NULL,
        submissionsDir           TEXT    NOT NULL,
        createdAt                TEXT    NOT NULL,
        updatedAt                TEXT    NOT NULL
      );

      CREATE TABLE student_results (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        projectId           TEXT    NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        runAt               TEXT    NOT NULL,
        studentId           TEXT    NOT NULL,
        zipExtracted        INTEGER NOT NULL,
        sourceFound         INTEGER NOT NULL,
        compiled            INTEGER NOT NULL,
        compileOutput       TEXT    NOT NULL DEFAULT '',
        compileError        TEXT,
        executed            INTEGER NOT NULL,
        executionOutput     TEXT    NOT NULL DEFAULT '',
        executionError      TEXT,
        executionTimedOut   INTEGER NOT NULL,
        outputMatched       INTEGER NOT NULL,
        expectedOutput      TEXT    NOT NULL DEFAULT '',
        actualOutput        TEXT    NOT NULL DEFAULT '',
        status              TEXT    NOT NULL,
        timestamp           TEXT    NOT NULL
      );

      CREATE INDEX idx_student_results_project_run
        ON student_results(projectId, runAt);
    `,
  },
];
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add electron/services/schema.ts
git commit -m "feat: add SQLite schema migration definitions"
```

---

## Task 4: Database service (TDD)

**Files:**
- Create: `electron/services/Database.ts`
- Create: `electron/services/Database.test.ts`

- [ ] **Step 1: Write the failing test file**

Create `electron/services/Database.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Database } from './Database';

describe('Database', () => {
  let tmpDir: string;
  let dbPath: string;
  let db: Database;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iae-db-'));
    dbPath = path.join(tmpDir, 'test.db');
    db = new Database(dbPath);
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('creates the database file on construction', () => {
    expect(fs.existsSync(dbPath)).toBe(true);
  });

  it('creates the schema_migrations table', () => {
    const row = db.raw
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'",
      )
      .get();
    expect(row).toBeDefined();
  });

  it('applies migration 1 (configurations, projects, student_results)', () => {
    const tables = db.raw
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as Array<{ name: string }>;
    const names = tables.map((t) => t.name);
    expect(names).toContain('configurations');
    expect(names).toContain('projects');
    expect(names).toContain('student_results');
  });

  it('records each applied migration in schema_migrations', () => {
    const versions = (
      db.raw
        .prepare('SELECT version FROM schema_migrations ORDER BY version')
        .all() as Array<{ version: number }>
    ).map((r) => r.version);
    expect(versions).toEqual([1]);
  });

  it('is idempotent: re-opening the DB does not re-run migrations', () => {
    const firstCount = (
      db.raw.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get() as {
        n: number;
      }
    ).n;
    db.close();

    const db2 = new Database(dbPath);
    const secondCount = (
      db2.raw.prepare('SELECT COUNT(*) AS n FROM schema_migrations').get() as {
        n: number;
      }
    ).n;
    db2.close();

    expect(secondCount).toBe(firstCount);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test`
Expected: `Cannot find module './Database'` errors. The test file references a non-existent module.

- [ ] **Step 3: Implement the Database service**

Create `electron/services/Database.ts`:

```ts
import BetterSqlite3 from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { MIGRATIONS, SCHEMA_MIGRATIONS_TABLE_SQL } from './schema';

/**
 * Database — owns the single better-sqlite3 connection for the IAE app.
 *
 * Constructed once in electron/main.ts and passed by reference to every
 * service that needs to read or write persisted state. Closes on quit.
 *
 * On construction:
 *   1. Ensures the parent directory of dbPath exists.
 *   2. Opens the connection.
 *   3. Sets pragmas: WAL journaling, foreign_keys = ON.
 *   4. Runs every pending migration inside one transaction per migration.
 */
export class Database {
  private db: BetterSqlite3.Database;

  constructor(dbPath: string) {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    this.db = new BetterSqlite3(dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.runMigrations();
  }

  /** Direct access to the connection for service-layer prepared statements. */
  get raw(): BetterSqlite3.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }

  private runMigrations(): void {
    this.db.exec(SCHEMA_MIGRATIONS_TABLE_SQL);

    const appliedVersions = new Set<number>(
      (
        this.db
          .prepare('SELECT version FROM schema_migrations')
          .all() as Array<{ version: number }>
      ).map((row) => row.version),
    );

    const recordVersion = this.db.prepare(
      'INSERT INTO schema_migrations (version, appliedAt) VALUES (?, ?)',
    );

    for (const migration of MIGRATIONS) {
      if (appliedVersions.has(migration.version)) continue;

      const apply = this.db.transaction(() => {
        this.db.exec(migration.up);
        recordVersion.run(migration.version, new Date().toISOString());
      });
      apply();
    }
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test`
Expected: `Test Files  1 passed (1)` and `Tests  5 passed (5)`.

- [ ] **Step 5: Commit**

```bash
git add electron/services/Database.ts electron/services/Database.test.ts
git commit -m "feat: add Database service with migrations"
```

---

## Task 5: Rewrite ConfigService scaffold for SQL

**Files:**
- Modify: `electron/services/ConfigService.ts` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Overwrite `electron/services/ConfigService.ts`:

```ts
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import type { Configuration } from '@shared/types';
import type { Database } from './Database';

/**
 * ConfigService - Task 4 [R3][R4][R5]
 *
 * CRUD for language configurations against the SQLite `configurations`
 * table. The DB is the source of truth.
 *
 * R5 sharing format: a single configuration row is round-trippable to a
 * standalone .json file. JSON is used ONLY for sharing — not as storage.
 *
 * Table schema (see electron/services/schema.ts, migration 1):
 *   id                  TEXT PRIMARY KEY
 *   name                TEXT NOT NULL
 *   language            TEXT NOT NULL
 *   compileCommand      TEXT NULL
 *   compileArgs         TEXT NULL
 *   runCommand          TEXT NOT NULL
 *   runArgs             TEXT NULL
 *   sourceFileExpected  TEXT NOT NULL
 *   createdAt           TEXT NOT NULL
 *   updatedAt           TEXT NOT NULL
 */
export class ConfigService {
  constructor(private database: Database) {}

  /**
   * TODO [R4]: SELECT id, name, language, compileCommand, compileArgs,
   *   runCommand, runArgs, sourceFileExpected, createdAt, updatedAt
   *   FROM configurations
   *   ORDER BY name COLLATE NOCASE ASC;
   * Map each row to Configuration: NULL columns become `undefined`
   * for the optional fields (compileCommand, compileArgs, runArgs).
   */
  async getAll(): Promise<Configuration[]> {
    void this.database;
    throw new Error('Not implemented: ConfigService.getAll');
  }

  /**
   * TODO [R4]: SELECT * FROM configurations WHERE id = ?
   * Return null if no row matches.
   */
  async getById(_id: string): Promise<Configuration | null> {
    throw new Error('Not implemented: ConfigService.getById');
  }

  /**
   * TODO [R4]: generate a fresh uuid + ISO timestamps (createdAt = updatedAt = now);
   *   INSERT INTO configurations (id, name, language, compileCommand, compileArgs,
   *     runCommand, runArgs, sourceFileExpected, createdAt, updatedAt)
   *   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
   * Return the persisted Configuration.
   */
  async create(_data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Configuration> {
    void uuidv4;
    throw new Error('Not implemented: ConfigService.create');
  }

  /**
   * TODO [R4]: load existing row; merge supplied fields onto it; bump updatedAt;
   *   UPDATE configurations SET name = ?, language = ?, ... , updatedAt = ?
   *   WHERE id = ?;
   * Throw if rowsChanged === 0.
   */
  async update(_id: string, _data: Partial<Configuration>): Promise<Configuration> {
    throw new Error('Not implemented: ConfigService.update');
  }

  /**
   * TODO [R4]: DELETE FROM configurations WHERE id = ?;
   * No-op if no row was deleted (rowsChanged === 0).
   * Snapshotted projects retain the snapshot in projects.configurationSnapshot.
   */
  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: ConfigService.delete');
  }

  /**
   * R5 sharing — JSON IN.
   *
   * Read a .json file produced by `export()` (or hand-authored), validate
   * the shape, regenerate the id (so importing the same file twice on the
   * same machine produces two distinct rows), and INSERT.
   */
  async import(filePath: string): Promise<Configuration> {
    const raw = await fs.readFile(filePath, 'utf-8');
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      throw new Error(
        `Invalid JSON in configuration file: ${(err as Error).message}`,
      );
    }
    const validated = validateConfigurationShape(parsed);

    const now = new Date().toISOString();
    const id = uuidv4();

    this.database.raw
      .prepare(
        `INSERT INTO configurations (
           id, name, language, compileCommand, compileArgs,
           runCommand, runArgs, sourceFileExpected, createdAt, updatedAt
         ) VALUES (
           @id, @name, @language, @compileCommand, @compileArgs,
           @runCommand, @runArgs, @sourceFileExpected, @createdAt, @updatedAt
         )`,
      )
      .run({
        id,
        name: validated.name,
        language: validated.language,
        compileCommand: validated.compileCommand ?? null,
        compileArgs: validated.compileArgs ?? null,
        runCommand: validated.runCommand,
        runArgs: validated.runArgs ?? null,
        sourceFileExpected: validated.sourceFileExpected,
        createdAt: now,
        updatedAt: now,
      });

    return {
      id,
      name: validated.name,
      language: validated.language,
      compileCommand: validated.compileCommand,
      compileArgs: validated.compileArgs,
      runCommand: validated.runCommand,
      runArgs: validated.runArgs,
      sourceFileExpected: validated.sourceFileExpected,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * R5 sharing — JSON OUT.
   *
   * SELECT the row, write a JSON file at targetPath. The exported file is
   * a valid input to import() on any other machine.
   *
   * Note: the exported id and timestamps are informational only — import()
   * regenerates the id and rewrites the timestamps.
   */
  async export(id: string, targetPath: string): Promise<void> {
    const row = this.database.raw
      .prepare(
        `SELECT id, name, language, compileCommand, compileArgs,
                runCommand, runArgs, sourceFileExpected, createdAt, updatedAt
         FROM configurations WHERE id = ?`,
      )
      .get(id) as Configuration | undefined;

    if (!row) {
      throw new Error(`Configuration not found: ${id}`);
    }

    const exported: Configuration = {
      id: row.id,
      name: row.name,
      language: row.language,
      compileCommand: row.compileCommand ?? undefined,
      compileArgs: row.compileArgs ?? undefined,
      runCommand: row.runCommand,
      runArgs: row.runArgs ?? undefined,
      sourceFileExpected: row.sourceFileExpected,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    await fs.writeFile(targetPath, JSON.stringify(exported, null, 2), 'utf-8');
  }
}

/**
 * Defensive shape check for imported JSON. We do not trust the file on
 * disk — a missing required field must produce a clear error rather than
 * a SQLite NOT NULL constraint violation later.
 */
function validateConfigurationShape(value: unknown): Configuration {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Imported configuration is not a JSON object');
  }
  const v = value as Record<string, unknown>;

  for (const field of ['name', 'language', 'runCommand', 'sourceFileExpected'] as const) {
    if (typeof v[field] !== 'string' || v[field] === '') {
      throw new Error(`Imported configuration missing required field: ${field}`);
    }
  }

  return {
    id: typeof v.id === 'string' ? v.id : '',
    name: v.name as string,
    language: v.language as string,
    compileCommand:
      typeof v.compileCommand === 'string' ? v.compileCommand : undefined,
    compileArgs: typeof v.compileArgs === 'string' ? v.compileArgs : undefined,
    runCommand: v.runCommand as string,
    runArgs: typeof v.runArgs === 'string' ? v.runArgs : undefined,
    sourceFileExpected: v.sourceFileExpected as string,
    createdAt: typeof v.createdAt === 'string' ? v.createdAt : '',
    updatedAt: typeof v.updatedAt === 'string' ? v.updatedAt : '',
  };
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add electron/services/ConfigService.ts
git commit -m "refactor: rewrite ConfigService against SQLite (TODO bodies + JSON share)"
```

---

## Task 6: Tests for ConfigService JSON round-trip

**Files:**
- Create: `electron/services/ConfigService.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `electron/services/ConfigService.test.ts`:

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Database } from './Database';
import { ConfigService } from './ConfigService';

describe('ConfigService — JSON share round-trip', () => {
  let tmpDir: string;
  let db: Database;
  let svc: ConfigService;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iae-cfg-'));
    db = new Database(path.join(tmpDir, 'test.db'));
    svc = new ConfigService(db);

    // Seed one configuration directly via SQL (create() is still TODO).
    db.raw
      .prepare(
        `INSERT INTO configurations (
           id, name, language, compileCommand, compileArgs,
           runCommand, runArgs, sourceFileExpected, createdAt, updatedAt
         ) VALUES (
           'cfg-c', 'C Programming', 'C', 'gcc',
           '{{sourceFile}} -o {{outputName}}',
           './{{outputName}}', '{{args}}', 'main.c',
           '2026-05-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'
         )`,
      )
      .run();
  });

  afterEach(() => {
    db.close();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it('exports a configuration to a JSON file', async () => {
    const target = path.join(tmpDir, 'c-config.json');
    await svc.export('cfg-c', target);

    expect(fs.existsSync(target)).toBe(true);
    const written = JSON.parse(fs.readFileSync(target, 'utf-8'));
    expect(written.name).toBe('C Programming');
    expect(written.language).toBe('C');
    expect(written.compileCommand).toBe('gcc');
    expect(written.runCommand).toBe('./{{outputName}}');
    expect(written.sourceFileExpected).toBe('main.c');
  });

  it('throws when exporting a missing configuration', async () => {
    const target = path.join(tmpDir, 'missing.json');
    await expect(svc.export('does-not-exist', target)).rejects.toThrow(
      /Configuration not found/,
    );
  });

  it('imports a JSON file into a new row with a fresh id', async () => {
    const sourceFile = path.join(tmpDir, 'imported.json');
    fs.writeFileSync(
      sourceFile,
      JSON.stringify(
        {
          id: 'this-id-will-be-discarded',
          name: 'Python 3',
          language: 'Python',
          runCommand: 'python',
          runArgs: '{{sourceFile}} {{args}}',
          sourceFileExpected: 'main.py',
          createdAt: '2026-04-01T00:00:00.000Z',
          updatedAt: '2026-04-01T00:00:00.000Z',
        },
        null,
        2,
      ),
      'utf-8',
    );

    const created = await svc.import(sourceFile);

    expect(created.id).not.toBe('this-id-will-be-discarded');
    expect(created.name).toBe('Python 3');
    expect(created.runCommand).toBe('python');
    expect(created.compileCommand).toBeUndefined();

    const inDb = db.raw
      .prepare('SELECT * FROM configurations WHERE id = ?')
      .get(created.id) as { name: string; runCommand: string };
    expect(inDb.name).toBe('Python 3');
    expect(inDb.runCommand).toBe('python');
  });

  it('rejects an import file with no name', async () => {
    const sourceFile = path.join(tmpDir, 'broken.json');
    fs.writeFileSync(
      sourceFile,
      JSON.stringify({ language: 'C', runCommand: 'gcc', sourceFileExpected: 'main.c' }),
      'utf-8',
    );

    await expect(svc.import(sourceFile)).rejects.toThrow(
      /missing required field: name/,
    );
  });

  it('rejects a malformed JSON import file', async () => {
    const sourceFile = path.join(tmpDir, 'malformed.json');
    fs.writeFileSync(sourceFile, '{ not valid json', 'utf-8');

    await expect(svc.import(sourceFile)).rejects.toThrow(/Invalid JSON/);
  });

  it('round-trips: export → import yields the same logical configuration', async () => {
    const target = path.join(tmpDir, 'roundtrip.json');
    await svc.export('cfg-c', target);

    const imported = await svc.import(target);

    expect(imported.name).toBe('C Programming');
    expect(imported.language).toBe('C');
    expect(imported.compileCommand).toBe('gcc');
    expect(imported.runCommand).toBe('./{{outputName}}');
    expect(imported.id).not.toBe('cfg-c');
  });
});
```

- [ ] **Step 2: Run the tests**

Run: `npm test`
Expected: `Tests  11 passed (11)` (5 from Database.test.ts + 6 from ConfigService.test.ts).

- [ ] **Step 3: Commit**

```bash
git add electron/services/ConfigService.test.ts
git commit -m "test: ConfigService JSON share round-trip"
```

---

## Task 7: Rewrite ProjectService scaffold for SQL

**Files:**
- Modify: `electron/services/ProjectService.ts` (full rewrite)

- [ ] **Step 1: Replace the file contents**

Overwrite `electron/services/ProjectService.ts`:

```ts
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type {
  Project,
  ProjectResults,
  DashboardStats,
  Configuration,
  DataSource,
} from '@shared/types';
import type { Database } from './Database';
import { FileService } from './FileService';

/**
 * ProjectService - Task 5 [R3][R10]
 *
 * Project lifecycle management against the SQLite `projects` table.
 *
 * Schema (see electron/services/schema.ts, migration 1):
 *   id                       TEXT PK
 *   name                     TEXT NOT NULL
 *   configurationId          TEXT NOT NULL
 *   configurationSnapshot    TEXT NOT NULL  -- JSON.stringify of Configuration
 *   inputType                TEXT NOT NULL  -- 'text' | 'file'
 *   inputValue               TEXT NOT NULL  -- text content OR file path
 *   expectedOutputType       TEXT NOT NULL  -- 'text' | 'file'
 *   expectedOutputValue      TEXT NOT NULL  -- text content OR file path
 *   submissionsDir           TEXT NOT NULL  -- on-disk path to extracted submissions
 *   createdAt                TEXT NOT NULL
 *   updatedAt                TEXT NOT NULL
 *
 * `submissionsDir` lives on the filesystem (extracted ZIP contents are
 * source files, NOT row data). Layout:
 *   projectsRoot/<projectId>/submissions/<studentId>/<source files>
 */
export class ProjectService {
  private fileService = new FileService();

  constructor(
    private database: Database,
    private projectsRoot: string,
  ) {}

  /**
   * TODO [R10]: SELECT * FROM projects ORDER BY updatedAt DESC.
   * For each row, JSON.parse(configurationSnapshot) into the configuration field
   * and rebuild input/expectedOutput as DataSource discriminated unions:
   *   { type: row.inputType, value/path: row.inputValue }.
   */
  async getAll(): Promise<Project[]> {
    void this.database;
    void this.fileService;
    throw new Error('Not implemented: ProjectService.getAll');
  }

  /**
   * TODO [R10]: SELECT * FROM projects WHERE id = ?
   * Return null if no row.
   * Same row -> Project mapping as getAll.
   */
  async getById(_id: string): Promise<Project | null> {
    throw new Error('Not implemented: ProjectService.getById');
  }

  /**
   * TODO [R3]:
   *   1. Load the live Configuration via this.loadConfiguration(configurationId).
   *      Throw if not found.
   *   2. Generate uuid -> projectId.
   *   3. Compute submissionsDir = path.join(projectsRoot, projectId, 'submissions').
   *   4. mkdir -p submissionsDir (FileService.ensureDir).
   *   5. INSERT INTO projects (...):
   *      - configurationSnapshot = JSON.stringify(config)
   *      - inputType / inputValue from data.input
   *      - expectedOutputType / expectedOutputValue from data.expectedOutput
   *      - createdAt = updatedAt = now
   *   6. Return the persisted Project (re-construct via getById or build inline).
   */
  async create(_data: {
    name: string;
    configurationId: string;
    input: DataSource;
    expectedOutput: DataSource;
  }): Promise<Project> {
    void path;
    void uuidv4;
    void this.projectsRoot;
    throw new Error('Not implemented: ProjectService.create');
  }

  /**
   * TODO [R10]: shallow-merge data onto the existing row.
   *   Allowed fields: name, input, expectedOutput, submissionsDir.
   *   Disallow: id, configurationId, configuration (snapshot is immutable).
   *   UPDATE projects SET ... , updatedAt = ? WHERE id = ?.
   */
  async update(_id: string, _data: Partial<Project>): Promise<Project> {
    throw new Error('Not implemented: ProjectService.update');
  }

  /**
   * TODO: DELETE FROM projects WHERE id = ?
   *   ON DELETE CASCADE drops the student_results rows automatically.
   *   Then rm -rf the on-disk submissions folder via FileService.deleteDir.
   */
  async delete(_id: string): Promise<void> {
    throw new Error('Not implemented: ProjectService.delete');
  }

  /**
   * TODO [R9][R10]: load the latest run for the project.
   *   1. SELECT MAX(runAt) AS latest FROM student_results WHERE projectId = ?
   *      Return null if latest IS NULL (no run yet).
   *   2. SELECT * FROM student_results
   *      WHERE projectId = ? AND runAt = ? ORDER BY studentId.
   *   3. Map rows to StudentResult (INTEGER 0/1 -> boolean; NULL -> undefined).
   *   4. Return ProjectResults: { projectId, runAt: latest, students: [...] }.
   */
  async getResults(_id: string): Promise<ProjectResults | null> {
    throw new Error('Not implemented: ProjectService.getResults');
  }

  /**
   * TODO: aggregate stats across every project for the Dashboard.
   *   - totalProjects: SELECT COUNT(*) FROM projects
   *   - totalStudents: SELECT COUNT(DISTINCT projectId || ':' || studentId)
   *                    FROM student_results r WHERE runAt = (latest per project)
   *   - overallPassRate: SUM(status='pass') / COUNT(*) over latest runs
   *   - recentProjects: top 5 by updatedAt with derived status
   *       (completed | in-progress | pending) and pass rate from latest run.
   */
  async getStatistics(): Promise<DashboardStats> {
    throw new Error('Not implemented: ProjectService.getStatistics');
  }

  /**
   * TODO: SELECT * FROM configurations WHERE id = ?.
   *   Throw a clear error if missing — used by create() to snapshot the config.
   */
  private async loadConfiguration(_configurationId: string): Promise<Configuration> {
    throw new Error('Not implemented: ProjectService.loadConfiguration');
  }
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add electron/services/ProjectService.ts
git commit -m "refactor: rewrite ProjectService against SQLite (TODO bodies)"
```

---

## Task 8: Rewrite ExecutionService scaffold for SQL writes

**Files:**
- Modify: `electron/services/ExecutionService.ts`

- [ ] **Step 1: Update the imports and class shape**

Open `electron/services/ExecutionService.ts`. Replace the imports section (lines 1–8) with:

```ts
import { execFile } from 'child_process';
import { promisify } from 'util';
import type {
  Project,
  ProjectResults,
  StudentResult,
  DataSource,
} from '@shared/types';
import type { Database } from './Database';
import { FileService } from './FileService';

const execFileAsync = promisify(execFile);
```

- [ ] **Step 2: Add a constructor that takes the Database**

Replace the existing class declaration line (`export class ExecutionService {` and the immediate `private fileService = new FileService();` line) with:

```ts
export class ExecutionService {
  private fileService = new FileService();

  constructor(private database: Database) {}
```

- [ ] **Step 3: Update the `runAll` doc-comment to describe SQL writes**

Find the `runAll` method's JSDoc block. Replace its body (the comment text) with:

```ts
  /**
   * runAll - process every student, sequentially, persisting per-student
   * results to the SQLite `student_results` table.
   *
   * TODO [R7][R8]:
   *   1. const runAt = new Date().toISOString();
   *   2. Wrap the whole batch in a transaction:
   *        DELETE FROM student_results WHERE projectId = ?;
   *        (so the project always reflects the LATEST run only — matches
   *         the original results.json overwrite semantics)
   *   3. List submissions: this.fileService.listDirs(project.submissionsDir).
   *      Each entry is a studentId folder.
   *   4. For each student:
   *        const result = await this.runStudent(studentDir, project);
   *        result.timestamp = new Date().toISOString();
   *        INSERT INTO student_results (projectId, runAt, studentId,
   *          zipExtracted, sourceFound, compiled, compileOutput, compileError,
   *          executed, executionOutput, executionError, executionTimedOut,
   *          outputMatched, expectedOutput, actualOutput, status, timestamp)
   *        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
   *      Booleans are stored as INTEGER (0/1).
   *      Persist EACH student immediately (commit per row) so a process
   *      crash mid-run does not lose previously-completed students.
   *   5. Return { projectId: project.id, runAt, students: [...] }.
   */
```

- [ ] **Step 4: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add electron/services/ExecutionService.ts
git commit -m "refactor: ExecutionService takes Database, persists results to SQL"
```

---

## Task 9: Wire Database into IPC handlers

**Files:**
- Modify: `electron/ipc/config.ipc.ts`
- Modify: `electron/ipc/project.ipc.ts`
- Modify: `electron/ipc/execution.ipc.ts`
- Modify: `electron/main.ts`

- [ ] **Step 1: Update `config.ipc.ts` signature**

Replace the contents of `electron/ipc/config.ipc.ts`:

```ts
import { IpcMain } from 'electron';
import { ConfigService } from '../services/ConfigService';
import type { Database } from '../services/Database';

/**
 * Configuration IPC handlers - Task 4 [R3][R4][R5]
 * (Channel list unchanged — see shared/types.ts IpcChannels.)
 */
export function registerConfigIpc(ipcMain: IpcMain, database: Database): void {
  const configService = new ConfigService(database);

  ipcMain.handle('config:getAll', async () => configService.getAll());
  ipcMain.handle('config:getById', async (_e, id: string) => configService.getById(id));
  ipcMain.handle('config:create', async (_e, data) => configService.create(data));
  ipcMain.handle('config:update', async (_e, id: string, data) => configService.update(id, data));
  ipcMain.handle('config:delete', async (_e, id: string) => configService.delete(id));
  ipcMain.handle('config:import', async (_e, filePath: string) => configService.import(filePath));
  ipcMain.handle('config:export', async (_e, id: string, targetPath: string) =>
    configService.export(id, targetPath),
  );
}
```

- [ ] **Step 2: Update `project.ipc.ts` signature**

Replace the contents of `electron/ipc/project.ipc.ts`:

```ts
import { IpcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';
import type { Database } from '../services/Database';

/**
 * Project IPC handlers - Task 5 [R3][R9][R10]
 */
export function registerProjectIpc(
  ipcMain: IpcMain,
  database: Database,
  projectsRoot: string,
): void {
  const projectService = new ProjectService(database, projectsRoot);

  ipcMain.handle('project:getAll', async () => projectService.getAll());
  ipcMain.handle('project:getById', async (_e, id: string) => projectService.getById(id));
  ipcMain.handle('project:create', async (_e, data) => projectService.create(data));
  ipcMain.handle('project:update', async (_e, id: string, data) => projectService.update(id, data));
  ipcMain.handle('project:delete', async (_e, id: string) => projectService.delete(id));
  ipcMain.handle('project:getResults', async (_e, id: string) => projectService.getResults(id));
  ipcMain.handle('project:getStatistics', async () => projectService.getStatistics());
}
```

- [ ] **Step 3: Update `execution.ipc.ts` signature**

Replace the contents of `electron/ipc/execution.ipc.ts`:

```ts
import { IpcMain } from 'electron';
import { ProjectService } from '../services/ProjectService';
import { ZipService } from '../services/ZipService';
import { ExecutionService } from '../services/ExecutionService';
import type { Database } from '../services/Database';

/**
 * Execution IPC handlers - Task 8 [R6][R7][R8]
 */
export function registerExecutionIpc(
  ipcMain: IpcMain,
  database: Database,
  projectsRoot: string,
): void {
  const projectService = new ProjectService(database, projectsRoot);
  const zipService = new ZipService();
  const executionService = new ExecutionService(database);

  ipcMain.handle('execution:importZips', async (_e, projectId: string, dirPath: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.extractAll(dirPath, project.submissionsDir);
  });

  ipcMain.handle('execution:run', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.runAll(project);
  });

  ipcMain.handle('execution:cleanup', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return executionService.cleanupArtifacts(project);
  });

  ipcMain.handle('execution:getStudents', async (_e, projectId: string) => {
    const project = await projectService.getById(projectId);
    if (!project) throw new Error(`Project not found: ${projectId}`);
    return zipService.listStudents(project.submissionsDir);
  });
}
```

- [ ] **Step 4: Wire the Database into `electron/main.ts`**

Open `electron/main.ts`. Replace the import block at the top (the existing `import { FileService } from './services/FileService';` line and the `import { registerXxxIpc }` lines) with:

```ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { registerConfigIpc } from './ipc/config.ipc';
import { registerProjectIpc } from './ipc/project.ipc';
import { registerExecutionIpc } from './ipc/execution.ipc';
import { FileService } from './services/FileService';
import { Database } from './services/Database';
```

Then replace the body of `createWindow` from the `// Ensure app data directories exist` block through the `// Register IPC handlers` block (currently lines 15–40) with:

```ts
  // Ensure app data directories exist (submissions still live on disk)
  const fileService = new FileService();
  const projectsRoot = path.join(APP_DATA_DIR, 'projects');
  await fileService.ensureDir(projectsRoot);

  // Open the SQLite database (creates iae.db + runs migrations on first launch)
  const database = new Database(path.join(APP_DATA_DIR, 'iae.db'));
  app.on('before-quit', () => database.close());

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'IAE - Integrated Assignment Environment',
    backgroundColor: '#09090b', // zinc-950
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(currentDirPath, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Register IPC handlers
  registerConfigIpc(ipcMain, database);
  registerProjectIpc(ipcMain, database, projectsRoot);
  registerExecutionIpc(ipcMain, database, projectsRoot);
```

- [ ] **Step 5: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Verify all tests still pass**

Run: `npm test`
Expected: `Tests  11 passed (11)`.

- [ ] **Step 7: Commit**

```bash
git add electron/ipc/config.ipc.ts electron/ipc/project.ipc.ts electron/ipc/execution.ipc.ts electron/main.ts
git commit -m "feat: open SQLite database in main process and pass to IPC handlers"
```

---

## Task 10: Update Configurations page with Import/Export buttons

**Files:**
- Modify: `src/pages/Configurations.tsx`

- [ ] **Step 1: Replace the page contents**

Overwrite `src/pages/Configurations.tsx`:

```tsx
import { useCallback } from 'react';
import { ipc } from '@/lib/ipc';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * Configurations Page - Task 12 [R4][R5]
 *
 * Lists every saved language configuration and lets the lecturer create,
 * edit, delete, import, or export them.
 *
 * Storage: rows in the SQLite `configurations` table.
 * Sharing: JSON files (R5) — import reads a .json into a new row,
 *          export writes a row to a .json file.
 *
 * UI inventory (see iae-design.md "UI Design > Configurations"):
 *   - Header with "New Configuration" primary button             [R4]
 *   - Toolbar: "Import JSON" + "Export selected" buttons          [R5]
 *   - Card grid (or table) of every Configuration showing:
 *       name, language, sourceFileExpected, createdAt
 *   - Per-row actions: Edit [R4], Export [R5], Delete [R4]
 *   - Create / Edit modal with fields:
 *       name, language, compileCommand?, compileArgs?, runCommand,
 *       runArgs?, sourceFileExpected
 *     and a hint listing the available template variables:
 *       {{sourceFile}}, {{outputName}}, {{args}}
 *   - Confirmation modal on Delete
 *     (warn that snapshotted projects retain their internal copy of the config)
 */
export default function Configurations() {
  // TODO [R4]: useState<Configuration[]>([]) + useEffect(loadAll)
  // TODO [R4]: modal state for create/edit (selectedConfigId, formValues)
  // TODO [R4]: render the grid/table with per-row Edit/Export/Delete
  // TODO [R4]: render the create/edit modal with the template-variable hint
  // TODO [R4]: render the delete-confirmation modal

  // R5: Import a configuration from a .json file selected by the user.
  // The DB row is created with a fresh id; the source file is unchanged.
  const handleImport = useCallback(async () => {
    const filePath = await ipc.dialog.openFile([
      { name: 'IAE Configuration', extensions: ['json'] },
    ]);
    if (!filePath) return;
    await ipc.config.import(filePath);
    // TODO [R4]: reload the configuration list
  }, []);

  // R5: Export the selected configuration to a .json file.
  // TODO [R5]: replace SELECTED_CONFIG_ID with state from the row selection above.
  const handleExport = useCallback(async () => {
    const SELECTED_CONFIG_ID: string | null = null;
    if (!SELECTED_CONFIG_ID) {
      // TODO [R5]: show a "select a configuration first" message
      return;
    }
    const targetPath = await ipc.dialog.saveFile('configuration.json', [
      { name: 'IAE Configuration', extensions: ['json'] },
    ]);
    if (!targetPath) return;
    await ipc.config.export(SELECTED_CONFIG_ID, targetPath);
  }, []);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurations</h1>
          <p className="text-muted-foreground">
            Compile + run profiles, stored in SQLite. Use Import/Export to
            share a profile as a .json file with another machine.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleImport}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Import JSON
          </button>
          <button
            type="button"
            onClick={handleExport}
            className={cn(buttonVariants({ variant: 'outline' }))}
          >
            Export selected
          </button>
          {/* TODO [R4]: render the "New Configuration" primary button here */}
        </div>
      </header>

      <p className="text-muted-foreground">
        Configuration list/edit UI is scaffolded. See the TODOs at the top of
        this file (Task 12 in the implementation plan) for the work remaining.
      </p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript still compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/Configurations.tsx
git commit -m "feat(ui): wire Configurations Import/Export JSON buttons"
```

---

## Task 11: electron-builder asar unpack for native module

**Files:**
- Modify: `electron-builder.yml`

- [ ] **Step 1: Add `asarUnpack` for the native binding**

`better-sqlite3.node` is a compiled native binary; it cannot be loaded from inside an asar archive. Tell electron-builder to unpack it.

Replace the contents of `electron-builder.yml`:

```yaml
appId: com.ce316.iae
productName: "Integrated Assignment Environment"
directories:
  buildResources: build
  output: release
files:
  - dist
  - dist-electron
  - node_modules/better-sqlite3/**/*
asarUnpack:
  - "**/node_modules/better-sqlite3/**"
win:
  target:
    - target: nsis
      arch:
        - x64
  icon: build/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: "IAE"
```

- [ ] **Step 2: Commit**

```bash
git add electron-builder.yml
git commit -m "build: asarUnpack better-sqlite3 native binding"
```

---

## Task 12: Manual smoke test of the wired-up app

This task has no code changes — it verifies the previous tasks integrate.

- [ ] **Step 1: Build the renderer and start the dev server**

```bash
npm run dev
```

Expected: vite dev server boots; Electron window opens with the IAE shell.

- [ ] **Step 2: Verify the SQLite file was created**

In a separate terminal:

```bash
ls -la ~/.iae/
```

Expected output should include `iae.db` (and a `iae.db-wal` / `iae.db-shm` from WAL mode is fine if present).

- [ ] **Step 3: Verify the schema is in place**

```bash
sqlite3 ~/.iae/iae.db ".tables"
```

Expected output: `configurations    projects          schema_migrations  student_results`

- [ ] **Step 4: Verify the migration was recorded**

```bash
sqlite3 ~/.iae/iae.db "SELECT version, appliedAt FROM schema_migrations;"
```

Expected: one row, version `1`, with a recent ISO timestamp.

- [ ] **Step 5: Quit the app**

Close the Electron window. Confirm the terminal exits cleanly with no native-module errors in the console.

- [ ] **Step 6: Commit (no-op, but mark progress)**

There are no file changes — skip the commit. If anything broke during the smoke test, this is where you go back and fix it.

---

## Task 13: Documentation addendum

**Files:**
- Create: `docs/superpowers/specs/2026-05-01-sqlite-storage-addendum.md`

- [ ] **Step 1: Write the addendum**

Create `docs/superpowers/specs/2026-05-01-sqlite-storage-addendum.md`:

````markdown
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
| Extracted submissions | `~/.iae/projects/<id>/submissions/<sid>/` | unchanged — filesystem |
| R5 sharing | file copy of the JSON config | DB row → JSON file → DB row on the other machine |

The DB lives at `~/.iae/iae.db`. Schema and migrations are defined in `electron/services/schema.ts`.

## Why

- **R5 still trivially satisfied** — one row ↔ one JSON file on disk; no SQL server in sight.
- **Cross-project queries become cheap** — Dashboard stats are a single `SELECT` instead of scanning every project folder.
- **Atomic results writes** — a `student_results` insert is one transaction; partial-run state is consistent if the process crashes mid-batch.
- **Single file = easy backup** — copy `iae.db` to back up everything except the extracted source-file submissions.

## What stays on disk

Compiled binaries, extracted source files, and any artifacts from the per-student pipeline live under `~/.iae/projects/<projectId>/submissions/<studentId>/`. The `projects.submissionsDir` column stores the path. Putting student source code in SQLite is the wrong shape — the compiler/interpreter wants files on disk, and the DB row count would balloon for no benefit.

## R5 sharing format

A `.json` file produced by `ConfigService.export(id, targetPath)` contains the full `Configuration` shape from `shared/types.ts`. `ConfigService.import(filePath)` reads, validates, regenerates the id, rewrites the timestamps, and inserts a fresh row.

The exported file is portable across machines. Bringing the same `.json` back into the same database produces a second row (different id) — this is by design; we never silently overwrite an existing configuration on import.

## Migration story

This is greenfield. There are no existing JSON files to migrate. The Database service runs migration version 1 on first app launch and is idempotent on subsequent launches.
````

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-05-01-sqlite-storage-addendum.md
git commit -m "docs: add SQLite storage addendum"
```

---

## Self-Review

**Spec coverage check** (against the brief in the prompt):

| User-stated item | Task |
|---|---|
| (1) better-sqlite3 dep + native rebuild for Electron | Task 2 |
| (2) Database service with migrations table + schema for configurations/projects/student_results | Tasks 3, 4 |
| (3) Rewrite ConfigService and ProjectService against SQL (TODO bodies, schema in comments) | Tasks 5, 7 |
| (4) ExecutionService writes one row per student per run to student_results | Task 8 |
| (5) JSON-config import/export round-trip implementation | Tasks 5, 6 (real implementation + tests) |
| (6) shared/types.ts updates only as needed | (Skipped — no changes needed; type surface already correct.) |
| (7) UI wiring on the Configurations page for Import/Export JSON | Task 10 |
| (8) Packaging considerations (electron-builder native unpacking) | Task 11 |

Plus: Task 1 (vitest setup), Task 9 (IPC + main.ts wiring), Task 12 (smoke test), Task 13 (documentation addendum).

**Placeholder scan:** every step has either a code block, a precise file/line target, or an exact shell command with expected output. No "TBD"s, no "implement appropriate error handling".

**Type consistency check:**
- `Database` constructor signature: `(dbPath: string)` — used in Task 4 (definition), Task 9 (`new Database(path.join(APP_DATA_DIR, 'iae.db'))`).
- `ConfigService` constructor: `(database: Database)` — defined in Task 5, used in Task 9 (`new ConfigService(database)`).
- `ProjectService` constructor: `(database: Database, projectsRoot: string)` — defined in Task 7, used in Task 9.
- `ExecutionService` constructor: `(database: Database)` — defined in Task 8, used in Task 9 (`new ExecutionService(database)`).
- `registerConfigIpc(ipcMain, database)`: defined Task 9 step 1, called Task 9 step 4.
- `registerProjectIpc(ipcMain, database, projectsRoot)`: defined Task 9 step 2, called Task 9 step 4.
- `registerExecutionIpc(ipcMain, database, projectsRoot)`: defined Task 9 step 3, called Task 9 step 4.
- `MIGRATIONS` and `SCHEMA_MIGRATIONS_TABLE_SQL`: defined Task 3, consumed Task 4.

All consistent.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-01-sqlite-migration.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
