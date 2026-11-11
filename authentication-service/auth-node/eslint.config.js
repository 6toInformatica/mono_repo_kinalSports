import path from 'node:path';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

// Esta configuración se usa sola (pnpm lint dentro de auth-node) y también desde el
// eslint.config.js de la raíz, así que las rutas se calculan relativas a quien la carga.
const base = path
  .relative(process.cwd(), import.meta.dirname)
  .replaceAll('\\', '/');
const scoped = (pattern) => (base ? `${base}/${pattern}` : pattern);

const nodeGlobals = {
  process: 'readonly',
  Buffer: 'readonly',
  console: 'readonly',
};

export default tseslint.config(
  {
    ignores: [
      scoped('dist/**'),
      scoped('uploads/**'),
      scoped('src/generated/**'),
    ],
  },
  {
    files: [scoped('**/*.{js,ts}')],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: nodeGlobals,
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: [scoped('**/*.ts')],
    extends: [tseslint.configs.recommended],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  }
);
