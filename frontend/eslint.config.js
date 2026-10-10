// Same ESLint 10 flat config as the backend, with browser globals instead.
// React-specific rules are added when the Vite app is created.

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    ignores: ["node_modules/**", "dist/**", "coverage/**"],
  },
  {
    files: ["**/*.js", "**/*.jsx"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.browser,
    },
    plugins: {
      js,
    },
    extends: ["js/recommended"],
  },
  eslintConfigPrettier,
]);
