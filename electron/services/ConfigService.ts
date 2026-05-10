import { v4 as uuidv4 } from 'uuid';
import type { Configuration } from '../../shared/types';
import { FileService } from './FileService';
import { DatabaseService } from './DatabaseService';


/**
 * ConfigService
 *
 * Manages execution configurations, handling database CRUD operations
 * as well as importing/exporting configurations to JSON files.
 */
export class ConfigService {
  private fileService = new FileService();

  constructor(private dbService: DatabaseService) { }


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
  async create(data: Omit<Configuration, 'id' | 'createdAt' | 'updatedAt'>): Promise<Configuration> {
    const db = this.dbService.getDb();
    const id = uuidv4();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO configurations (id, name, language, compileCommand, compileArgs, runCommand, runArgs, sourceFileExpected, createdAt, updatedAt)
      VALUES (@id, @name, @language, @compileCommand, @compileArgs, @runCommand, @runArgs, @sourceFileExpected, @createdAt, @updatedAt)
    `);

    stmt.run({
      id,
      name: data.name,
      language: data.language,
      compileCommand: data.compileCommand || null,
      compileArgs: data.compileArgs || null,
      runCommand: data.runCommand,
      runArgs: data.runArgs || null,
      sourceFileExpected: data.sourceFileExpected,
      createdAt: now,
      updatedAt: now
    });

    return this.getById(id) as Promise<Configuration>;
  }

  /**
   * Deletes a configuration from the database by its ID.
   */
  async update(id: string, data: Partial<Configuration>): Promise<Configuration> {
    const existing = await this.getById(id);
    if (!existing) throw new Error(`Configuration not found: ${id}`);

    const db = this.dbService.getDb();
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };

    const stmt = db.prepare(`
      UPDATE configurations 
      SET name = @name, language = @language, compileCommand = @compileCommand, 
          compileArgs = @compileArgs, runCommand = @runCommand, runArgs = @runArgs, 
          sourceFileExpected = @sourceFileExpected, updatedAt = @updatedAt
      WHERE id = @id
    `);

    stmt.run(updated);
    return updated;
  }

  /**
   * Deletes a configuration from the database by its ID.
   */
  async delete(id: string): Promise<void> {
    const db = this.dbService.getDb();
    const stmt = db.prepare('DELETE FROM configurations WHERE id = ?');
    stmt.run(id);
  }

  /**
   * Imports a configuration from a JSON file and saves it to the database.
   */
  async import(filePath: string): Promise<Configuration> {
    // Reads as a Json 
    const content = await this.fileService.readJson(filePath) as Configuration;

    return this.create({
      name: content.name,
      language: content.language,
      compileCommand: content.compileCommand,
      compileArgs: content.compileArgs,
      runCommand: content.runCommand,
      runArgs: content.runArgs,
      sourceFileExpected: content.sourceFileExpected
    });
  }

  /**
   * Exports a specific configuration to a JSON file.
   */
  async export(id: string, targetPath: string): Promise<void> {
    const config = await this.getById(id);
    if (!config) throw new Error(`Configuration not found: ${id}`);

    // Export as Json
    await this.fileService.writeJson(targetPath, config);
  }
}
