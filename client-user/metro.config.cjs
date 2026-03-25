const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

// Encontrar el directorio raíz del monorepo
const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "..");

const config = getDefaultConfig(projectRoot);

// 1. Monitorear todos los archivos en el monorepo para hot reloading
config.watchFolders = [workspaceRoot];

// 2. Forzar que Metro resuelva primero en el node_modules local del proyecto,
// y luego en el del monorepo (hoisting de pnpm) con symlinks
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Opcional: Si usas SVG u otros tipos de archivos, configúralos aquí
// config.resolver.assetExts.push('svg');

module.exports = config;
