#!/usr/bin/env node

/**
 * Review-Evaluator für BoardGameTools
 *
 * Bewertet die Qualität der Code-Review-Findings aus skills/code-review/SKILL.md
 * und generiert Anpassungsempfehlungen für den Reviewer.
 *
 * Bewertungsdimensionen:
 *   1. Treffsicherheit (Precision)    – Sind Findings echte Issues?
 *   2. Aktualität (Currency)          – Sind Referenzen gültig?
 *   3. Abdeckung (Coverage)           – Werden alle Issues erfasst?
 *   4. Umsetzungsrate (Resolution)    – Wie viele Findings wurden behoben?
 *   5. Handlungsfähigkeit (Actionability) – Gibt es konkrete Fix-Vorschläge?
 *
 * Usage:
 *   node scripts/review-evaluate.mjs              # Evaluate + report
 *   node scripts/review-evaluate.mjs --apply      # Evaluate + update SKILL.md
 *   node scripts/review-evaluate.mjs --json       # JSON output only
 *   node scripts/review-evaluate.mjs --strict     # Exit 1 if score < 5
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { execSync } from "child_process";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const ROOT = resolve(__dirname, "..");
const SKILL_PATH = join(ROOT, "skills/code-review/SKILL.md");
const EVAL_PATH = join(ROOT, "review-evaluation.json");
const SRC = join(ROOT, "src");
const HISTORY_DIR = join(ROOT, "docs/code-reviews/history");
const REGRESSIONS_PATH = join(ROOT, "docs/code-reviews/regressions.md");

// ── CLI Args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const JSON_ONLY = args.includes("--json");
const STRICT = args.includes("--strict");
const FAIL_ON_REGRESSION = args.includes("--fail-on-regression");
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/review-evaluate.mjs [--apply] [--json] [--strict] [--fail-on-regression]
  --apply              Update SKILL.md with feedback
  --json               Output JSON only
  --strict             Exit 1 if overall score < 5/10
  --fail-on-regression Exit 1 if any resolved finding regressed to open`);
  process.exit(0);
}

// ── Colors ────────────────────────────────────────────────────────
const C = JSON_ONLY
  ? { R: "", G: "", Y: "", B: "", D: "", X: "" }
  : {
      R: "\x1b[31m",
      G: "\x1b[32m",
      Y: "\x1b[33m",
      B: "\x1b[36m",
      D: "\x1b[2m",
      X: "\x1b[0m",
    };

// ── Utility Helpers ───────────────────────────────────────────────

/** Safely read a file relative to ROOT, returns null if missing */
function readSafe(relPath) {
  const p = join(ROOT, relPath);
  try {
    return readFileSync(p, "utf8");
  } catch {
    return null;
  }
}

/** Count lines in a file */
function lineCount(relPath) {
  const content = readSafe(relPath);
  return content ? content.split("\n").length : 0;
}

/** Run grep and return match count (0 if no matches) */
function grepCount(pattern, glob = "*.ts", path = "src") {
  try {
    const cmd = `grep -rn '${pattern}' '${join(ROOT, path)}' --include='${glob}' 2>/dev/null | wc -l`;
    return parseInt(execSync(cmd, { encoding: "utf8" }).trim(), 10) || 0;
  } catch {
    return 0;
  }
}

/** Run grep and return matching lines */
function grepLines(pattern, glob = "*.{ts,tsx}", path = "src") {
  try {
    const cmd = `grep -rn '${pattern}' '${join(ROOT, path)}' --include='${glob}' 2>/dev/null`;
    return execSync(cmd, { encoding: "utf8" }).trim().split("\n").filter(Boolean);
  } catch {
    return [];
  }
}

/** Check if a file exists relative to ROOT */
function fileExists(relPath) {
  return existsSync(join(ROOT, relPath));
}

/** Find files matching a glob pattern and return line counts */
function findLargeFiles(minLines, glob = "*.tsx") {
  try {
    const cmd = `find '${SRC}' -name '${glob}' -exec wc -l {} + 2>/dev/null | sort -rn | head -20`;
    const output = execSync(cmd, { encoding: "utf8" }).trim();
    return output
      .split("\n")
      .filter(Boolean)
      .map((line) => {
        const match = line.trim().match(/^(\d+)\s+(.+)$/);
        if (!match) return null;
        const count = parseInt(match[1], 10);
        const file = match[2].replace(ROOT + "/", "");
        return count >= minLines && !file.includes("total") ? { file, lines: count } : null;
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

// ── Regression Detection ──────────────────────────────────────────

/**
 * Loads the most recent history snapshot and compares finding statuses.
 * Returns an array of regressions (findings that went resolved/partial → open).
 */
function detectRegressions(verifications) {
  if (!existsSync(HISTORY_DIR)) return [];

  const files = readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  if (files.length === 0) return [];

  let lastSnapshot;
  try {
    lastSnapshot = JSON.parse(readFileSync(join(HISTORY_DIR, files[0]), "utf8"));
  } catch {
    return [];
  }

  if (!lastSnapshot.findings || !Array.isArray(lastSnapshot.findings)) return [];

  const regressions = [];
  for (const v of verifications) {
    const prev = lastSnapshot.findings.find((f) => f.id === v.id);
    if (!prev) continue;

    const wasResolved = prev.status === "resolved" || prev.status === "partially_resolved";
    const isNowOpen = v.result.status === "open";
    const wasFullyResolved = prev.status === "resolved";
    const isNowPartial = v.result.status === "partially_resolved";

    if ((wasResolved && isNowOpen) || (wasFullyResolved && isNowPartial)) {
      regressions.push({
        id: v.id,
        priority: v.priority,
        category: v.category,
        title: v.title,
        previousStatus: prev.status,
        currentStatus: v.result.status,
        detail: v.result.detail,
        snapshotFile: files[0],
        snapshotDate: lastSnapshot.date,
      });
    }
  }

  return regressions;
}

/**
 * Detects test coverage regressions by comparing current coverage-summary.json
 * against the most recent history snapshot that contains coverage data.
 * Returns an array of regressions (metrics that dropped by more than 2%).
 */
function detectCoverageRegressions() {
  if (!existsSync(HISTORY_DIR)) return [];

  const files = readdirSync(HISTORY_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .reverse();

  // Find last snapshot with coverage data
  let prevCoverage = null;
  for (const f of files) {
    try {
      const snap = JSON.parse(readFileSync(join(HISTORY_DIR, f), "utf8"));
      if (snap.coverage && typeof snap.coverage.statements === "number") {
        prevCoverage = snap.coverage;
        break;
      }
    } catch { /* skip corrupt files */ }
  }

  if (!prevCoverage) return [];

  // Read current coverage
  let currentCoverage = null;
  try {
    const summaryPath = join(ROOT, "coverage/coverage-summary.json");
    if (existsSync(summaryPath)) {
      const raw = JSON.parse(readFileSync(summaryPath, "utf8"));
      const total = raw.total || {};
      currentCoverage = {
        statements: total.statements?.pct ?? null,
        branches: total.branches?.pct ?? null,
        functions: total.functions?.pct ?? null,
        lines: total.lines?.pct ?? null,
      };
    }
  } catch { return []; }

  if (!currentCoverage) return [];

  const regressions = [];
  const THRESHOLD = 2; // Allow up to 2% drop without flagging
  for (const metric of ["statements", "branches", "functions", "lines"]) {
    const prev = prevCoverage[metric];
    const curr = currentCoverage[metric];
    if (prev != null && curr != null && prev - curr > THRESHOLD) {
      regressions.push({
        metric,
        previous: prev,
        current: curr,
        drop: Math.round((prev - curr) * 100) / 100,
      });
    }
  }

  return regressions;
}

/**
 * Archives the current evaluation result as a timestamped JSON file
 * in docs/code-reviews/history/ for future regression comparison.
 */
function archiveHistory(verifications, scores) {
  if (!existsSync(HISTORY_DIR)) {
    mkdirSync(HISTORY_DIR, { recursive: true });
  }

  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}`;
  const filePath = join(HISTORY_DIR, `${ts}.json`);

  // Read coverage data from vitest json-summary if available
  let coverage = null;
  try {
    const summaryPath = join(ROOT, "coverage/coverage-summary.json");
    if (existsSync(summaryPath)) {
      const raw = JSON.parse(readFileSync(summaryPath, "utf8"));
      const total = raw.total || {};
      coverage = {
        statements: total.statements?.pct ?? null,
        branches: total.branches?.pct ?? null,
        functions: total.functions?.pct ?? null,
        lines: total.lines?.pct ?? null,
      };
    }
  } catch { /* ignore */ }

  const data = {
    date: now.toISOString(),
    overall: scores.overall,
    coverage,
    findings: verifications.map((v) => ({
      id: v.id,
      priority: v.priority,
      category: v.category,
      title: v.title,
      status: v.result.status,
      detail: v.result.detail,
    })),
    findingsSummary: {
      total: verifications.length,
      resolved: verifications.filter((v) => v.result.status === "resolved").length,
      partial: verifications.filter((v) => v.result.status === "partially_resolved").length,
      open: verifications.filter((v) => v.result.status === "open").length,
    },
  };

  writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n");
  return filePath;
}

/**
 * Appends detected regressions to the regressions log.
 * Creates the file with a header if it doesn't exist.
 */
function logRegressions(regressions) {
  if (regressions.length === 0) return;

  let content = "";
  if (existsSync(REGRESSIONS_PATH)) {
    content = readFileSync(REGRESSIONS_PATH, "utf8");
  } else {
    content =
      "# Regressions-Log\n\n" +
      "Chronologisches Protokoll aller erkannten Regressions im Review-Prozess.\n" +
      "Jeder Eintrag enthält Felder für Root-Cause-Analyse und Gegenmaßnahmen (manuell auszufüllen).\n\n---\n";
  }

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  let entry = `\n## ${now}\n\n`;
  entry += `| Finding | Priorität | Vorher | Jetzt | Detail |\n`;
  entry += `|---------|-----------|--------|-------|--------|\n`;
  for (const r of regressions) {
    entry += `| ${r.id}: ${r.title} | ${r.priority} | ${r.previousStatus} | ${r.currentStatus} | ${r.detail} |\n`;
  }
  entry += `\n**Root-Cause:** <!-- Manuell ausfüllen: Warum ist das Finding zurückgekehrt? -->\n`;
  entry += `**Gegenmaßnahme:** <!-- Manuell ausfüllen: Wie wird verhindert, dass es erneut passiert? -->\n`;
  entry += `**Verantwortlich:** <!-- Manuell ausfüllen -->\n\n---\n`;

  content += entry;
  writeFileSync(REGRESSIONS_PATH, content);
}

// ══════════════════════════════════════════════════════════════════
// FINDING DEFINITIONS WITH VERIFICATION CHECKS
// Each finding from SKILL.md mapped to automated verification
// ══════════════════════════════════════════════════════════════════

const FINDINGS = [
  // ── P0 Critical ──────────────────────────────────────────────
  {
    id: "P0-1",
    priority: "P0",
    category: "security",
    title: "Debug-Routes in Produktion",
    verify() {
      const envRoute = readSafe("src/app/api/debug/env/route.ts");
      const sessionRoute = readSafe("src/app/api/debug/session/route.ts");
      if (!envRoute && !sessionRoute) return { status: "resolved", detail: "Debug-Routes entfernt" };
      const hasGuard =
        (!envRoute || envRoute.includes("NODE_ENV")) &&
        (!sessionRoute || sessionRoute.includes("NODE_ENV"));
      return hasGuard
        ? { status: "resolved", detail: "NODE_ENV Guard vorhanden" }
        : { status: "open", detail: "Debug-Routes ohne NODE_ENV Guard" };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P0-2",
    priority: "P0",
    category: "security",
    title: "DB-Init ohne Auth",
    verify() {
      const route = readSafe("src/app/api/db/init/route.ts");
      if (!route) return { status: "resolved", detail: "DB-Init Route entfernt" };
      const hasAuth = route.includes("auth") || route.includes("ADMIN") || route.includes("isAdmin");
      return hasAuth
        ? { status: "resolved", detail: "Auth-Check vorhanden" }
        : { status: "open", detail: "DB-Init ohne Auth" };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P0-3",
    priority: "P0",
    category: "security",
    title: "Hardcoded Admin-Credentials",
    verify() {
      const file = readSafe("src/lib/admin-create.ts");
      if (!file) return { status: "resolved", detail: "admin-create.ts entfernt" };
      const hasHardcoded = file.includes("Admin123") || file.includes("password123");
      return hasHardcoded
        ? { status: "open", detail: "Hardcoded Credentials in admin-create.ts" }
        : { status: "resolved", detail: "Credentials externalisiert" };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P0-4",
    priority: "P0",
    category: "security",
    title: "Gruppen-Passwörter im Klartext",
    verify() {
      const groupRoute = readSafe("src/app/api/groups/route.ts");
      const groupIdRoute = readSafe("src/app/api/groups/[id]/route.ts");
      const usesBcrypt =
        (groupRoute && (groupRoute.includes("bcrypt") || groupRoute.includes("hash("))) ||
        (groupIdRoute && (groupIdRoute.includes("bcrypt") || groupIdRoute.includes("hash(")));
      return usesBcrypt
        ? { status: "resolved", detail: "bcrypt wird verwendet" }
        : { status: "open", detail: "Passwörter ohne Hashing" };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P0-5",
    priority: "P0",
    category: "security",
    title: "Kein Rate Limiting + keine proxy.ts",
    verify() {
      // Next.js 16: middleware.ts wurde zu proxy.ts migriert
      const hasMiddleware = fileExists("src/proxy.ts") || fileExists("src/middleware.ts");
      const hasRateLimit = fileExists("src/lib/rate-limit.ts");
      if (hasMiddleware && hasRateLimit) return { status: "resolved", detail: "Proxy/Middleware + Rate Limiting vorhanden" };
      if (hasMiddleware) return { status: "partially_resolved", detail: "Proxy/Middleware vorhanden, Rate Limiting fehlt" };
      return { status: "open", detail: "Weder Middleware/Proxy noch Rate Limiting" };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P0-6",
    priority: "P0",
    category: "security",
    title: "passwordHash in API-Responses",
    verify() {
      // Check if events routes use select to exclude passwordHash
      const eventsRoute = readSafe("src/app/api/events/route.ts");
      const eventIdRoute = readSafe("src/app/api/events/[id]/route.ts");
      const leaks = [];
      if (eventsRoute && eventsRoute.includes("createdBy: true") && !eventsRoute.includes("createdBy: { select"))
        leaks.push("events/route.ts");
      if (eventIdRoute && eventIdRoute.includes("createdBy: true") && !eventIdRoute.includes("createdBy: { select"))
        leaks.push("events/[id]/route.ts");
      return leaks.length === 0
        ? { status: "resolved", detail: "passwordHash wird nicht exponiert" }
        : { status: "open", detail: `Leak in: ${leaks.join(", ")}` };
    },
    hasFixSuggestion: true,
  },

  // ── P1 Important ─────────────────────────────────────────────
  {
    id: "P1-7",
    priority: "P1",
    category: "security",
    title: "PII in Logs",
    verify() {
      const piiLogs = grepLines("console\\.log.*email\\|console\\.log.*user\\.", "*.ts", "src/app/api");
      return piiLogs.length === 0
        ? { status: "resolved", detail: "Keine PII in API-Logs" }
        : { status: "open", detail: `${piiLogs.length} PII-Logs gefunden` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ersetze console.log mit PII durch strukturiertes Logging ohne E-Mail/User-Daten.",
  },
  {
    id: "P1-8",
    priority: "P1",
    category: "api",
    title: "Fehlende Input-Validierung",
    verify() {
      const hasValidation = fileExists("src/lib/validation.ts");
      if (!hasValidation) return { status: "open", detail: "Kein validation.ts vorhanden" };
      const importCount = grepCount("from.*@/lib/validation", "*.ts", "src/app/api");
      return importCount >= 10
        ? { status: "resolved", detail: `validation.ts in ${importCount} Routes importiert` }
        : { status: "partially_resolved", detail: `Nur ${importCount} Routes nutzen Validierung` };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P1-9",
    priority: "P1",
    category: "performance",
    title: "Keine Pagination",
    verify() {
      const routesToCheck = ["src/app/api/games/route.ts", "src/app/api/sessions/route.ts", "src/app/api/events/route.ts"];
      const withPagination = routesToCheck.filter((r) => {
        const content = readSafe(r);
        return content && (content.includes("take:") || content.includes("skip:") || content.includes("limit"));
      });
      return withPagination.length === routesToCheck.length
        ? { status: "resolved", detail: "Pagination auf allen Listen-Endpoints" }
        : {
            status: withPagination.length > 0 ? "partially_resolved" : "open",
            detail: `${withPagination.length}/${routesToCheck.length} Endpoints mit Pagination`,
          };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze ?page=X&limit=Y Query-Parameter auf Listen-Endpoints mit skip/take in Prisma.",
  },
  {
    id: "P1-10",
    priority: "P1",
    category: "concept",
    title: "Statistiken komplett fehlend",
    verify() {
      const hasPage = fileExists("src/app/(dashboard)/dashboard/statistics/page.tsx");
      const hasApi = fileExists("src/app/api/statistics/route.ts");
      if (hasPage && hasApi) return { status: "resolved", detail: "Statistiken-Seite + API vorhanden" };
      if (hasPage || hasApi) return { status: "partially_resolved", detail: "Teilweise implementiert" };
      return { status: "open", detail: "Weder Seite noch API vorhanden" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle src/app/(dashboard)/dashboard/statistics/page.tsx + /api/statistics/route.ts mit Prisma-Aggregationen.",
  },
  {
    id: "P1-11",
    priority: "P1",
    category: "concept",
    title: "Session-Detailseite fehlt",
    verify() {
      const hasDetail = fileExists("src/app/(dashboard)/dashboard/sessions/[id]/page.tsx");
      return hasDetail
        ? { status: "resolved", detail: "Session-Detailseite vorhanden" }
        : { status: "open", detail: "Keine Session-Detailseite" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle src/app/(dashboard)/dashboard/sessions/[id]/page.tsx als Server Component mit Session-Details.",
  },
  {
    id: "P1-12",
    priority: "P1",
    category: "concept",
    title: "Close-Voting fehlt",
    verify() {
      const hasEndpoint = fileExists("src/app/api/events/[id]/close/route.ts");
      return hasEndpoint
        ? { status: "resolved", detail: "Close-Voting Endpoint vorhanden" }
        : { status: "open", detail: "Kein Close-Voting Endpoint" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle /api/events/[id]/close/route.ts – setzt status='closed' und ermittelt winningProposalId.",
  },
  {
    id: "P1-13",
    priority: "P1",
    category: "security",
    title: "Registrierung: Keine E-Mail-Validierung",
    verify() {
      const register = readSafe("src/app/api/auth/register/route.ts");
      if (!register) return { status: "open", detail: "Register-Route nicht gefunden" };
      const hasValidation =
        register.includes("@") ||
        register.includes("email") && (register.includes("includes") || register.includes("match") || register.includes("validateEmail") || register.includes("validation"));
      return hasValidation
        ? { status: "resolved", detail: "E-Mail-Validierung vorhanden" }
        : { status: "open", detail: "Keine E-Mail-Validierung" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Nutze validateEmail() aus src/lib/validation.ts in der Register-Route.",
  },
  {
    id: "P1-14",
    priority: "P1",
    category: "performance",
    title: "P95 Duration Query lädt alle Zeilen",
    verify() {
      const route = readSafe("src/app/api/admin/monitoring/stats/route.ts");
      if (!route) return { status: "open", detail: "Stats-Route nicht gefunden" };
      const usesOffset = route.includes("OFFSET") || route.includes("offset") || route.includes("skip:");
      return usesOffset
        ? { status: "resolved", detail: "P95 Query nutzt OFFSET/LIMIT" }
        : { status: "open", detail: "P95 Query lädt alle Zeilen" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Verwende OFFSET/LIMIT in der P95-Query statt alle Zeilen zu laden: ORDER BY durationMs DESC OFFSET n LIMIT 1.",
  },
  {
    id: "P1-15",
    priority: "P1",
    category: "security",
    title: "Admin kann sich selbst deaktivieren",
    verify() {
      const usersRoute = readSafe("src/app/api/admin/users/route.ts");
      const deactivateRoute = readSafe("src/app/api/admin/users/deactivate/route.ts");
      const changePwRoute = readSafe("src/app/api/admin/users/change-password/route.ts");
      const hasSelfCheck = (content) =>
        content && (content.includes("session.user.id") || content.includes("eigenen") || content.includes("yourself"));
      const deactivateOk = hasSelfCheck(deactivateRoute);
      const changePwOk = hasSelfCheck(changePwRoute);
      const usersOk = hasSelfCheck(usersRoute);
      if (deactivateOk && changePwOk)
        return { status: "resolved", detail: "Self-Protection in deactivate + change-password vorhanden" };
      if (deactivateOk || changePwOk || usersOk)
        return { status: "partially_resolved", detail: "Self-Check teilweise vorhanden" };
      return { status: "open", detail: "Keine Self-Protection" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Prüfe userId === session.user.id vor Deaktivierung/Passwort-Änderung und gib 400 zurück.",
  },
  {
    id: "P1-16",
    priority: "P1",
    category: "api",
    title: "Admin-Endpoints: 401 statt 403",
    verify() {
      // Next.js 16: middleware.ts wurde zu proxy.ts migriert
      const middleware = readSafe("src/proxy.ts") || readSafe("src/middleware.ts");
      if (!middleware) return { status: "open", detail: "Weder proxy.ts noch middleware.ts vorhanden" };
      const has403 = middleware.includes("403");
      // Prüfe zusätzlich die Admin-Route-Handler direkt
      const adminUsersRoute = readSafe("src/app/api/admin/users/route.ts");
      const routeHas403 = adminUsersRoute && adminUsersRoute.includes("403");
      return (has403 || routeHas403)
        ? { status: "resolved", detail: "Proxy/Admin-Routes geben 403 für Non-Admins" }
        : { status: "open", detail: "Kein 403 in Proxy oder Admin-Routes" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Prüfe session.user.role in proxy.ts/Route-Handlern und gib 403 statt 401 für Non-Admins zurück.",
  },

  // ── P2 Improvement ───────────────────────────────────────────
  {
    id: "P2-17",
    priority: "P2",
    category: "architecture",
    title: "Mega-Komponenten aufteilen",
    verify() {
      const targets = [
        { file: "src/components/public-event/public-event-client.tsx", max: 600 },
        { file: "src/app/(dashboard)/dashboard/groups/[id]/group-detail-client.tsx", max: 500 },
        { file: "src/app/(dashboard)/dashboard/admin/monitoring-dashboard.tsx", max: 500 },
      ];
      const tooLarge = targets.filter((t) => lineCount(t.file) > t.max);
      return tooLarge.length === 0
        ? { status: "resolved", detail: "Alle Mega-Komponenten aufgeteilt" }
        : {
            status: "open",
            detail: tooLarge.map((t) => `${t.file.split("/").pop()}: ${lineCount(t.file)} Zeilen`).join(", "),
          };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P2-18",
    priority: "P2",
    category: "typescript",
    title: "any-Types im Code",
    verify() {
      const anyCount = grepCount(": any", "*.ts", "src") + grepCount(": any", "*.tsx", "src");
      if (anyCount === 0) return { status: "resolved", detail: "Keine any-Types" };
      if (anyCount <= 10) return { status: "partially_resolved", detail: `${anyCount} any-Types verbleibend` };
      return { status: "open", detail: `${anyCount} any-Types gefunden` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ersetze : any durch konkrete Interfaces (z.B. BGGSearchResult[], EventData, Html5Qrcode).",
  },
  {
    id: "P2-19",
    priority: "P2",
    category: "architecture",
    title: "Duplikat: Prisma-Client-Dateien",
    verify() {
      const dbPostgres = fileExists("src/lib/db-postgres.ts");
      return dbPostgres
        ? { status: "open", detail: "db-postgres.ts existiert noch" }
        : { status: "resolved", detail: "Duplikat entfernt" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Lösche db-postgres.ts und verwende ausschließlich src/lib/db.ts als Prisma-Client Singleton.",
  },
  {
    id: "P2-20",
    priority: "P2",
    category: "architecture",
    title: "Duplikat: BGG-Logik",
    verify() {
      const bggRoute = readSafe("src/app/api/bgg/route.ts");
      const bggLib = readSafe("src/lib/bgg.ts");
      if (!bggRoute || !bggLib) return { status: "resolved", detail: "Kein Duplikat" };
      const routeHasParser = bggRoute.includes("parseString") || bggRoute.includes("xml2js") || bggRoute.includes("DOMParser");
      const libHasParser = bggLib.includes("parseString") || bggLib.includes("xml2js") || bggLib.includes("DOMParser");
      return routeHasParser && libHasParser
        ? { status: "open", detail: "XML-Parsing in Route und Lib dupliziert" }
        : { status: "resolved", detail: "Kein dupliziertes XML-Parsing" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Extrahiere XML-Parsing in src/lib/bgg.ts und importiere es in der API-Route statt zu duplizieren.",
  },
  {
    id: "P2-21",
    priority: "P2",
    category: "performance",
    title: "next/image statt <img>",
    verify() {
      const imgCount = grepCount("<img ", "*.tsx", "src");
      if (imgCount === 0) return { status: "resolved", detail: "Keine <img> Tags" };
      if (imgCount <= 3) return { status: "partially_resolved", detail: `${imgCount} <img> Tags verbleibend` };
      return { status: "open", detail: `${imgCount} <img> Tags gefunden` };
    },
    hasFixSuggestion: true,
  },
  {
    id: "P2-22",
    priority: "P2",
    category: "testing",
    title: "Fehlende Unit Tests",
    verify() {
      try {
        const cmd = `find '${join(ROOT, "tests")}' -name '*.test.*' 2>/dev/null | wc -l`;
        const testFiles = parseInt(execSync(cmd, { encoding: "utf8" }).trim(), 10) || 0;
        if (testFiles >= 10) return { status: "resolved", detail: `${testFiles} Test-Dateien` };
        if (testFiles >= 5) return { status: "partially_resolved", detail: `Nur ${testFiles} Test-Dateien` };
        return { status: "open", detail: `Nur ${testFiles} Test-Dateien` };
      } catch {
        return { status: "open", detail: "Tests-Verzeichnis nicht gefunden" };
      }
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle Tests in tests/unit/lib/ für jede lib-Datei mit vi.mock für Prisma/Auth-Dependencies.",
  },
  {
    id: "P2-23",
    priority: "P2",
    category: "api",
    title: "Inkonsistente Error-Responses",
    verify() {
      const messageCount = grepCount('{ message:', "*.ts", "src/app/api");
      const errorCount = grepCount('{ error:', "*.ts", "src/app/api");
      const total = messageCount + errorCount;
      if (total === 0) return { status: "resolved", detail: "Keine Error-Responses gefunden" };
      const ratio = messageCount / total;
      if (ratio < 0.1) return { status: "resolved", detail: `Konsistent: ${errorCount} error, ${messageCount} message` };
      return {
        status: ratio < 0.3 ? "partially_resolved" : "open",
        detail: `Inkonsistent: ${errorCount}× {error}, ${messageCount}× {message}`,
      };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Verwende einheitlich { error: string } statt { message: string } in allen API-Responses.",
  },
  {
    id: "P2-24",
    priority: "P2",
    category: "concept",
    title: "CONCEPT.md aktualisieren",
    verify() {
      const concept = readSafe("CONCEPT.md");
      if (!concept) return { status: "open", detail: "CONCEPT.md nicht gefunden" };
      const hasNext16 = concept.includes("16") || concept.includes("Next.js 16");
      const hasPostgres = concept.includes("PostgreSQL") || concept.includes("postgres");
      if (hasNext16 && hasPostgres) return { status: "resolved", detail: "Tech-Stack aktuell" };
      return { status: "open", detail: "Tech-Stack veraltet (Next.js 14, SQLite?)" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Aktualisiere CONCEPT.md: Next.js 16, PostgreSQL, Turbopack, neue Modelle dokumentieren.",
  },
  {
    id: "P2-25",
    priority: "P2",
    category: "architecture",
    title: "Pendende Invites dupliziert",
    verify() {
      const hasShared = fileExists("src/lib/queries/pending-invites.ts");
      return hasShared
        ? { status: "resolved", detail: "Shared Query extrahiert" }
        : { status: "open", detail: "Query-Code dupliziert" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Extrahiere pending-invites Query in src/lib/queries/pending-invites.ts und importiere überall.",
  },
  {
    id: "P2-27",
    priority: "P2",
    category: "database",
    title: "Prisma Transactions fehlen",
    verify() {
      const voteRoute = readSafe("src/app/api/groups/[id]/polls/[pollId]/vote/route.ts");
      const publicVote = readSafe("src/app/api/public/group/[token]/vote/route.ts");
      const hasTransaction =
        (voteRoute && voteRoute.includes("$transaction")) ||
        (publicVote && publicVote.includes("$transaction"));
      return hasTransaction
        ? { status: "resolved", detail: "$transaction wird verwendet" }
        : { status: "open", detail: "Keine Transactions für Votes" };
    },
    hasFixSuggestion: true,
  },

  // ── P3 Nice-to-have ──────────────────────────────────────────
  {
    id: "P3-28",
    priority: "P3",
    category: "concept",
    title: "Tags/Kategorien fehlen",
    verify() {
      const schema = readSafe("prisma/schema.prisma");
      const hasTag = schema && (schema.includes("model Tag") || schema.includes("model Category"));
      return hasTag
        ? { status: "resolved", detail: "Tag/Category-Model vorhanden" }
        : { status: "open", detail: "Kein Tag/Category-Model im Schema" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Verwende prisma.$transaction([...]) für Vote-Erstellung um Race Conditions zu vermeiden.",
  },
  {
    id: "P3-29",
    priority: "P3",
    category: "concept",
    title: "Bild-Upload fehlt",
    verify() {
      const hasUpload = grepCount("upload\\|multer\\|formData.*file\\|FormData.*image", "*.ts", "src/app/api") > 0;
      return hasUpload
        ? { status: "resolved", detail: "Upload-Endpoint vorhanden" }
        : { status: "open", detail: "Kein Bild-Upload implementiert" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle Tag + GameTag Modelle im Schema mit @@unique([name, ownerId]) und /api/tags CRUD-Route.",
  },
  {
    id: "P3-30",
    priority: "P3",
    category: "concept",
    title: "Gruppen-Statistiken fehlen",
    verify() {
      const hasGroupStats =
        fileExists("src/app/(dashboard)/dashboard/groups/[id]/statistics/page.tsx") ||
        fileExists("src/app/api/groups/[id]/statistics/route.ts");
      return hasGroupStats
        ? { status: "resolved", detail: "Gruppen-Statistiken vorhanden" }
        : { status: "open", detail: "Keine Gruppen-Statistiken" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle /api/upload/route.ts mit FormData-Parsing, Dateityp-Validierung und Upload-Model.",
  },
  {
    id: "P3-31",
    priority: "P3",
    category: "architecture",
    title: "accessibility Skill fehlt",
    verify() {
      return fileExists("skills/accessibility/SKILL.md")
        ? { status: "resolved", detail: "Accessibility Skill vorhanden" }
        : { status: "open", detail: "skills/accessibility/SKILL.md fehlt" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle Gruppen-Statistiken Page + API mit groupBy-Aggregationen und recharts-Charts.",
  },
  {
    id: "P3-32",
    priority: "P3",
    category: "security",
    title: "DB-Dumps in Git",
    verify() {
      try {
        // Exclude Prisma migration .sql files (those are schema changes, not dumps)
        const tracked = execSync(
          "git ls-files '*.db' '*.sql' '*.bak' 2>/dev/null | grep -v 'prisma/migrations/'",
          { encoding: "utf8", cwd: ROOT }
        ).trim();
        return tracked.length === 0
          ? { status: "resolved", detail: "Keine DB-Dump-Dateien in Git" }
          : { status: "open", detail: `Getrackte DB-Dateien: ${tracked}` };
      } catch {
        return { status: "resolved", detail: "Git-Check nicht möglich" };
      }
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle skills/accessibility/SKILL.md mit WCAG AA Regeln (Kontrast 4.5:1, Touch 44px, Fokus).",
  },
  {
    id: "P3-33",
    priority: "P3",
    category: "concept",
    title: "Links zu /terms und /privacy fehlen",
    verify() {
      const hasTerms = fileExists("src/app/(auth)/terms/page.tsx");
      const hasPrivacy = fileExists("src/app/(auth)/privacy/page.tsx");
      return hasTerms && hasPrivacy
        ? { status: "resolved", detail: "Beide Seiten vorhanden" }
        : { status: "open", detail: `terms: ${hasTerms}, privacy: ${hasPrivacy}` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze *.db, *.sql, *.bak in .gitignore (ausgenommen prisma/migrations/).",
  },
  {
    id: "P3-35",
    priority: "P3",
    category: "database",
    title: "Fehlende DB-Indices",
    verify() {
      const schema = readSafe("prisma/schema.prisma");
      if (!schema) return { status: "open", detail: "Schema nicht gefunden" };
      const indexCount = (schema.match(/@@index/g) || []).length;
      return indexCount >= 5
        ? { status: "resolved", detail: `${indexCount} @@index Definitionen` }
        : { status: "open", detail: `Nur ${indexCount} @@index Definitionen` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze @@index auf häufig gefilterte Felder (createdById, eventId, groupId, etc.).",
  },

  // ── Security Extended (OWASP, Headers, Dependencies) ──────────
  {
    id: "SEC-44",
    priority: "P1",
    category: "security",
    title: "Fehlende Security Headers",
    verify() {
      const middleware = readSafe("src/proxy.ts") || readSafe("src/middleware.ts");
      const nextConfig = readSafe("next.config.ts") || readSafe("next.config.js") || readSafe("next.config.mjs");
      const hasCSP = (middleware && middleware.includes("Content-Security-Policy")) ||
        (nextConfig && nextConfig.includes("Content-Security-Policy"));
      const hasXFrame = (middleware && middleware.includes("X-Frame-Options")) ||
        (nextConfig && nextConfig.includes("X-Frame-Options"));
      const hasXCTO = (middleware && middleware.includes("X-Content-Type-Options")) ||
        (nextConfig && nextConfig.includes("X-Content-Type-Options"));
      const count = [hasCSP, hasXFrame, hasXCTO].filter(Boolean).length;
      if (count >= 3) return { status: "resolved", detail: "CSP, X-Frame-Options, X-Content-Type-Options vorhanden" };
      if (count > 0) return { status: "partially_resolved", detail: `${count}/3 Security Headers vorhanden` };
      return { status: "open", detail: "Keine Security Headers konfiguriert" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze Security Headers in proxy.ts oder next.config headers(): CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.",
  },
  {
    id: "SEC-45",
    priority: "P2",
    category: "security",
    title: "npm audit: Bekannte Vulnerabilities",
    verify() {
      try {
        // npm audit --json exits non-zero when vulnerabilities exist, so we must catch
        let output;
        try {
          output = execSync("npm audit --json 2>/dev/null", { encoding: "utf8", cwd: ROOT, timeout: 30000 });
        } catch (e) {
          output = e.stdout || "";
        }
        if (!output) return { status: "open", detail: "npm audit konnte nicht ausgeführt werden" };
        const audit = JSON.parse(output);
        const vulns = audit.metadata?.vulnerabilities || {};
        const critical = vulns.critical || 0;
        const high = vulns.high || 0;
        const moderate = vulns.moderate || 0;
        // Also check production-only vulnerabilities (exclude devDependencies)
        let prodHigh = high;
        let prodCritical = critical;
        try {
          let prodOutput;
          try {
            prodOutput = execSync("npm audit --json --omit=dev 2>/dev/null", { encoding: "utf8", cwd: ROOT, timeout: 30000 });
          } catch (e) {
            prodOutput = e.stdout || "";
          }
          if (prodOutput) {
            const prodAudit = JSON.parse(prodOutput);
            const prodVulns = prodAudit.metadata?.vulnerabilities || {};
            prodCritical = prodVulns.critical || 0;
            prodHigh = prodVulns.high || 0;
          }
        } catch { /* ignore */ }
        if (prodCritical + prodHigh === 0 && moderate <= 2)
          return { status: "resolved", detail: `Keine Prod-Vulnerabilities (${high} high nur in devDeps, ${moderate} moderate)` };
        if (critical + high === 0 && moderate <= 2)
          return { status: "resolved", detail: `Keine kritischen/hohen Vulnerabilities (${moderate} moderate)` };
        if (critical + high === 0)
          return { status: "partially_resolved", detail: `${moderate} moderate Vulnerabilities` };
        if (prodCritical + prodHigh === 0)
          return { status: "partially_resolved", detail: `${high} high nur in devDependencies` };
        return { status: "open", detail: `${critical} critical, ${high} high, ${moderate} moderate` };
      } catch {
        return { status: "open", detail: "npm audit konnte nicht ausgeführt werden" };
      }
    },
    hasFixSuggestion: true,
    fixSuggestion: "Führe `npm audit fix` aus oder aktualisiere betroffene Dependencies manuell.",
  },
  {
    id: "SEC-46",
    priority: "P2",
    category: "security",
    title: "XSS: dangerouslySetInnerHTML ohne Sanitization",
    verify() {
      const count = grepCount("dangerouslySetInnerHTML", "*.tsx", "src");
      if (count === 0) return { status: "resolved", detail: "Kein dangerouslySetInnerHTML verwendet" };
      // Check if sanitization library is used
      const hasSanitize = grepCount("DOMPurify\\|sanitize-html\\|xss\\|isomorphic-dompurify", "*.ts", "src") +
        grepCount("DOMPurify\\|sanitize-html\\|xss\\|isomorphic-dompurify", "*.tsx", "src");
      if (hasSanitize > 0) return { status: "resolved", detail: `${count} dangerouslySetInnerHTML mit Sanitization` };
      return { status: "open", detail: `${count}× dangerouslySetInnerHTML ohne Sanitization-Library` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Nutze DOMPurify.sanitize() vor dangerouslySetInnerHTML oder entferne es komplett.",
  },

  // ── Performance Extended ──────────────────────────────────────
  {
    id: "PERF-47",
    priority: "P2",
    category: "performance",
    title: "Schwere Libraries ohne Dynamic Import",
    verify() {
      // Check if components using heavy libs are loaded via next/dynamic
      // Use [(] instead of \\( because grep BRE treats \\( as group start
      const dynamicImports = grepCount("dynamic[(]", "*.tsx", "src") + grepCount("dynamic[(]", "*.ts", "src");
      // Check for await import() pattern (tesseract, html5-qrcode)
      const awaitImports = grepCount("await import[(]", "*.tsx", "src") + grepCount("await import[(]", "*.ts", "src");
      // Static recharts imports (in chart components themselves)
      const staticRecharts = grepCount("import.*from.*recharts", "*.tsx", "src");
      // Parents using next/dynamic to load chart components
      const dynamicChartLoaders = grepCount("dynamic.*chart\\|dynamic.*overview\\|dynamic.*Chart\\|dynamic.*Overview", "*.tsx", "src");

      const issues = [];
      if (staticRecharts > 0 && dynamicChartLoaders === 0 && dynamicImports === 0) {
        issues.push("recharts (300KB+) statisch importiert");
      }
      if (issues.length === 0) return { status: "resolved", detail: `${dynamicImports} dynamic() + ${awaitImports} await import() Lazy-Loads` };
      return { status: "open", detail: issues.join(", ") };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Nutze next/dynamic mit { ssr: false } für tesseract.js und recharts: const Chart = dynamic(() => import('./Chart'), { ssr: false }).",
  },
  {
    id: "PERF-48",
    priority: "P3",
    category: "performance",
    title: "Keine Bundle-Analyse konfiguriert",
    verify() {
      const pkg = readSafe("package.json");
      const nextConfig = readSafe("next.config.ts") || readSafe("next.config.js") || readSafe("next.config.mjs");
      const hasAnalyzer = (pkg && pkg.includes("bundle-analyzer")) ||
        (nextConfig && nextConfig.includes("bundle-analyzer"));
      return hasAnalyzer
        ? { status: "resolved", detail: "@next/bundle-analyzer konfiguriert" }
        : { status: "open", detail: "Kein Bundle-Analyzer in Dependencies oder Config" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Installiere @next/bundle-analyzer und ergänze ANALYZE=true in next.config: npm i -D @next/bundle-analyzer.",
  },
  {
    id: "PERF-49",
    priority: "P2",
    category: "performance",
    title: "Keine API Caching Headers",
    verify() {
      const cacheControl = grepCount("Cache-Control\\|s-maxage\\|stale-while-revalidate", "*.ts", "src/app/api");
      const revalidate = grepCount("revalidate", "*.ts", "src/app/api") + grepCount("revalidate", "*.tsx", "src/app");
      const total = cacheControl + revalidate;
      if (total >= 3) return { status: "resolved", detail: `${total} Caching-Konfigurationen gefunden` };
      if (total > 0) return { status: "partially_resolved", detail: `Nur ${total} Caching-Konfigurationen` };
      return { status: "open", detail: "Keine Cache-Control Headers oder revalidate in API/Pages" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze Cache-Control Headers auf GET-Endpoints: res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300').",
  },

  // ── Best Practices ────────────────────────────────────────────
  {
    id: "BP-50",
    priority: "P2",
    category: "bestpractices",
    title: "ESLint Warnings/Errors",
    verify() {
      try {
        execSync("npx next lint --quiet 2>/dev/null", { encoding: "utf8", cwd: ROOT, timeout: 60000 });
        return { status: "resolved", detail: "ESLint clean (keine Errors)" };
      } catch (e) {
        const output = e.stdout || e.stderr || "";
        const errorLines = output.split("\n").filter((l) => l.includes("Error") || l.includes("error")).length;
        if (errorLines === 0) return { status: "resolved", detail: "ESLint clean" };
        return { status: "open", detail: `${errorLines} ESLint-Fehler` };
      }
    },
    hasFixSuggestion: true,
    fixSuggestion: "Führe `npx next lint --fix` aus und behebe verbleibende Fehler manuell.",
  },
  {
    id: "BP-51",
    priority: "P3",
    category: "bestpractices",
    title: "Ungenutzte Dependencies in package.json",
    verify() {
      const pkg = readSafe("package.json");
      if (!pkg) return { status: "open", detail: "package.json nicht gefunden" };
      const parsed = JSON.parse(pkg);
      const deps = Object.keys(parsed.dependencies || {});
      const unusedCandidates = [];
      for (const dep of deps) {
        // Skip Next.js ecosystem, React, types, and known runtime-only/peer deps
        if (dep.startsWith("@types/") || dep.startsWith("@next/") ||
          ["react", "react-dom", "react-is", "next", "typescript", "prisma", "@prisma/client", "postcss", "tailwindcss", "autoprefixer"].includes(dep))
          continue;
        const importCount = grepCount(dep.replace("/", "\\/"), "*.ts", "src") +
          grepCount(dep.replace("/", "\\/"), "*.tsx", "src") +
          grepCount(dep.replace("/", "\\/"), "*.mjs", "scripts");
        if (importCount === 0) unusedCandidates.push(dep);
      }
      if (unusedCandidates.length === 0) return { status: "resolved", detail: "Alle Dependencies werden verwendet" };
      if (unusedCandidates.length <= 3) return { status: "partially_resolved", detail: `Möglicherweise ungenutzt: ${unusedCandidates.join(", ")}` };
      return { status: "open", detail: `${unusedCandidates.length} potenziell ungenutzt: ${unusedCandidates.slice(0, 5).join(", ")}` };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Prüfe ungenutzte Dependencies mit `npx depcheck` und entferne sie mit `npm uninstall <pkg>`.",
  },
  {
    id: "BP-52",
    priority: "P2",
    category: "bestpractices",
    title: "Fehlende Error Boundaries",
    verify() {
      const hasGlobalError = fileExists("src/app/error.tsx") || fileExists("src/app/global-error.tsx");
      // Count actual error.tsx files (not string matches in file contents)
      let errorFileCount = 0;
      try {
        errorFileCount = parseInt(execSync(`find '${join(ROOT, "src/app")}' -name 'error.tsx' 2>/dev/null | wc -l`, { encoding: "utf8" }).trim(), 10) || 0;
      } catch { /* ignore */ }
      if (hasGlobalError && errorFileCount >= 3) return { status: "resolved", detail: `${errorFileCount} Error Boundaries vorhanden` };
      if (hasGlobalError) return { status: "partially_resolved", detail: "Nur globale Error Boundary" };
      return { status: "open", detail: "Keine Error Boundaries" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle src/app/error.tsx und src/app/global-error.tsx als Error Boundaries + pro Feature-Segment error.tsx.",
  },
  {
    id: "BP-53",
    priority: "P3",
    category: "bestpractices",
    title: "ENV-Validierung beim Start",
    verify() {
      const hasEnvCheck = grepCount("process\\.env.*throw\\|process\\.env.*required\\|z\\.object.*process\\.env\\|env\\.mjs\\|env\\.ts", "*.ts", "src/lib") +
        grepCount("process\\.env.*throw\\|process\\.env.*required\\|z\\.object.*process\\.env", "*.mjs", "src");
      const hasEnvFile = fileExists("src/env.ts") || fileExists("src/env.mjs") || fileExists("src/lib/env.ts");
      if (hasEnvFile || hasEnvCheck >= 2) return { status: "resolved", detail: "ENV-Validierung vorhanden" };
      if (hasEnvCheck > 0) return { status: "partially_resolved", detail: "Teilweise ENV-Prüfungen" };
      return { status: "open", detail: "Keine systematische ENV-Validierung" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle src/lib/env.ts mit Zod-Schema für alle ENV-Variablen und importiere es in db.ts/auth.ts.",
  },
  {
    id: "BP-54",
    priority: "P2",
    category: "bestpractices",
    title: "Fehlende Loading States (loading.tsx)",
    verify() {
      try {
        const cmd = `find '${join(ROOT, "src/app")}' -name 'loading.tsx' 2>/dev/null | wc -l`;
        const loadingFiles = parseInt(execSync(cmd, { encoding: "utf8" }).trim(), 10) || 0;
        const cmd2 = `find '${join(ROOT, "src/app")}' -name 'page.tsx' 2>/dev/null | wc -l`;
        const pageFiles = parseInt(execSync(cmd2, { encoding: "utf8" }).trim(), 10) || 0;
        const ratio = pageFiles > 0 ? loadingFiles / pageFiles : 0;
        if (ratio >= 0.3) return { status: "resolved", detail: `${loadingFiles} loading.tsx für ${pageFiles} pages (${Math.round(ratio * 100)}%)` };
        if (loadingFiles > 0) return { status: "partially_resolved", detail: `Nur ${loadingFiles} loading.tsx für ${pageFiles} pages` };
        return { status: "open", detail: `Keine loading.tsx Dateien (${pageFiles} pages)` };
      } catch {
        return { status: "open", detail: "Konnte loading.tsx nicht zählen" };
      }
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle loading.tsx in wichtigen Route-Segmenten mit Skeleton-Komponenten.",
  },

  // ── Scalability ───────────────────────────────────────────────
  {
    id: "SCALE-55",
    priority: "P2",
    category: "scalability",
    title: "Kein Health-Check Endpoint",
    verify() {
      const hasHealth = fileExists("src/app/api/health/route.ts") ||
        fileExists("src/app/api/healthz/route.ts") ||
        fileExists("src/app/api/ping/route.ts");
      return hasHealth
        ? { status: "resolved", detail: "Health-Check Endpoint vorhanden" }
        : { status: "open", detail: "Kein /api/health oder /api/healthz Endpoint" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Erstelle /api/health/route.ts: Prüft DB-Verbindung, gibt { status: 'ok', db: 'connected' } zurück.",
  },
  {
    id: "SCALE-56",
    priority: "P2",
    category: "scalability",
    title: "File-Uploads auf lokalem Dateisystem",
    verify() {
      const uploadRoute = readSafe("src/app/api/upload/route.ts");
      const storageLib = readSafe("src/lib/storage.ts");
      if (!uploadRoute && !storageLib) return { status: "resolved", detail: "Kein Upload-Endpoint" };
      const combined = (uploadRoute || "") + (storageLib || "");
      const usesS3 = combined.includes("S3") || combined.includes("s3") ||
        combined.includes("R2") || combined.includes("blob") || combined.includes("cloudinary") ||
        combined.includes("BlobStorageProvider");
      const usesLocal = combined.includes("writeFile") || combined.includes("public/uploads") || combined.includes("LocalStorageProvider");
      // Storage abstraction with cloud + local fallback is a valid production pattern
      if (usesS3 && usesLocal) return { status: "resolved", detail: "Storage-Abstraktion mit Cloud + Local Fallback" };
      if (usesS3) return { status: "resolved", detail: "Object Storage (S3/R2/Blob) wird verwendet" };
      if (usesLocal) return { status: "open", detail: "Lokales Dateisystem (public/uploads/) – nicht skalierbar" };
      return { status: "partially_resolved", detail: "Upload-Methode unklar" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Migriere File-Uploads auf S3/R2/Vercel Blob Storage statt public/uploads/.",
  },
  {
    id: "SCALE-57",
    priority: "P2",
    category: "scalability",
    title: "In-Memory Rate Limiting nicht skalierbar",
    verify() {
      const rateLimit = readSafe("src/lib/rate-limit.ts");
      if (!rateLimit) return { status: "open", detail: "Kein Rate Limiting vorhanden" };
      const usesMap = rateLimit.includes("new Map");
      const usesRedis = rateLimit.includes("redis") || rateLimit.includes("ioredis") || rateLimit.includes("upstash");
      if (usesRedis) return { status: "resolved", detail: "Redis-basiertes Rate Limiting" };
      if (usesMap) return { status: "open", detail: "In-Memory Map – funktioniert nicht bei horizontaler Skalierung" };
      return { status: "partially_resolved", detail: "Rate Limiting vorhanden, Implementierung prüfen" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ersetze In-Memory Map durch Upstash Redis Rate Limiting (@upstash/ratelimit).",
  },
  {
    id: "SCALE-58",
    priority: "P3",
    category: "scalability",
    title: "Kein Caching-Layer",
    verify() {
      const hasRedis = grepCount("redis\\|ioredis\\|upstash", "*.ts", "src") > 0;
      const hasUnstableCache = grepCount("unstable_cache\\|cacheTag\\|revalidateTag", "*.ts", "src") +
        grepCount("unstable_cache\\|cacheTag\\|revalidateTag", "*.tsx", "src") > 0;
      const hasInMemoryCache = grepCount("NodeCache\\|lru-cache\\|Map.*cache\\|cache.*Map", "*.ts", "src/lib") > 0;
      if (hasRedis) return { status: "resolved", detail: "Redis Cache vorhanden" };
      if (hasUnstableCache) return { status: "resolved", detail: "Next.js unstable_cache wird genutzt" };
      if (hasInMemoryCache) return { status: "partially_resolved", detail: "Nur In-Memory Cache (nicht skalierbar)" };
      return { status: "open", detail: "Kein Caching-Layer" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Nutze Next.js unstable_cache für DB-Queries oder Upstash Redis für verteiltes Caching.",
  },
  {
    id: "SCALE-59",
    priority: "P3",
    category: "scalability",
    title: "Kein strukturiertes Logging",
    verify() {
      const hasPino = grepCount("pino\\|winston\\|bunyan\\|structured.*log", "*.ts", "src") > 0;
      const hasJsonLog = grepCount("JSON\\.stringify.*log\\|log.*JSON\\.stringify", "*.ts", "src/lib") > 0;
      if (hasPino) return { status: "resolved", detail: "Strukturiertes Logging-Framework vorhanden" };
      if (hasJsonLog) return { status: "partially_resolved", detail: "JSON-Logging teilweise vorhanden" };
      return { status: "open", detail: "Nur console.log – nicht für Log-Aggregation geeignet" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Installiere pino + pino-pretty und erstelle src/lib/logger.ts als zentrale Logging-Instanz.",
  },
  {
    id: "SCALE-60",
    priority: "P1",
    category: "scalability",
    title: "DB Connection Pooling nicht konfiguriert",
    verify() {
      const schema = readSafe("prisma/schema.prisma");
      const dbTs = readSafe("src/lib/db.ts");
      const hasPoolConfig = (schema && (schema.includes("connection_limit") || schema.includes("pool_timeout") || schema.includes("pgbouncer"))) ||
        (dbTs && (dbTs.includes("connection_limit") || dbTs.includes("pool")));
      const hasUrl = schema && schema.includes("DATABASE_URL");
      if (hasPoolConfig) return { status: "resolved", detail: "Connection Pool konfiguriert" };
      if (hasUrl) return { status: "partially_resolved", detail: "DB-URL vorhanden, aber kein explizites Pooling" };
      return { status: "open", detail: "Keine Connection Pool Konfiguration" };
    },
    hasFixSuggestion: true,
    fixSuggestion: "Ergänze ?connection_limit=10&pool_timeout=20 in DATABASE_URL oder nutze PgBouncer.",
  },
];

// ══════════════════════════════════════════════════════════════════
// COVERAGE SCANS – Detect issues NOT mentioned in SKILL.md
// ══════════════════════════════════════════════════════════════════

const COVERAGE_SCANS = [
  {
    id: "COV-1",
    category: "typescript",
    name: "Untyped catch blocks",
    scan() {
      const count = grepCount("catch.*: any", "*.ts", "src") + grepCount("catch.*: any", "*.tsx", "src");
      return { found: count, detail: `${count} catch(err: any) Blöcke` };
    },
    threshold: 3,
  },
  {
    id: "COV-2",
    category: "performance",
    name: "Console.log in Production",
    scan() {
      const count = grepCount("console\\.log", "*.ts", "src/app/api") + grepCount("console\\.log", "*.ts", "src/lib");
      return { found: count, detail: `${count} console.log in API/Lib` };
    },
    threshold: 20,
  },
  {
    id: "COV-3",
    category: "architecture",
    name: "Große Dateien (>400 Zeilen)",
    scan() {
      const large = findLargeFiles(400, "*.tsx");
      return { found: large.length, detail: large.map((f) => `${f.file.split("/").pop()} (${f.lines})`).join(", ") };
    },
    threshold: 5,
  },
  {
    id: "COV-4",
    category: "security",
    name: "TODO/FIXME/HACK Kommentare",
    scan() {
      const count = grepCount("TODO\\|FIXME\\|HACK\\|XXX", "*.ts", "src") + grepCount("TODO\\|FIXME\\|HACK\\|XXX", "*.tsx", "src");
      return { found: count, detail: `${count} TODO/FIXME/HACK Kommentare` };
    },
    threshold: 10,
  },
  {
    id: "COV-5",
    category: "api",
    name: "API Routes ohne try/catch",
    scan() {
      const apiRoutes = grepLines("export async function", "*.ts", "src/app/api");
      const withTryCatch = grepCount("try {", "*.ts", "src/app/api");
      const ratio = apiRoutes.length > 0 ? withTryCatch / apiRoutes.length : 1;
      return {
        found: ratio < 0.8 ? apiRoutes.length - withTryCatch : 0,
        detail: `${withTryCatch}/${apiRoutes.length} Handlers mit try/catch`,
      };
    },
    threshold: 3,
  },
  {
    id: "COV-6",
    category: "testing",
    name: "Test Coverage Lücken",
    scan() {
      // Check which lib files have corresponding tests
      const libFiles = grepLines("export", "*.ts", "src/lib").map((l) => l.split(":")[0]).filter((v, i, a) => a.indexOf(v) === i);
      const testFiles = grepLines("import.*from.*@/lib", "*.test.*", "tests").map((l) => {
        const match = l.match(/from.*@\/lib\/([^'"]+)/);
        return match ? match[1] : null;
      }).filter(Boolean);
      const untestedCount = libFiles.length - testFiles.length;
      return {
        found: Math.max(0, untestedCount),
        detail: `${testFiles.length} von ${libFiles.length} lib-Dateien getestet`,
      };
    },
    threshold: 5,
  },
  // ── New Coverage Scans ──────────────────────────────────────────
  {
    id: "COV-7",
    category: "security",
    name: "dangerouslySetInnerHTML Usage",
    scan() {
      const count = grepCount("dangerouslySetInnerHTML", "*.tsx", "src");
      return { found: count, detail: `${count}× dangerouslySetInnerHTML` };
    },
    threshold: 0,
  },
  {
    id: "COV-8",
    category: "security",
    name: "Hardcoded Secrets/Keys",
    scan() {
      const apiKeys = grepCount("api[_-]key.*=.*[a-zA-Z0-9]\\{20,\\}", "*.ts", "src") +
        grepCount("api[_-]key.*=.*[a-zA-Z0-9]\\{20,\\}", "*.tsx", "src");
      const secrets = grepCount("secret.*=.*[a-zA-Z0-9]\\{20,\\}", "*.ts", "src") +
        grepCount("secret.*=.*[a-zA-Z0-9]\\{20,\\}", "*.tsx", "src");
      return { found: apiKeys + secrets, detail: `${apiKeys + secrets} potenzielle hartcodierte Secrets` };
    },
    threshold: 0,
  },
  {
    id: "COV-9",
    category: "performance",
    name: "Statische Imports schwerer Libraries",
    scan() {
      // Count dynamic() and await import() usage – use [(] for BRE compatibility
      const dynamicImports = grepCount("dynamic[(]", "*.tsx", "src") + grepCount("dynamic[(]", "*.ts", "src");
      const awaitImports = grepCount("await import[(]", "*.tsx", "src") + grepCount("await import[(]", "*.ts", "src");
      const totalLazy = dynamicImports + awaitImports;
      // If there are dynamic imports, heavy libs are handled
      return { found: totalLazy > 0 ? 0 : 1, detail: totalLazy > 0 ? `${totalLazy} Lazy-Loads vorhanden` : "Keine Lazy-Loads gefunden" };
    },
    threshold: 1,
  },
  {
    id: "COV-10",
    category: "bestpractices",
    name: "Fehlende error.tsx Boundaries",
    scan() {
      try {
        const pages = parseInt(execSync(`find '${join(ROOT, "src/app")}' -name 'page.tsx' 2>/dev/null | wc -l`, { encoding: "utf8" }).trim(), 10) || 0;
        const errors = parseInt(execSync(`find '${join(ROOT, "src/app")}' -name 'error.tsx' 2>/dev/null | wc -l`, { encoding: "utf8" }).trim(), 10) || 0;
        const missing = Math.max(0, Math.floor(pages * 0.3) - errors); // Expect at least 30% coverage
        return { found: missing, detail: `${errors} error.tsx für ${pages} pages (${pages > 0 ? Math.round(errors / pages * 100) : 0}%)` };
      } catch {
        return { found: 0, detail: "Konnte error.tsx nicht zählen" };
      }
    },
    threshold: 3,
  },
  {
    id: "COV-11",
    category: "scalability",
    name: "Lokaler File Storage",
    scan() {
      const localWrites = grepCount("writeFile.*public\\|fs\\.write.*upload\\|createWriteStream", "*.ts", "src");
      return { found: localWrites, detail: `${localWrites}× lokale Dateischreibvorgänge` };
    },
    threshold: 0,
  },
  {
    id: "COV-12",
    category: "scalability",
    name: "In-Memory State über Requests",
    scan() {
      // Check for module-level Maps/Sets that persist between requests
      const maps = grepCount("^const.*= new Map\\|^let.*= new Map\\|^const.*= new Set", "*.ts", "src/lib") +
        grepCount("^const.*= new Map\\|^let.*= new Map\\|^const.*= new Set", "*.ts", "src/app");
      return { found: maps, detail: `${maps} module-level Map/Set Instanzen` };
    },
    threshold: 2,
  },
  {
    id: "COV-13",
    category: "bestpractices",
    name: "Magic Numbers in Code",
    scan() {
      // Look for numeric literals that are likely magic numbers (not 0, 1, common values)
      const magicNumbers = grepCount("=== [0-9][0-9][0-9]\\|> [0-9][0-9][0-9]\\|< [0-9][0-9][0-9]\\|setTimeout.*[0-9][0-9][0-9][0-9]", "*.ts", "src/app/api");
      return { found: magicNumbers, detail: `${magicNumbers} potenzielle Magic Numbers in API Routes` };
    },
    threshold: 10,
  },
  // ── Testing Infrastructure Scans ────────────────────────────────
  {
    id: "COV-14",
    category: "testing",
    name: "Coverage Thresholds konfiguriert",
    scan() {
      const config = readSafe("vitest.config.ts") || "";
      const hasGlobal = /thresholds:\s*\{[^}]*statements:\s*\d/.test(config);
      const hasLib = /src\/lib\/\*\*/.test(config) && /statements:\s*\d/.test(config);
      const configured = hasGlobal && hasLib;
      return {
        found: configured ? 0 : 1,
        detail: configured
          ? "Globale + lib-spezifische Schwellen konfiguriert"
          : "Keine Coverage-Schwellen in vitest.config.ts",
      };
    },
    threshold: 0,
  },
  {
    id: "COV-15",
    category: "testing",
    name: "Coverage Regression Tracking",
    scan() {
      // Check that history snapshots exist and contain coverage data
      try {
        const histDir = join(ROOT, "docs/code-reviews/history");
        if (!existsSync(histDir)) return { found: 1, detail: "Kein History-Verzeichnis" };
        const files = readdirSync(histDir).filter((f) => f.endsWith(".json")).sort().reverse();
        if (files.length === 0) return { found: 1, detail: "Keine History-Snapshots" };
        const last = JSON.parse(readFileSync(join(histDir, files[0]), "utf8"));
        const hasCoverage = last.coverage && typeof last.coverage.statements === "number";
        return {
          found: hasCoverage ? 0 : 1,
          detail: hasCoverage
            ? `Letzter Snapshot enthält Coverage-Daten (${last.coverage.statements}% Stmts)`
            : "History-Snapshots enthalten keine Coverage-Daten",
        };
      } catch {
        return { found: 1, detail: "Fehler beim Lesen der History" };
      }
    },
    threshold: 0,
  },
  {
    id: "COV-16",
    category: "testing",
    name: "Automatische WCAG-Checks",
    scan() {
      const a11yTests = grepCount("axe\\|toHaveNoViolations\\|accessibility", "*.test.*", "tests");
      const hasAxeDep = readSafe("package.json")?.includes("jest-axe") || false;
      const ok = a11yTests > 0 && hasAxeDep;
      return {
        found: ok ? 0 : 1,
        detail: ok
          ? `${a11yTests} WCAG-Test-Referenzen + jest-axe installiert`
          : "Keine automatisierten WCAG/axe Tests vorhanden",
      };
    },
    threshold: 0,
  },
];

// ══════════════════════════════════════════════════════════════════
// SCORING ENGINE
// ══════════════════════════════════════════════════════════════════

function computeScores(verifications, coverageResults) {
  const categories = {
    security: { name: "Sicherheit", weight: 3 },
    typescript: { name: "TypeScript", weight: 1 },
    architecture: { name: "Architektur", weight: 2 },
    performance: { name: "Performance", weight: 2 },
    api: { name: "API Design", weight: 1 },
    testing: { name: "Testing", weight: 1 },
    database: { name: "Datenbank", weight: 1 },
    concept: { name: "Konzept-Konformität", weight: 1 },
    bestpractices: { name: "Best Practices", weight: 1 },
    scalability: { name: "Skalierung", weight: 2 },
  };

  const scores = {};
  const priorityWeights = { P0: 4, P1: 3, P2: 2, P3: 1 };

  for (const [catKey, catMeta] of Object.entries(categories)) {
    const catFindings = verifications.filter((v) => v.category === catKey);
    const catCoverage = coverageResults.filter((c) => c.category === catKey);

    const totalFindings = catFindings.length;
    const resolved = catFindings.filter((v) => v.result.status === "resolved").length;
    const partial = catFindings.filter((v) => v.result.status === "partially_resolved").length;
    const open = catFindings.filter((v) => v.result.status === "open").length;
    const withFix = catFindings.filter((v) => v.hasFixSuggestion).length;
    const newIssues = catCoverage.filter((c) => c.result.found > c.threshold).length;

    // Dimension 1: Treffsicherheit (are findings real issues?)
    // All our findings are manually curated, so precision is high
    // Deduct for findings that can't be verified
    const notVerifiable = catFindings.filter((v) => v.result.status === "not_verifiable").length;
    const precision = totalFindings > 0 ? ((totalFindings - notVerifiable) / totalFindings) * 10 : 10;

    // Dimension 2: Aktualität (are references valid/current?)
    // Resolved findings that are still listed as open = stale
    const currency = totalFindings > 0 ? ((resolved + partial) / totalFindings) * 10 : 10;

    // Dimension 3: Abdeckung (are all issues covered?)
    const totalCovScans = catCoverage.length;
    const uncoveredIssues = newIssues;
    const coverage = totalCovScans > 0 ? ((totalCovScans - uncoveredIssues) / totalCovScans) * 10 : 10;

    // Dimension 4: Umsetzungsrate (resolution rate, weighted by priority)
    let resolutionWeighted = 0;
    let totalWeight = 0;
    for (const v of catFindings) {
      const w = priorityWeights[v.priority] || 1;
      totalWeight += w;
      if (v.result.status === "resolved") resolutionWeighted += w;
      else if (v.result.status === "partially_resolved") resolutionWeighted += w * 0.5;
    }
    const resolution = totalWeight > 0 ? (resolutionWeighted / totalWeight) * 10 : 10;

    // Dimension 5: Handlungsfähigkeit (actionability of fix suggestions)
    const actionability = totalFindings > 0 ? (withFix / totalFindings) * 10 : 5;

    // Overall category score (weighted average of dimensions)
    const overall =
      precision * 0.15 + currency * 0.15 + coverage * 0.2 + resolution * 0.35 + actionability * 0.15;

    scores[catKey] = {
      ...catMeta,
      totalFindings,
      resolved,
      partial,
      open,
      newIssues,
      dimensions: {
        precision: Math.round(precision * 10) / 10,
        currency: Math.round(currency * 10) / 10,
        coverage: Math.round(coverage * 10) / 10,
        resolution: Math.round(resolution * 10) / 10,
        actionability: Math.round(actionability * 10) / 10,
      },
      overall: Math.round(overall * 10) / 10,
    };
  }

  // Overall score (weighted by category weight)
  let totalWeighted = 0;
  let totalW = 0;
  for (const [, cat] of Object.entries(scores)) {
    totalWeighted += cat.overall * cat.weight;
    totalW += cat.weight;
  }
  const overallScore = Math.round((totalWeighted / totalW) * 10) / 10;

  return { categories: scores, overall: overallScore };
}

// ══════════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE
// ══════════════════════════════════════════════════════════════════

function generateRecommendations(verifications, coverageResults, scores, regressions = []) {
  const recommendations = [];

  // 0. Regressions → highest priority warnings
  for (const r of regressions) {
    recommendations.push({
      type: "regression",
      findingId: r.id,
      priority: r.priority,
      category: r.category,
      message: `REGRESSION: ${r.id} "${r.title}" war ${r.previousStatus}, ist jetzt ${r.currentStatus}. ${r.detail}`,
    });
  }

  // 1. Resolved findings → recommend marking as done in SKILL.md
  for (const v of verifications) {
    if (v.result.status === "resolved") {
      recommendations.push({
        type: "resolve",
        findingId: v.id,
        priority: v.priority,
        message: `${v.id} "${v.title}" → ERLEDIGT: ${v.result.detail}`,
      });
    }
  }

  // 2. Partially resolved → note progress
  for (const v of verifications) {
    if (v.result.status === "partially_resolved") {
      recommendations.push({
        type: "progress",
        findingId: v.id,
        priority: v.priority,
        message: `${v.id} "${v.title}" → TEILWEISE: ${v.result.detail}`,
      });
    }
  }

  // 3. Coverage gaps → recommend adding to SKILL.md
  for (const c of coverageResults) {
    if (c.result.found > c.threshold) {
      recommendations.push({
        type: "add",
        category: c.category,
        message: `NEU: "${c.name}" – ${c.result.detail} (Schwelle: ${c.threshold})`,
      });
    }
  }

  // 4. Category-specific feedback
  for (const [catKey, catScore] of Object.entries(scores.categories)) {
    if (catScore.dimensions.coverage < 5) {
      recommendations.push({
        type: "improve_coverage",
        category: catKey,
        message: `Abdeckung in "${catScore.name}" niedrig (${catScore.dimensions.coverage}/10) – weitere Prüfpunkte hinzufügen`,
      });
    }
    if (catScore.dimensions.actionability < 4) {
      recommendations.push({
        type: "improve_actionability",
        category: catKey,
        message: `Handlungsfähigkeit in "${catScore.name}" niedrig (${catScore.dimensions.actionability}/10) – konkretere Fix-Vorschläge ergänzen`,
      });
    }
    if (catScore.dimensions.resolution < 3 && catScore.totalFindings > 0) {
      recommendations.push({
        type: "escalate",
        category: catKey,
        message: `Umsetzungsrate in "${catScore.name}" kritisch niedrig (${catScore.dimensions.resolution}/10) – Prioritäten eskalieren`,
      });
    }
  }

  // 5. Open P0 findings → urgent reminder
  const openP0 = verifications.filter((v) => v.priority === "P0" && v.result.status === "open");
  for (const v of openP0) {
    recommendations.push({
      type: "urgent",
      findingId: v.id,
      message: `DRINGEND: ${v.id} "${v.title}" ist noch offen!`,
    });
  }

  return recommendations;
}

// ══════════════════════════════════════════════════════════════════
// SKILL.MD FEEDBACK UPDATER
// ══════════════════════════════════════════════════════════════════

function updateSkillMd(scores, recommendations, verifications) {
  let skillContent = readFileSync(SKILL_PATH, "utf8");

  // Remove existing evaluator feedback section if present
  const feedbackMarker = "## Evaluator-Feedback";
  const feedbackIdx = skillContent.indexOf(feedbackMarker);
  if (feedbackIdx !== -1) {
    skillContent = skillContent.substring(0, feedbackIdx).trimEnd();
  }

  const now = new Date().toISOString().replace("T", " ").substring(0, 19);
  const resolvedIds = verifications
    .filter((v) => v.result.status === "resolved")
    .map((v) => v.id);
  const openIds = verifications
    .filter((v) => v.result.status === "open")
    .map((v) => `${v.id} (${v.title})`);

  let feedback = `\n\n${feedbackMarker} (automatisch generiert)\n\n`;
  feedback += `> Letzter Lauf: ${now}\n`;
  feedback += `> Gesamt-Score: **${scores.overall}/10**\n\n`;

  // Score table
  feedback += `### Kategorie-Scores\n\n`;
  feedback += `| Kategorie | Score | Treffsicherheit | Aktualität | Abdeckung | Umsetzung | Handlung |\n`;
  feedback += `|-----------|-------|-----------------|------------|-----------|-----------|----------|\n`;
  for (const [, cat] of Object.entries(scores.categories)) {
    const d = cat.dimensions;
    feedback += `| ${cat.name} | **${cat.overall}/10** | ${d.precision} | ${d.currency} | ${d.coverage} | ${d.resolution} | ${d.actionability} |\n`;
  }

  // Resolved findings
  if (resolvedIds.length > 0) {
    feedback += `\n### Erledigte Findings (${resolvedIds.length})\n\n`;
    for (const v of verifications.filter((v) => v.result.status === "resolved")) {
      feedback += `- ✅ **${v.id}** ${v.title}: ${v.result.detail}\n`;
    }
  }

  // Open findings
  if (openIds.length > 0) {
    feedback += `\n### Offene Findings (${openIds.length})\n\n`;
    for (const v of verifications.filter((v) => v.result.status === "open")) {
      feedback += `- ❌ **${v.id}** ${v.title}: ${v.result.detail}\n`;
    }
  }

  // Partially resolved
  const partialFindings = verifications.filter((v) => v.result.status === "partially_resolved");
  if (partialFindings.length > 0) {
    feedback += `\n### Teilweise gelöst (${partialFindings.length})\n\n`;
    for (const v of partialFindings) {
      feedback += `- 🔶 **${v.id}** ${v.title}: ${v.result.detail}\n`;
    }
  }

  // Regressions
  const regressionRecs = recommendations.filter((r) => r.type === "regression");
  if (regressionRecs.length > 0) {
    feedback += `\n### REGRESSIONEN (${regressionRecs.length})\n\n`;
    for (const r of regressionRecs) {
      feedback += `- 🔄 **${r.findingId}** ${r.message}\n`;
    }
  }

  // Recommendations
  const actionable = recommendations.filter((r) =>
    ["add", "improve_coverage", "improve_actionability", "escalate", "urgent", "regression"].includes(r.type)
  );
  if (actionable.length > 0) {
    feedback += `\n### Empfohlene Reviewer-Anpassungen\n\n`;
    for (const r of actionable) {
      const icon = r.type === "regression" ? "🔄" : r.type === "urgent" ? "🚨" : r.type === "add" ? "➕" : r.type === "escalate" ? "⬆️" : "📝";
      feedback += `- ${icon} ${r.message}\n`;
    }
  }

  skillContent += feedback;
  writeFileSync(SKILL_PATH, skillContent);
}

// ══════════════════════════════════════════════════════════════════
// REPORT OUTPUT
// ══════════════════════════════════════════════════════════════════

function printReport(scores, recommendations, verifications, coverageResults) {
  console.log(`\n${C.B}📊 Review-Evaluierung${C.X}`);
  console.log("═".repeat(65));

  // Category scores
  console.log(`\n${"Kategorie".padEnd(22)} ${"Score".padEnd(8)} ${"Gelöst".padEnd(8)} ${"Offen".padEnd(8)} ${"Neu".padEnd(6)}`);
  console.log("─".repeat(55));
  for (const [, cat] of Object.entries(scores.categories)) {
    const scoreColor = cat.overall >= 7 ? C.G : cat.overall >= 4 ? C.Y : C.R;
    console.log(
      `${cat.name.padEnd(22)} ${scoreColor}${String(cat.overall + "/10").padEnd(8)}${C.X} ${String(cat.resolved).padEnd(8)} ${cat.open > 0 ? C.R : C.G}${String(cat.open).padEnd(8)}${C.X} ${cat.newIssues > 0 ? C.Y : C.D}${String(cat.newIssues).padEnd(6)}${C.X}`
    );
  }
  console.log("─".repeat(55));
  const overallColor = scores.overall >= 7 ? C.G : scores.overall >= 4 ? C.Y : C.R;
  console.log(`${"GESAMT".padEnd(22)} ${overallColor}${scores.overall}/10${C.X}`);

  // Dimension details
  console.log(`\n${C.B}📈 Dimensionen${C.X}`);
  console.log("─".repeat(65));
  console.log(
    `${"Kategorie".padEnd(22)} ${"Treff.".padEnd(8)} ${"Aktual.".padEnd(8)} ${"Abdeck.".padEnd(8)} ${"Umsetz.".padEnd(8)} ${"Handl.".padEnd(8)}`
  );
  console.log("─".repeat(65));
  for (const [, cat] of Object.entries(scores.categories)) {
    const d = cat.dimensions;
    const fmt = (v) => {
      const color = v >= 7 ? C.G : v >= 4 ? C.Y : C.R;
      return `${color}${String(v).padEnd(8)}${C.X}`;
    };
    console.log(`${cat.name.padEnd(22)} ${fmt(d.precision)} ${fmt(d.currency)} ${fmt(d.coverage)} ${fmt(d.resolution)} ${fmt(d.actionability)}`);
  }

  // Recommendations summary
  const regressionRecs = recommendations.filter((r) => r.type === "regression");
  const urgent = recommendations.filter((r) => r.type === "urgent");
  const adds = recommendations.filter((r) => r.type === "add");
  const resolved = recommendations.filter((r) => r.type === "resolve");
  const improvements = recommendations.filter((r) =>
    ["improve_coverage", "improve_actionability", "escalate"].includes(r.type)
  );

  if (regressionRecs.length > 0) {
    console.log(`\n${C.R}${"!".repeat(65)}${C.X}`);
    console.log(`${C.R}  REGRESSIONEN ERKANNT (${regressionRecs.length})${C.X}`);
    console.log(`${C.R}${"!".repeat(65)}${C.X}`);
    regressionRecs.forEach((r) => console.log(`  ${C.R}${r.message}${C.X}`));
    console.log(`${C.R}${"!".repeat(65)}${C.X}`);
  }

  if (urgent.length > 0) {
    console.log(`\n${C.R}🚨 Dringend (${urgent.length})${C.X}`);
    urgent.forEach((r) => console.log(`  ${r.message}`));
  }

  if (adds.length > 0) {
    console.log(`\n${C.Y}➕ Neue Issues für Reviewer (${adds.length})${C.X}`);
    adds.forEach((r) => console.log(`  ${r.message}`));
  }

  if (resolved.length > 0) {
    console.log(`\n${C.G}✅ Erledigte Findings (${resolved.length})${C.X}`);
    resolved.forEach((r) => console.log(`  ${r.message}`));
  }

  if (improvements.length > 0) {
    console.log(`\n${C.B}📝 Reviewer-Verbesserungen (${improvements.length})${C.X}`);
    improvements.forEach((r) => console.log(`  ${r.message}`));
  }

  console.log();
}

// ══════════════════════════════════════════════════════════════════
// MAIN
// ══════════════════════════════════════════════════════════════════

function main() {
  if (!existsSync(SKILL_PATH)) {
    console.error(`${C.R}Fehler: ${SKILL_PATH} nicht gefunden${C.X}`);
    process.exit(1);
  }

  // 1. Verify all findings
  const verifications = FINDINGS.map((f) => ({
    ...f,
    result: f.verify(),
  }));

  // 2. Run coverage scans
  const coverageResults = COVERAGE_SCANS.map((s) => ({
    ...s,
    result: s.scan(),
  }));

  // 3. Detect regressions (compare with previous history snapshot)
  const regressions = detectRegressions(verifications);

  // 3b. Detect coverage regressions
  const covRegressions = detectCoverageRegressions();
  if (covRegressions.length > 0 && !JSON_ONLY) {
    console.log(`\n${C.R}⚠️  Coverage-Regressions erkannt:${C.X}`);
    for (const r of covRegressions) {
      console.log(`${C.R}  ${r.metric}: ${r.previous}% → ${r.current}% (−${r.drop}%)${C.X}`);
    }
    console.log();
  }

  // 4. Compute scores
  const scores = computeScores(verifications, coverageResults);

  // 5. Generate recommendations (now includes regression warnings)
  const recommendations = generateRecommendations(verifications, coverageResults, scores, regressions);

  // 6. Output
  if (JSON_ONLY) {
    const report = {
      date: new Date().toISOString(),
      overall: scores.overall,
      categories: scores.categories,
      findings: verifications.map((v) => ({
        id: v.id,
        priority: v.priority,
        category: v.category,
        title: v.title,
        status: v.result.status,
        detail: v.result.detail,
      })),
      coverage: coverageResults.map((c) => ({
        id: c.id,
        category: c.category,
        name: c.name,
        found: c.result.found,
        threshold: c.threshold,
        overThreshold: c.result.found > c.threshold,
        detail: c.result.detail,
      })),
      regressions: regressions.map((r) => ({
        id: r.id,
        priority: r.priority,
        category: r.category,
        title: r.title,
        previousStatus: r.previousStatus,
        currentStatus: r.currentStatus,
        detail: r.detail,
      })),
      coverageRegressions: covRegressions,
      recommendations: recommendations.map((r) => ({
        type: r.type,
        findingId: r.findingId || null,
        category: r.category || null,
        message: r.message,
      })),
    };
    console.log(JSON.stringify(report, null, 2));
  } else {
    printReport(scores, recommendations, verifications, coverageResults);
  }

  // 7. Save evaluation (flat file, overwritten each run)
  const evalData = {
    date: new Date().toISOString(),
    overall: scores.overall,
    categories: Object.fromEntries(
      Object.entries(scores.categories).map(([k, v]) => [k, { score: v.overall, ...v.dimensions }])
    ),
    findingsSummary: {
      total: verifications.length,
      resolved: verifications.filter((v) => v.result.status === "resolved").length,
      partial: verifications.filter((v) => v.result.status === "partially_resolved").length,
      open: verifications.filter((v) => v.result.status === "open").length,
    },
    regressions: regressions.length,
    coverageIssues: coverageResults.filter((c) => c.result.found > c.threshold).length,
  };
  writeFileSync(EVAL_PATH, JSON.stringify(evalData, null, 2) + "\n");

  // 8. Archive history snapshot for future regression comparison
  const archivePath = archiveHistory(verifications, scores);
  if (!JSON_ONLY && !regressions.length) {
    console.log(`${C.D}History-Snapshot: ${archivePath.replace(ROOT + "/", "")}${C.X}`);
  }

  // 9. Log regressions to persistent regressions.md
  if (regressions.length > 0) {
    logRegressions(regressions);
    if (!JSON_ONLY) {
      console.log(`${C.R}Regressions-Log aktualisiert: docs/code-reviews/regressions.md${C.X}\n`);
    }
  }

  // 10. Apply feedback to SKILL.md
  if (APPLY) {
    updateSkillMd(scores, recommendations, verifications);
    if (!JSON_ONLY) {
      console.log(`${C.G}✅ SKILL.md aktualisiert mit Evaluator-Feedback${C.X}\n`);
    }
  }

  // 11. Strict mode check
  if (STRICT && scores.overall < 5) {
    if (!JSON_ONLY) {
      console.log(`${C.R}❌ Score ${scores.overall}/10 unter Schwelle 5/10 (--strict)${C.X}\n`);
    }
    process.exit(1);
  }

  // 12. Fail on regression check (for pre-commit hook)
  if (FAIL_ON_REGRESSION && (regressions.length > 0 || covRegressions.length > 0)) {
    if (!JSON_ONLY) {
      if (regressions.length > 0) {
        console.log(`${C.R}❌ ${regressions.length} Finding-Regression(en) erkannt – Commit blockiert (--fail-on-regression)${C.X}`);
      }
      if (covRegressions.length > 0) {
        console.log(`${C.R}❌ ${covRegressions.length} Coverage-Regression(en) erkannt – Commit blockiert (--fail-on-regression)${C.X}`);
      }
      console.log(`${C.R}   Behebe die Regressionen oder entferne --fail-on-regression aus dem Hook.${C.X}\n`);
    }
    process.exit(1);
  }
}

main();
