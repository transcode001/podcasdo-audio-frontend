import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Next 16 removed `next lint`; lint runs via the ESLint CLI. eslint-config-next
// ships native flat configs, so they are spread directly.
const eslintConfig = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/**", "node_modules/**", "coverage/**"],
  },
  {
    rules: {
      // Our effects are standard "fetch on mount / sync from URL" data effects
      // that legitimately setState; this new rule flags that valid pattern.
      "react-hooks/set-state-in-effect": "off",
      // Allow intentional throwaway bindings named with a leading underscore.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
