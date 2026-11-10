import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import path from 'node:path';
import process from 'node:process';
import { defineConfig, globalIgnores } from 'eslint/config';

// Esta configuración se usa sola (pnpm lint dentro de client-admin) y desde la raíz:
// las rutas se calculan relativas a quien la carga
const base = path.relative(process.cwd(), import.meta.dirname).replaceAll('\\', '/');
const scoped = (pattern) => (base ? `${base}/${pattern}` : pattern);

export default defineConfig([
  globalIgnores([scoped('dist/**')]),
  {
    files: [scoped('**/*.{js,jsx}')],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
]);
