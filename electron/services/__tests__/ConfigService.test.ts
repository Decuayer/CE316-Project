import { describe, it, expect } from 'vitest';
import { makeTestDb } from './testUtils';
import { ConfigService } from '../ConfigService';

describe('test harness smoke', () => {
  it('opens an in-memory db with the schema', () => {
    const db = makeTestDb();
    const row = db.getDb()
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='configurations'")
      .get();
    expect(row).toBeDefined();
    db.close();
  });
});

describe('ConfigService.create — validation', () => {
  it('rejects empty name', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.create({
      name: '',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    })).rejects.toThrow(/name is required/i);
    db.close();
  });

  it('rejects whitespace-only name', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.create({
      name: '   ',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    })).rejects.toThrow(/name is required/i);
    db.close();
  });

  it('rejects missing runCommand', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: '',
      sourceFileExpected: 'main.c',
    })).rejects.toThrow(/runCommand is required/i);
    db.close();
  });

  it('rejects missing sourceFileExpected', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: '',
    })).rejects.toThrow(/sourceFileExpected is required/i);
    db.close();
  });

  it('rejects missing language', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.create({
      name: 'C Default',
      language: '',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    })).rejects.toThrow(/language is required/i);
    db.close();
  });

  it('reports every missing field in one error', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const err = await svc.create({
      name: '',
      language: '',
      runCommand: '',
      sourceFileExpected: '',
    }).catch(e => e as Error);
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/name is required/i);
    expect(err.message).toMatch(/language is required/i);
    expect(err.message).toMatch(/runCommand is required/i);
    expect(err.message).toMatch(/sourceFileExpected is required/i);
    db.close();
  });

  it('trims string fields before persisting', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: '  C Default  ',
      language: '  c  ',
      compileCommand: '  gcc  ',
      compileArgs: '  {{sourceFile}} -o {{outputName}}  ',
      runCommand: '  ./{{outputName}}  ',
      runArgs: '  {{args}}  ',
      sourceFileExpected: '  main.c  ',
    });
    expect(created.name).toBe('C Default');
    expect(created.language).toBe('c');
    expect(created.compileCommand).toBe('gcc');
    expect(created.compileArgs).toBe('{{sourceFile}} -o {{outputName}}');
    expect(created.runCommand).toBe('./{{outputName}}');
    expect(created.runArgs).toBe('{{args}}');
    expect(created.sourceFileExpected).toBe('main.c');
    db.close();
  });

  it('persists compileCommand as null when blank/whitespace', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'Python',
      language: 'python',
      compileCommand: '   ',
      runCommand: 'python',
      runArgs: '{{sourceFile}}',
      sourceFileExpected: 'main.py',
    });
    expect(created.compileCommand).toBeNull();
    db.close();
  });
});

describe('ConfigService.update — validation', () => {
  it('rejects updating name to blank', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    });
    await expect(svc.update(created.id, { name: '   ' })).rejects.toThrow(/name is required/i);
    db.close();
  });

  it('trims updated fields', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    });
    const updated = await svc.update(created.id, { name: '  Updated  ' });
    expect(updated.name).toBe('Updated');
    db.close();
  });
});

describe('ConfigService.delete — FK safety', () => {
  it('deletes a config that is not referenced by any project', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    });

    await svc.delete(created.id);

    expect(await svc.getById(created.id)).toBeNull();
    db.close();
  });

  it('refuses to delete a config in use by a project, naming the project count', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    });

    db.getDb().prepare(`
      INSERT INTO projects (id, name, configurationId, input, expectedOutput, submissionsDir, createdAt, updatedAt)
      VALUES ('p1', 'HW1', @configId, '{"type":"text","value":""}', '{"type":"text","value":""}', '/tmp', @now, @now)
    `).run({ configId: created.id, now: new Date().toISOString() });

    await expect(svc.delete(created.id)).rejects.toThrow(/in use by 1 project/i);
    expect(await svc.getById(created.id)).not.toBeNull();
    db.close();
  });

  it('pluralizes the project count', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    const created = await svc.create({
      name: 'C Default',
      language: 'c',
      runCommand: './main',
      sourceFileExpected: 'main.c',
    });

    const insertProject = db.getDb().prepare(`
      INSERT INTO projects (id, name, configurationId, input, expectedOutput, submissionsDir, createdAt, updatedAt)
      VALUES (@id, @name, @configId, '{"type":"text","value":""}', '{"type":"text","value":""}', '/tmp', @now, @now)
    `);
    const now = new Date().toISOString();
    insertProject.run({ id: 'p1', name: 'HW1', configId: created.id, now });
    insertProject.run({ id: 'p2', name: 'HW2', configId: created.id, now });

    await expect(svc.delete(created.id)).rejects.toThrow(/in use by 2 projects/i);
    db.close();
  });

  it('throws Configuration not found when deleting an unknown id', async () => {
    const db = makeTestDb();
    const svc = new ConfigService(db);
    await expect(svc.delete('does-not-exist')).rejects.toThrow(/configuration not found/i);
    db.close();
  });
});
