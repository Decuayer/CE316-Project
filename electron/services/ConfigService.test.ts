import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { Database } from './Database';
import { ConfigService } from './ConfigService';

describe('ConfigService - JSON share round-trip', () => {
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

  it('round-trips: export then import yields the same logical configuration', async () => {
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
