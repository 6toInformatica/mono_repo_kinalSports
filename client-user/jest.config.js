/** @type {import('jest').Config} */
export default {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/*.test.{js,jsx}"],
  // El primer render de React Native pasa de 5 s cuando el pre-push corre todas las suites a la vez
  testTimeout: 30_000,
};
