import path from 'node:path';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

// Esta configuración se usa sola (pnpm lint dentro de server-admin) y también desde el
// eslint.config.js de la raíz, así que las rutas se calculan relativas a quien la carga.
const base = path
  .relative(process.cwd(), import.meta.dirname)
  .replaceAll('\\', '/');
const scoped = (pattern) => (base ? `${base}/${pattern}` : pattern);

export default tseslint.config(
  { ignores: [scoped('dist/**')] },
  {
    files: [scoped('**/*.{js,cjs,mjs,ts}')],
    extends: [js.configs.recommended, prettierConfig],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
      },
    },
    plugins: { prettier },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': 'warn',
      'no-console': 'off',
    },
  },
  {
    files: [scoped('**/*.ts')],
    extends: [tseslint.configs.recommended],
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_' },
      ],
    },
  }
);
