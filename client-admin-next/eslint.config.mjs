import path from "node:path";
import process from "node:process";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Esta configuración se usa sola (pnpm lint dentro de client-admin-next) y también desde
// el eslint.config.js de la raíz: las rutas se calculan relativas a quien la carga, y cada
// bloque de Next se limita a esta carpeta para no aplicarse al resto del repositorio.
const base = path
  .relative(process.cwd(), import.meta.dirname)
  .replaceAll("\\", "/");
const scoped = (pattern) => (base ? `${base}/${pattern}` : pattern);

const SOURCE_FILES = scoped("**/*.{js,jsx,mjs,ts,tsx}");

const scopeConfig = (config) => ({
  ...config,
  files: config.files
    ? config.files.map((pattern) =>
        typeof pattern === "string" ? scoped(pattern) : pattern,
      )
    : [SOURCE_FILES],
  ...(config.ignores && { ignores: config.ignores.map(scoped) }),
});

const config = [
  {
    ignores: [
      scoped(".next/**"),
      scoped("out/**"),
      scoped("build/**"),
      scoped("next-env.d.ts"),
    ],
  },
  ...[...nextVitals, ...nextTs].map(scopeConfig),
  {
    files: [SOURCE_FILES],
    settings: { next: { rootDir: import.meta.dirname } },
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
];

export default config;
