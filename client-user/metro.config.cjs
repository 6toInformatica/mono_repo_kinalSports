// metro.config.cjs
// CommonJS requerido: package.json usa "type": "module"
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

module.exports = config;
