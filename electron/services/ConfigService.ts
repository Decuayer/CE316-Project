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
   * Deletes a configuration from the database by its ID.
   * (Task 2 will add FK-aware safe-delete on top of this.)
   */
  async delete(id: string): Promise<void> {
    const db = this.dbService.getDb();
    db.prepare('DELETE FROM configurations WHERE id = ?').run(id);
  }

  /**
   * Imports a configuration from a JSON file and saves it to the database.
   * (Task 3 will harden this with shape validation.)
   */
  async import(filePath: string): Promise<Configuration> {
    const content = await this.fileService.readJson<Configuration>(filePath);
    return this.create({
      name: content.name,
      language: content.language,
      compileCommand: content.compileCommand,
      compileArgs: content.compileArgs,
      runCommand: content.runCommand,
      runArgs: content.runArgs,
      sourceFileExpected: content.sourceFileExpected,
    });
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
