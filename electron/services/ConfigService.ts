import { v4 as uuidv4 } from 'uuid';
import type { Configuration } from '../../shared/types';
import { FileService } from './FileService';
import { DatabaseService } from './DatabaseService';

type ConfigInput = Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * ConfigService
 *
 * Manages execution configurations, handling database CRUD operations
 * as well as importing/exporting configurations to JSON files.
 */
export class ConfigService {
  private fileService = new FileService();

  constructor(private dbService: DatabaseService) {}

  /**
   * Retrieves all configurations from the database, ordered by name.
   */
  async getAll(): Promise<Configuration[]> {
    const db = this.dbService.getDb();
    const stmt = db.prepare('SELECT * FROM configurations ORDER BY name COLLATE NOCASE ASC');
    return stmt.all() as Configuration[];
  }

  /**
   * Retrieves a specific configuration by its ID.
   */
  async getById(id: string): Promise<Configuration | null> {
    const db = this.dbService.getDb();
    const stmt = db.prepare('SELECT * FROM configurations WHERE id = ?');
    const config = stmt.get(id) as Configuration | undefined;
    return config || null;
  }

  /**
   * Creates a new configuration and saves it to the database.
   */
  async create(data: ConfigInput): Promise<Configuration> {
    const clean = this.normalizeAndValidate(data);
    const db = this.dbService.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO configurations (id, name, language, compileCommand, compileArgs, runCommand, runArgs, sourceFileExpected, createdAt, updatedAt)
      VALUES (@id, @name, @language, @compileCommand, @compileArgs, @runCommand, @runArgs, @sourceFileExpected, @createdAt, @updatedAt)
    `);

    stmt.run({
      id,
      name: clean.name,
      language: clean.language,
      compileCommand: clean.compileCommand,
      compileArgs: clean.compileArgs,
      runCommand: clean.runCommand,
      runArgs: clean.runArgs,
      sourceFileExpected: clean.sourceFileExpected,
      createdAt: now,
      updatedAt: now,
    });

    return (await this.getById(id))!;
  }

  /**
   * Updates an existing configuration in the database.
   */
  async update(id: string, data: Partial<Configuration>): Promise<Configuration> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Configuration not found: ${id}`);

    const merged: ConfigInput = {
      name: data.name ?? existing.name,
      language: data.language ?? existing.language,
      compileCommand: data.compileCommand ?? existing.compileCommand,
      compileArgs: data.compileArgs ?? existing.compileArgs,
      runCommand: data.runCommand ?? existing.runCommand,
      runArgs: data.runArgs ?? existing.runArgs,
      sourceFileExpected: data.sourceFileExpected ?? existing.sourceFileExpected,
    };

    const clean = this.normalizeAndValidate(merged);
    const db = this.dbService.getDb();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE configurations
      SET name = @name, language = @language, compileCommand = @compileCommand,
          compileArgs = @compileArgs, runCommand = @runCommand, runArgs = @runArgs,
          sourceFileExpected = @sourceFileExpected, updatedAt = @updatedAt
      WHERE id = @id
    `);

    stmt.run({
      id,
      name: clean.name,
      language: clean.language,
      compileCommand: clean.compileCommand,
      compileArgs: clean.compileArgs,
      runCommand: clean.runCommand,
      runArgs: clean.runArgs,
      sourceFileExpected: clean.sourceFileExpected,
      updatedAt: now,
    });

    return (await this.getById(id))!;
  }

  /**
   * Deletes a configuration. Refuses if any project still references it,
   * surfacing a friendly count instead of the raw FK violation.
   */
  async delete(id: string): Promise<void> {
    const db = this.dbService.getDb();

    const existing = db.prepare('SELECT id FROM configurations WHERE id = ?').get(id);
    if (!existing) throw new Error(`Configuration not found: ${id}`);

    const refs = db
      .prepare('SELECT COUNT(*) AS count FROM projects WHERE configurationId = ?')
      .get(id) as { count: number };

    if (refs.count > 0) {
      const noun = refs.count === 1 ? 'project' : 'projects';
      throw new Error(
        `Cannot delete configuration: it is in use by ${refs.count} ${noun}. ` +
        `Delete the dependent projects first.`,
      );
    }

    db.prepare('DELETE FROM configurations WHERE id = ?').run(id);
  }

  /**
   * Imports a configuration from a JSON file. Validates the shape, strips
   * any foreign id/timestamps from the source file, and routes through
   * `create()` so a fresh id and current timestamps are generated.
   *
   * Surfaces friendly errors for the common FS/JSON failure modes so the
   * renderer can display them inline without leaking ENOENT / SyntaxError
   * jargon to the lecturer.
   */
  async import(filePath: string): Promise<Configuration> {
    let raw: unknown;
    try {
      raw = await this.fileService.readJson<unknown>(filePath);
    } catch (err) {
      if (err instanceof SyntaxError) {
        throw new Error(
          `Could not read configuration file: the file is not valid JSON (${err.message})`,
        );
      }
      const code = (err as NodeJS.ErrnoException).code;
      if (code === 'ENOENT') {
        throw new Error(`Could not read configuration file: file does not exist at ${filePath}`);
      }
      if (code === 'EACCES' || code === 'EPERM') {
        throw new Error(`Could not read configuration file: permission denied for ${filePath}`);
      }
      throw new Error(
        `Could not read configuration file: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    const parsed = this.parseConfigPayload(raw);
    return this.create(parsed);
  }

  /**
   * Asserts that an arbitrary value matches the Configuration shape (modulo
   * id/createdAt/updatedAt, which are regenerated on import). Returns a
   * trimmed input ready to feed to create().
   */
  private parseConfigPayload(raw: unknown): ConfigInput {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new Error('Invalid configuration file: not a configuration object');
    }

    const obj = raw as Record<string, unknown>;

    const assertString = (field: string, value: unknown): string => {
      if (typeof value !== 'string') {
        throw new Error(`Invalid configuration file: ${field} must be a string`);
      }
      return value;
    };

    const assertOptionalString = (field: string, value: unknown): string | undefined => {
      if (value === undefined || value === null) return undefined;
      if (typeof value !== 'string') {
        throw new Error(`Invalid configuration file: ${field} must be a string`);
      }
      return value;
    };

    return {
      name: assertString('name', obj.name),
      language: assertString('language', obj.language),
      compileCommand: assertOptionalString('compileCommand', obj.compileCommand),
      compileArgs: assertOptionalString('compileArgs', obj.compileArgs),
      runCommand: assertString('runCommand', obj.runCommand),
      runArgs: assertOptionalString('runArgs', obj.runArgs),
      sourceFileExpected: assertString('sourceFileExpected', obj.sourceFileExpected),
    };
  }

  /**
   * Exports a specific configuration to a JSON file.
   */
  async export(id: string, targetPath: string): Promise<void> {
    const config = await this.getById(id);
    if (!config) throw new Error(`Configuration not found: ${id}`);
    await this.fileService.writeJson(targetPath, config);
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  /**
   * Trims all string fields and validates required ones. Returns a normalized
   * input where blank/whitespace-only optional fields are coerced to `null`.
   *
   * Throws a single Error listing every missing field so the UI can render it
   * inline without round-tripping.
   */
  private normalizeAndValidate(data: ConfigInput): {
    name: string;
    language: string;
    compileCommand: string | null;
    compileArgs: string | null;
    runCommand: string;
    runArgs: string | null;
    sourceFileExpected: string;
  } {
    const name = (data.name ?? '').trim();
    const language = (data.language ?? '').trim();
    const runCommand = (data.runCommand ?? '').trim();
    const sourceFileExpected = (data.sourceFileExpected ?? '').trim();
    const compileCommand = (data.compileCommand ?? '').trim();
    const compileArgs = (data.compileArgs ?? '').trim();
    const runArgs = (data.runArgs ?? '').trim();

    const missing: string[] = [];
    if (!name) missing.push('name is required');
    if (!language) missing.push('language is required');
    if (!runCommand) missing.push('runCommand is required');
    if (!sourceFileExpected) missing.push('sourceFileExpected is required');

    if (missing.length > 0) {
      throw new Error(`Invalid configuration: ${missing.join('; ')}`);
    }

    return {
      name,
      language,
      compileCommand: compileCommand || null,
      compileArgs: compileArgs || null,
      runCommand,
      runArgs: runArgs || null,
      sourceFileExpected,
    };
  }
}
