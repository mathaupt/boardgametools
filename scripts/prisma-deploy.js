#!/usr/bin/env node
// Explicit release operation: a failed migration must never change migration history
// or fall back to schema synchronisation. Build itself does not call this script.
const { spawnSync } = require("node:child_process");

const result = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
if (result.error) {
  console.error("Migration konnte nicht gestartet werden:", result.error.message);
}
process.exit(result.status ?? 1);
