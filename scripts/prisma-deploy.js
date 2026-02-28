#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...opts });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 0;
}

function migrateDeploy() {
  return run("npx", ["prisma", "migrate", "deploy"]);
}

function baselineExistingDatabase() {
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  if (!fs.existsSync(migrationsDir)) {
    return;
  }

  const migrations = fs
    .readdirSync(migrationsDir)
    .filter((entry) => {
      const fullPath = path.join(migrationsDir, entry);
      return fs.statSync(fullPath).isDirectory();
    })
    .sort();

  if (migrations.length === 0) return;

  console.warn("Attempting to baseline existing database (prisma migrate resolve --applied ...)");
  for (const migration of migrations) {
    const status = run("npx", ["prisma", "migrate", "resolve", "--applied", migration]);
    if (status !== 0) {
      console.warn(
        "Could not mark migration '%s' as applied (exit code %s). Continuing with remaining migrations...",
        migration,
        status
      );
    }
  }
}

let status = migrateDeploy();
if (status === 0) {
  process.exit(0);
}

console.warn(
  "prisma migrate deploy failed with exit code %s. Database might have been created outside of Prisma migrations.",
  status
);
baselineExistingDatabase();

status = migrateDeploy();
if (status === 0) {
  console.log("prisma migrate deploy succeeded after baselining.");
  process.exit(0);
}

console.warn(
  "prisma migrate deploy still failing (exit code %s). Falling back to 'prisma db push' to sync the schema...",
  status
);
const pushStatus = run("npx", ["prisma", "db", "push"]);
process.exit(pushStatus);
