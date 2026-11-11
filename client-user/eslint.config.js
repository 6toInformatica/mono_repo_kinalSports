// eslint.config.js
import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import path from "node:path";

// Esta configuración se usa sola (pnpm lint dentro de client-user) y desde la raíz:
// las rutas se calculan relativas a quien la carga
const base = path
  .relative(process.cwd(), import.meta.dirname)
  .replaceAll("\\", "/");
const scoped = (pattern) => (base ? `${base}/${pattern}` : pattern);

/** @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: [scoped("**/*.{js,jsx,cjs}")],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      // El proyecto no usa prop-types (props de React Navigation); con --max-warnings=0 bloqueaba los commits
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        __dirname: "readonly",
        // React Native carga imágenes con require()
        require: "readonly",
        process: "readonly",
        // Globales del entorno de React Native y de Metro (CommonJS)
        console: "readonly",
        FormData: "readonly",
        module: "writable",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    ignores: [scoped("node_modules/**"), scoped(".expo/**"), scoped("dist/**")],
  },
];
