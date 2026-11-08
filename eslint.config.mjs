import js from "@eslint/js";
import react from "@eslint-react/eslint-plugin";
import next from "@next/eslint-plugin-next";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { ignores: [".next/**", "node_modules/**", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
  {
    ...react.configs.recommended,
    files: ["**/*.{ts,tsx}"],
  },
  {
    files: ["**/*.{ts,tsx}"],
    plugins: { "@next/next": next, "react-hooks": reactHooks },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
      ...reactHooks.configs.recommended.rules,
      // Data effects fetch on mount or sync from the URL.
      "react-hooks/set-state-in-effect": "off",
      "@eslint-react/set-state-in-effect": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];
