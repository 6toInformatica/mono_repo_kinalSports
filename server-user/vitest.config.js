import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.js'],
    environment: 'node',
    env: { BUSINESS_TIMEZONE: 'America/Guatemala' },
  },
});
