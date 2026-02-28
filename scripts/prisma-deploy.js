#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(command, args, opts = {}) {
  const result = spawnSync(command, args, { stdio: "inherit", ...opts });
  if (result.error) {
    throw result.error;
  }
  return result.status ?? 0;
}

try {
  const status = run("npx", ["prisma", "migrate", "deploy"]);
  if (status === 0) {
    process.exit(0);
  }
  console.warn("prisma migrate deploy failed (exit status %s). Falling back to prisma db push...", status);
} catch (error) {
  const msg = error?.message ?? String(error);
  if (!msg.includes("P3005")) {
    console.warn("prisma migrate deploy threw an unexpected error (%s).", msg);
  }
  console.warn("Falling back to prisma db push...");
}

const pushStatus = run("npx", ["prisma", "db", "push"]);
process.exit(pushStatus);
