import { defineConfig } from "eslint/config";
import clientAdmin from "./client-admin/eslint.config.js";
import clientUser from "./client-user/eslint.config.js";
import serverAdmin from "./server-admin/eslint.config.js";
import serverUser from "./server-user/eslint.config.js";
import authNode from "./authentication-service/auth-node/eslint.config.js";

export default defineConfig([
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
    ],
  },
  ...clientAdmin,
  ...clientUser,
  ...serverAdmin,
  ...serverUser,
  ...authNode,
]);
