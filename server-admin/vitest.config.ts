import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

// SWC compila los decoradores y la metadata que necesita la inyección de dependencias de Nest
export default defineConfig({
  plugins: [swc.vite({ module: { type: 'es6' } })],
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
