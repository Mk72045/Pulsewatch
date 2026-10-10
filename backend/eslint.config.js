// ESLint 10 only supports this "flat" config format.
// Kept inside backend so Node globals are not applied to the React app.

import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default defineConfig([
  {
    ignores: ["node_modules/**", "logs/**", "dist/**", "coverage/**"],
  },
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      // Lets ESLint know process, Buffer, and other Node names are real.
      globals: globals.node,
    },
    plugins: {
      js,
    },
    extends: ["js/recommended"],
    rules: {
      // Names like _req are kept so Express still receives the argument.
      "no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
  // Must stay last. It disables style rules that conflict with Prettier.
  eslintConfigPrettier,
]);
