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
 * standalone .json file. JSON is used ONLY for sharing - not as storage.
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
   * R5 sharing - JSON IN.
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
   * R5 sharing - JSON OUT.
   *
   * SELECT the row, write a JSON file at targetPath. The exported file is
   * a valid input to import() on any other machine.
   *
   * Note: the exported id and timestamps are informational only - import()
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
 * disk - a missing required field must produce a clear error rather than
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
