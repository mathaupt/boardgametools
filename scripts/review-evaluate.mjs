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

import { readFileSync, writeFileSync, existsSync } from "fs";
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

// ── CLI Args ──────────────────────────────────────────────────────
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const JSON_ONLY = args.includes("--json");
const STRICT = args.includes("--strict");
if (args.includes("--help") || args.includes("-h")) {
  console.log(`Usage: node scripts/review-evaluate.mjs [--apply] [--json] [--strict]
  --apply   Update SKILL.md with feedback
  --json    Output JSON only
  --strict  Exit 1 if overall score < 5/10`);
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
    title: "Kein Rate Limiting + keine middleware.ts",
    verify() {
      const hasMiddleware = fileExists("src/middleware.ts");
      const hasRateLimit = fileExists("src/lib/rate-limit.ts");
      if (hasMiddleware && hasRateLimit) return { status: "resolved", detail: "Middleware + Rate Limiting vorhanden" };
      if (hasMiddleware) return { status: "partially_resolved", detail: "Middleware vorhanden, Rate Limiting fehlt" };
      return { status: "open", detail: "Weder Middleware noch Rate Limiting" };
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
  },
  {
    id: "P1-15",
    priority: "P1",
    category: "security",
    title: "Admin kann sich selbst deaktivieren",
    verify() {
      const deactivate = readSafe("src/app/api/admin/users/route.ts");
      if (!deactivate) return { status: "open", detail: "Admin-Route nicht gefunden" };
      const hasSelfProtection = deactivate.includes("self") || deactivate.includes("eigenen") ||
        deactivate.includes("yourself") || deactivate.includes("session.user.id");
      return hasSelfProtection
        ? { status: "partially_resolved", detail: "Self-Check vorhanden (manuell prüfen)" }
        : { status: "open", detail: "Keine Self-Protection" };
    },
    hasFixSuggestion: false,
  },
  {
    id: "P1-16",
    priority: "P1",
    category: "api",
    title: "Admin-Endpoints: 401 statt 403",
    verify() {
      const middleware = readSafe("src/middleware.ts");
      if (!middleware) return { status: "open", detail: "Keine middleware.ts" };
      const has403 = middleware.includes("403");
      return has403
        ? { status: "resolved", detail: "Middleware gibt 403 für Non-Admins" }
        : { status: "open", detail: "Kein 403 in Middleware" };
    },
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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
    hasFixSuggestion: false,
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

function generateRecommendations(verifications, coverageResults, scores) {
  const recommendations = [];

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

  // Recommendations
  const actionable = recommendations.filter((r) =>
    ["add", "improve_coverage", "improve_actionability", "escalate", "urgent"].includes(r.type)
  );
  if (actionable.length > 0) {
    feedback += `\n### Empfohlene Reviewer-Anpassungen\n\n`;
    for (const r of actionable) {
      const icon = r.type === "urgent" ? "🚨" : r.type === "add" ? "➕" : r.type === "escalate" ? "⬆️" : "📝";
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
  const urgent = recommendations.filter((r) => r.type === "urgent");
  const adds = recommendations.filter((r) => r.type === "add");
  const resolved = recommendations.filter((r) => r.type === "resolve");
  const improvements = recommendations.filter((r) =>
    ["improve_coverage", "improve_actionability", "escalate"].includes(r.type)
  );

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

  // 3. Compute scores
  const scores = computeScores(verifications, coverageResults);

  // 4. Generate recommendations
  const recommendations = generateRecommendations(verifications, coverageResults, scores);

  // 5. Output
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

  // 6. Save evaluation
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
    coverageIssues: coverageResults.filter((c) => c.result.found > c.threshold).length,
  };
  writeFileSync(EVAL_PATH, JSON.stringify(evalData, null, 2) + "\n");

  // 7. Apply feedback to SKILL.md
  if (APPLY) {
    updateSkillMd(scores, recommendations, verifications);
    if (!JSON_ONLY) {
      console.log(`${C.G}✅ SKILL.md aktualisiert mit Evaluator-Feedback${C.X}\n`);
    }
  }

  // 8. Strict mode check
  if (STRICT && scores.overall < 5) {
    if (!JSON_ONLY) {
      console.log(`${C.R}❌ Score ${scores.overall}/10 unter Schwelle 5/10 (--strict)${C.X}\n`);
    }
    process.exit(1);
  }
}

main();
