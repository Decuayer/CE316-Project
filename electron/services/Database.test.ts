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
