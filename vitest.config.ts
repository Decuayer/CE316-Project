import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['electron/**/__tests__/**/*.test.ts'],
    environment: 'node',
    globals: false,
    pool: 'forks',
  },
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'shared'),
    },
  },
});
