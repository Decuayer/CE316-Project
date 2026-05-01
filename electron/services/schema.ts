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
