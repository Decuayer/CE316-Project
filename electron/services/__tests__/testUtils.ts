import { DatabaseService } from '../DatabaseService';

/**
 * Returns a fresh in-memory DatabaseService with the production schema
 * applied. Each call yields an isolated database — safe for parallel test
 * suites.
 */
export function makeTestDb(): DatabaseService {
  return new DatabaseService(':memory:');
}
