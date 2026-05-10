import { describe, it, expect } from 'vitest';
import { makeTestDb } from './testUtils';

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
