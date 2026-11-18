import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    // Las pruebas unitarias no deben leer el .env local
    env: { NODE_ENV: 'test' },
  },
});
