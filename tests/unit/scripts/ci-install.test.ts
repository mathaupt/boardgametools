// @vitest-environment node
import { describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, symlinkSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parse } from "yaml";

// Exercise the real postinstall in a checkout without .env files, as on GitHub.
describe("CI installation", () => {
  it("generates Prisma using the workflow environment without production secrets", () => {
    const root = process.cwd();
    const workflow = parse(readFileSync(path.join(root, ".github/workflows/ci.yml"), "utf8"));
    const pkg = JSON.parse(readFileSync(path.join(root, "package.json"), "utf8"));
    const dir = mkdtempSync(path.join(tmpdir(), "bgt-ci-install-"));
    try {
      mkdirSync(path.join(dir, "prisma"));
      symlinkSync(path.join(root, "node_modules"), path.join(dir, "node_modules"), "dir");
      writeFileSync(path.join(dir, "package.json"), JSON.stringify({ private: true, scripts: { postinstall: pkg.scripts.postinstall } }));
      writeFileSync(path.join(dir, "prisma.config.ts"), readFileSync(path.join(root, "prisma.config.ts")));
      writeFileSync(path.join(dir, "prisma/schema.prisma"), readFileSync(path.join(root, "prisma/schema.prisma")));
      const env = { ...process.env };
      for (const key of ["SQL_DATABASE_URL", "DATABASE_URL", "POSTGRES_URL", "POSTGRES_URL_NON_POOLING"]) delete env[key];
      Object.assign(env, workflow.env);
      const result = spawnSync("npm", ["run", "postinstall"], { cwd: dir, env, encoding: "utf8", timeout: 20_000 });
      expect(result.status, result.stdout + result.stderr).toBe(0);
      expect(result.stdout).toContain("Generated Prisma Client");
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 25_000);
});
