import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["specs/**/*.test.js"],
    globalSetup: ["./setup/global-setup.js"],
    // Las pruebas comparten base de datos y servicios: se ejecutan en orden y una a la vez
    fileParallelism: false,
    sequence: { concurrent: false, shuffle: false },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    // Una diferencia de contrato debe revisarse a mano, nunca regenerarse sin querer
    update: false,
  },
});
