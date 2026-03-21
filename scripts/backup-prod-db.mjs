#!/usr/bin/env node
// ─────────────────────────────────────────────────────────
// scripts/backup-prod-db.mjs
// Creates a timestamped SQL backup of the Prisma Postgres
// production database using the `pg` library.
//
// Usage:  node scripts/backup-prod-db.mjs
//         npm run backup:prod
// ─────────────────────────────────────────────────────────
import { readFileSync, writeFileSync, mkdirSync, readdirSync, unlinkSync, statSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createGzip } from "zlib";
import { createWriteStream } from "fs";
import { pipeline } from "stream/promises";
import { Readable } from "stream";
import pg from "pg";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = dirname(__dirname);
const ENV_FILE = join(PROJECT_ROOT, ".env.prod");
const BACKUP_DIR = join(PROJECT_ROOT, "backups");
const MAX_BACKUPS = 10;

// ── Load .env.prod ───────────────────────────────────────
function loadEnv() {
  let content;
  try {
    content = readFileSync(ENV_FILE, "utf-8");
  } catch {
    console.error(`❌ ${ENV_FILE} nicht gefunden. Bitte Credentials anlegen.`);
    process.exit(1);
  }
  const env = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    let val = trimmed.slice(eqIdx + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

// ── SQL value escaping ───────────────────────────────────
function escapeSqlValue(val) {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number" || typeof val === "bigint") return String(val);
  if (typeof val === "boolean") return val ? "TRUE" : "FALSE";
  if (val instanceof Date) return `'${val.toISOString()}'`;
  if (Buffer.isBuffer(val)) return `E'\\\\x${val.toString("hex")}'`;
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ── Main ─────────────────────────────────────────────────
async function main() {
  const env = loadEnv();
  const dbUrl = env.SQL_DATABASE_URL;
  if (!dbUrl) {
    console.error("❌ SQL_DATABASE_URL ist nicht in .env.prod gesetzt.");
    process.exit(1);
  }

  // Timestamp for filename
  const now = new Date();
  const ts = now.toISOString().replace(/[-:T]/g, (m) => (m === "T" ? "_" : "")).slice(0, 15);
  mkdirSync(BACKUP_DIR, { recursive: true });
  const backupFile = join(BACKUP_DIR, `boardgametools_${ts}.sql.gz`);

  console.log("🗄️  Starte Backup der Prod-Datenbank...");
  console.log(`   Ziel: ${backupFile}`);

  const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    console.log("   Verbunden mit Datenbank.");

    // Get all user tables (exclude Prisma migration tables)
    const { rows: tables } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);

    const lines = [];
    lines.push(`-- BoardGameTools Prod Backup`);
    lines.push(`-- Created: ${now.toISOString()}`);
    lines.push(`-- Tables: ${tables.length}`);
    lines.push(`SET client_encoding = 'UTF8';`);
    lines.push(``);

    let totalRows = 0;

    for (const { tablename } of tables) {
      console.log(`   📋 ${tablename}...`);

      // Get column info
      const { rows: columns } = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tablename]);
      const colNames = columns.map((c) => `"${c.column_name}"`);

      // Dump table data
      const { rows } = await client.query(`SELECT * FROM "${tablename}"`);
      
      lines.push(`-- Table: ${tablename} (${rows.length} rows)`);
      lines.push(`DELETE FROM "${tablename}";`);

      if (rows.length > 0) {
        for (const row of rows) {
          const vals = columns.map((c) => escapeSqlValue(row[c.column_name]));
          lines.push(`INSERT INTO "${tablename}" (${colNames.join(", ")}) VALUES (${vals.join(", ")});`);
        }
        totalRows += rows.length;
      }
      lines.push(``);
    }

    lines.push(`-- Backup complete: ${totalRows} total rows`);

    // Write gzipped
    const sqlContent = lines.join("\n") + "\n";
    const readable = Readable.from([sqlContent]);
    const gzip = createGzip({ level: 9 });
    const output = createWriteStream(backupFile);
    await pipeline(readable, gzip, output);

    const size = statSync(backupFile).size;
    const sizeStr = size > 1024 * 1024
      ? `${(size / 1024 / 1024).toFixed(1)} MB`
      : `${(size / 1024).toFixed(1)} KB`;

    console.log(`✅ Backup erfolgreich: ${backupFile} (${sizeStr}, ${totalRows} Zeilen)`);

    // Cleanup old backups
    const existing = readdirSync(BACKUP_DIR)
      .filter((f) => f.startsWith("boardgametools_") && f.endsWith(".sql.gz"))
      .sort()
      .reverse();

    if (existing.length > MAX_BACKUPS) {
      const toRemove = existing.slice(MAX_BACKUPS);
      console.log(`🧹 Räume ${toRemove.length} alte Backups auf...`);
      for (const f of toRemove) {
        unlinkSync(join(BACKUP_DIR, f));
      }
    }

  } catch (err) {
    console.error("❌ Backup fehlgeschlagen:", err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
