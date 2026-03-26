import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "json-summary", "html"],
      include: [
        "src/lib/**/*.ts",
        "src/components/**/*.{ts,tsx}",
        "src/app/**/*client*.tsx",
        "src/app/**/*form*.tsx",
        "src/app/**/*dialog*.tsx",
        "src/app/**/*modal*.tsx",
        "src/app/api/**/*.ts",
      ],
      exclude: [
        "node_modules/",
        "tests/",
        "src/components/ui/**",       // shadcn/ui -- 3rd-party
        "src/lib/changelog.ts",       // reine Daten
        "src/lib/faq.ts",             // reine Daten
        "**/*.d.ts",
      ],
      thresholds: {
        // Global baseline – prevents overall coverage from regressing
        statements: 30,
        branches: 25,
        functions: 25,
        lines: 30,
        // Stricter thresholds for core library code
        "src/lib/**": {
          statements: 50,
          branches: 45,
          functions: 50,
          lines: 50,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
