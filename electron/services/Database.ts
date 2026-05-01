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
