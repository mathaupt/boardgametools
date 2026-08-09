import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated artifacts and backups:
    "coverage/**",
    "backups/**",
    "*.sql",
    "*.bak",
  ]),
  {
    rules: {
      // Allow underscore-prefixed variables to signal intentionally unused
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // The new react-hooks rule flags common patterns like resetting local state
      // when props change or hydrating from localStorage. These are intentional
      // and predate the rule, so disable it project-wide for now.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Tests: allow broader typing and less strict rules for pragmatic test code.
  {
    files: ["tests/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unsafe-function-type": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "jsx-a11y/alt-text": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // E2E tests: ts-nocheck is used because CodeceptJS types are hard to align.
  {
    files: ["tests/e2e/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  // Scripts and Prisma helpers: CommonJS require is fine in Node scripts.
  {
    files: ["scripts/**/*.{js,mjs}", "prisma/**/*.{js,mjs}"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
]);

export default eslintConfig;
