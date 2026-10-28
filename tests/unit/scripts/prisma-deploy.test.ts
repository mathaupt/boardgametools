// @vitest-environment node
import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

function runMigration(exitStatus: string) {
  const dir = mkdtempSync(path.join(tmpdir(), "bgt-migration-"));
  const log = path.join(dir, "calls");
  writeFileSync(path.join(dir, "npx"), `#!/bin/sh\nprintf '%s\\n' "$*" >> "$MIGRATION_TEST_LOG"\n${exitStatus}\n`, { mode: 0o755 });
  try {
    const result = spawnSync(process.execPath, ["scripts/prisma-deploy.js"], {
      env: { ...process.env, PATH: `${dir}:${process.env.PATH}`, MIGRATION_TEST_LOG: log },
      encoding: "utf8",
    });
    return { status: result.status, calls: readFileSync(log, "utf8").trim().split("\n") };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

describe("explicit migration deployment", () => {
  it("runs the deployment exactly once when successful", () => {
    expect(runMigration("exit 0")).toEqual({ status: 0, calls: ["prisma migrate deploy"] });
  });
  it("preserves failure without marking migrations applied or pushing a schema", () => {
    expect(runMigration("exit 7")).toEqual({ status: 7, calls: ["prisma migrate deploy"] });
  });
  it("fails closed when the migration process is terminated", () => {
    expect(runMigration("kill -TERM $$")).toEqual({ status: 1, calls: ["prisma migrate deploy"] });
  });
});
