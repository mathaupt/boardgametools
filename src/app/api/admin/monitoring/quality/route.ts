import { NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

interface ReviewSnapshot {
  date: string;
  overall: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  findings: Array<{
    id: string;
    priority: string;
    category: string;
    title: string;
    status: string;
    detail: string;
  }>;
  findingsSummary: {
    total: number;
    resolved: number;
    partial: number;
    open: number;
  };
}

interface DeepDiveFinding {
  id: string;
  title: string;
  priority: string;
  category: string;
  status: "resolved" | "open";
  version?: string;
}

// Deep-Dive Findings (manuell gepflegt, spiegelt SKILL.md wider)
const DEEP_DIVE_FINDINGS: DeepDiveFinding[] = [
  // P0
  { id: "DD-TEST-01", title: "API-Route-Integrationstests", priority: "P0", category: "Testing", status: "resolved", version: "v0.33.0" },
  // P1 resolved
  { id: "DD-SEC-01", title: "Bulk Date-Vote Enum-Validierung", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-02", title: "Guest Date-Vote Enum-Validierung", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-03", title: "Poll-Status Enum-Validierung", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-04", title: "Poll-Option Laengenvalidierung", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-05", title: "Poll-Vote Array-Limit", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-06", title: "Rate Limiting Public Group GET", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-SEC-07", title: "Rate Limiting Public Vote DELETE", priority: "P1", category: "Security", status: "resolved", version: "v0.32.0" },
  { id: "DD-ARCH-01", title: "8 Pages Server Component Migration", priority: "P1", category: "Architecture", status: "resolved", version: "v0.34.0" },
  { id: "DD-ARCH-06", title: "N+1 in import-bgg ($transaction)", priority: "P1", category: "Architecture", status: "resolved", version: "v0.32.0" },
  { id: "DD-ARCH-07", title: "Statistics DB-Aggregation", priority: "P1", category: "Architecture", status: "resolved", version: "v0.32.0" },
  { id: "DD-ARCH-08", title: "Event-Invite Batch-Query", priority: "P1", category: "Architecture", status: "resolved", version: "v0.32.0" },
  { id: "DD-PERF-01", title: "Index GameSession.gameId", priority: "P1", category: "Performance", status: "resolved", version: "v0.32.0" },
  { id: "DD-DB-01", title: "Upload FK-Relation zu User", priority: "P1", category: "Database", status: "resolved", version: "v0.32.0" },
  { id: "DD-SCALE-01", title: "Upstash per-Endpoint Rate Limits", priority: "P1", category: "Scaling", status: "resolved", version: "v0.32.0" },
  { id: "DD-SCALE-02", title: "Storage Production Warning", priority: "P1", category: "Scaling", status: "resolved", version: "v0.32.0" },
  { id: "DD-BP-01", title: "Pre-Commit lint-staged", priority: "P1", category: "Best Practices", status: "resolved", version: "v0.34.0" },
  { id: "DD-BP-02", title: "Dead Code admin-create.ts", priority: "P1", category: "Best Practices", status: "resolved", version: "v0.32.0" },
  { id: "DD-API-02", title: "Deutsche Fehlermeldungen (error-messages.ts)", priority: "P1", category: "API Design", status: "resolved", version: "v0.33.0" },
  // P2 resolved
  { id: "DD-ARCH-02", title: "Fetch-Boilerplate eliminiert", priority: "P2", category: "Architecture", status: "resolved", version: "v0.34.0" },
  { id: "DD-ARCH-05", title: "TagService.syncTags extrahiert", priority: "P2", category: "Architecture", status: "resolved", version: "v0.35.0" },
  { id: "DD-PERF-02", title: "8 fehlende FK-Indices", priority: "P2", category: "Performance", status: "resolved", version: "v0.32.0" },
  { id: "DD-PERF-03", title: "Pagination Groups + Series", priority: "P2", category: "Performance", status: "resolved", version: "v0.35.0" },
  { id: "DD-PERF-04", title: "Client-Fetch-Waterfall eliminiert", priority: "P2", category: "Performance", status: "resolved", version: "v0.34.0" },
  { id: "DD-DB-02", title: "FK-Indices ergaenzt (30 total)", priority: "P2", category: "Database", status: "resolved", version: "v0.32.0" },
  { id: "DD-API-01", title: "Success-Response-Format vereinheitlicht", priority: "P2", category: "API Design", status: "resolved", version: "v0.35.0" },
  { id: "DD-API-04", title: "Input-Validierung in 5 Routes", priority: "P2", category: "API Design", status: "resolved", version: "v0.35.0" },
  { id: "DD-API-05", title: "Admin Create 201 statt 200", priority: "P2", category: "API Design", status: "resolved", version: "v0.35.0" },
  { id: "DD-BP-03", title: "console.* Cleanup", priority: "P2", category: "Best Practices", status: "resolved", version: "v0.35.0" },
  { id: "DD-BP-04", title: "API-Fehlersprache vereinheitlicht", priority: "P2", category: "Best Practices", status: "resolved", version: "v0.33.0" },
  { id: "DD-BP-05", title: "SMTP_PORT parseInt", priority: "P2", category: "Best Practices", status: "resolved", version: "v0.35.0" },
  // P2/P3 open
  { id: "DD-API-03", title: "PATCH statt PUT fuer partielle Updates", priority: "P2", category: "API Design", status: "open" },
  { id: "DD-ARCH-03", title: "13 Dateien >300 Zeilen", priority: "P2", category: "Architecture", status: "open" },
  { id: "DD-ARCH-04", title: "Direct Prisma in Server Pages", priority: "P3", category: "Architecture", status: "open" },
  { id: "DD-API-06", title: "Action-Verb-Routes", priority: "P3", category: "API Design", status: "open" },
  { id: "DD-TEST-02", title: "Public-Voting-Flow-Tests", priority: "P2", category: "Testing", status: "open" },
  { id: "DD-TEST-03", title: "Admin-Operations-Tests", priority: "P2", category: "Testing", status: "open" },
  { id: "DD-TEST-04", title: "Auth-Flow-Tests", priority: "P2", category: "Testing", status: "open" },
  { id: "DD-TEST-05", title: "E2E-Tests vertiefen", priority: "P2", category: "Testing", status: "open" },
  { id: "DD-TEST-06", title: "Coverage-Schwellen erhoehen", priority: "P2", category: "Testing", status: "open" },
  { id: "DD-DB-03", title: "GameProposal ohne Game-Referenz", priority: "P3", category: "Database", status: "open" },
  { id: "DD-DB-04", title: "EventInvite ohne Target", priority: "P3", category: "Database", status: "open" },
  { id: "DD-DB-05", title: "String-Enums statt Prisma-Enums", priority: "P3", category: "Database", status: "open" },
  { id: "DD-KONZ-02", title: "Nicht dokumentierte Features", priority: "P3", category: "Konzept", status: "open" },
  { id: "DD-BP-06", title: "package.json Version synchronisiert", priority: "P3", category: "Best Practices", status: "resolved", version: "v0.35.0" },
  { id: "DD-BP-07", title: ".env.local Template fehlt", priority: "P3", category: "Best Practices", status: "open" },
  { id: "DD-SCALE-03", title: "unstable_cache API", priority: "P3", category: "Scaling", status: "open" },
  { id: "DD-SCALE-04", title: "Client-Error-Reporting fehlt", priority: "P3", category: "Scaling", status: "open" },
  { id: "DD-KONZ-01", title: "CONCEPT.md Tags aktualisiert", priority: "P3", category: "Konzept", status: "resolved", version: "v0.35.0" },
  { id: "DD-SEC-08", title: "Admin Passwort Max-Laenge", priority: "P3", category: "Security", status: "open" },
  { id: "DD-SEC-09", title: "Upload Magic-Bytes-Validierung", priority: "P3", category: "Security", status: "open" },
];

// Kategorie-Scores (Deep-Dive, post-fix)
const CATEGORY_SCORES = [
  { category: "Security", score: 9.8, previous: 9.4, evaluator: 10 },
  { category: "Architecture", score: 9.2, previous: 7.8, evaluator: 10 },
  { category: "Performance", score: 9.5, previous: 8.6, evaluator: 10 },
  { category: "Testing", score: 7.8, previous: 6.6, evaluator: 10 },
  { category: "API Design", score: 8.0, previous: 7.0, evaluator: 10 },
  { category: "Database", score: 9.5, previous: 8.0, evaluator: 10 },
  { category: "Konzept", score: 9.5, previous: 9.5, evaluator: 10 },
  { category: "Best Practices", score: 9.0, previous: 8.4, evaluator: 10 },
  { category: "Scaling", score: 9.5, previous: 9.0, evaluator: 10 },
  { category: "BOM/Dependencies", score: 8.5, previous: 8.5, evaluator: 10 },
];

export const GET = withApiLogging(async function GET() {
  try {
    await requireAdmin();

    // Load latest evaluator snapshot
    const historyDir = path.join(process.cwd(), "docs", "code-reviews", "history");
    let latestSnapshot: ReviewSnapshot | null = null;
    let scoreHistory: Array<{ date: string; score: number }> = [];

    if (existsSync(historyDir)) {
      const files = readdirSync(historyDir)
        .filter((f) => f.endsWith(".json"))
        .sort()
        .reverse();

      // Latest snapshot
      if (files.length > 0) {
        const content = readFileSync(path.join(historyDir, files[0]), "utf-8");
        latestSnapshot = JSON.parse(content);
      }

      // Score history (last 20 snapshots)
      scoreHistory = files.slice(0, 20).reverse().map((f) => {
        try {
          const content = readFileSync(path.join(historyDir, f), "utf-8");
          const snap = JSON.parse(content);
          return { date: snap.date || f.replace(".json", ""), score: snap.overall ?? 0 };
        } catch {
          return { date: f.replace(".json", ""), score: 0 };
        }
      });
    }

    // Compute finding stats
    const resolved = DEEP_DIVE_FINDINGS.filter((f) => f.status === "resolved");
    const open = DEEP_DIVE_FINDINGS.filter((f) => f.status === "open");

    const findingsByPriority = {
      P0: { total: DEEP_DIVE_FINDINGS.filter((f) => f.priority === "P0").length, resolved: resolved.filter((f) => f.priority === "P0").length },
      P1: { total: DEEP_DIVE_FINDINGS.filter((f) => f.priority === "P1").length, resolved: resolved.filter((f) => f.priority === "P1").length },
      P2: { total: DEEP_DIVE_FINDINGS.filter((f) => f.priority === "P2").length, resolved: resolved.filter((f) => f.priority === "P2").length },
      P3: { total: DEEP_DIVE_FINDINGS.filter((f) => f.priority === "P3").length, resolved: resolved.filter((f) => f.priority === "P3").length },
    };

    const findingsByCategory: Record<string, { total: number; resolved: number }> = {};
    for (const f of DEEP_DIVE_FINDINGS) {
      if (!findingsByCategory[f.category]) findingsByCategory[f.category] = { total: 0, resolved: 0 };
      findingsByCategory[f.category].total++;
      if (f.status === "resolved") findingsByCategory[f.category].resolved++;
    }

    return NextResponse.json({
      // Overview
      overallScore: 9.1,
      previousScore: 8.3,
      evaluatorScore: latestSnapshot?.overall ?? 10,
      version: "0.35.0",

      // Category scores
      categoryScores: CATEGORY_SCORES,

      // Tests
      tests: {
        total: 395,
        files: 40,
        allPassing: true,
        apiRouteTests: 26,
      },

      // Code quality
      codeQuality: {
        typescriptErrors: 0,
        eslintErrors: 0,
        eslintWarnings: 0,
        npmAuditVulnerabilities: 0,
        dbIndices: 30,
        errorBoundaries: 10,
        loadingStates: 14,
        serverComponentPages: 14,
        fetchWaterfallPages: 0,
      },

      // Coverage (from evaluator)
      coverage: latestSnapshot?.coverage ?? null,

      // Findings summary
      findings: {
        total: DEEP_DIVE_FINDINGS.length,
        resolved: resolved.length,
        open: open.length,
        byPriority: findingsByPriority,
        byCategory: findingsByCategory,
      },

      // Finding details
      findingDetails: DEEP_DIVE_FINDINGS,

      // Evaluator findings (historic 50)
      evaluatorFindings: latestSnapshot?.findingsSummary ?? null,

      // Score history
      scoreHistory,

      // Tech Stack (BOM summary)
      techStack: [
        { name: "Next.js", version: "16.2", category: "Framework", logo: "https://cdn.simpleicons.org/nextdotjs/white", url: "https://nextjs.org", license: "MIT" },
        { name: "React", version: "19.2", category: "UI", logo: "https://cdn.simpleicons.org/react", url: "https://react.dev", license: "MIT" },
        { name: "TypeScript", version: "5.x", category: "Sprache", logo: "https://cdn.simpleicons.org/typescript", url: "https://www.typescriptlang.org", license: "Apache-2.0" },
        { name: "Prisma", version: "5.22", category: "ORM", logo: "https://cdn.simpleicons.org/prisma/white", url: "https://www.prisma.io", license: "Apache-2.0" },
        { name: "PostgreSQL", version: "—", category: "Datenbank", logo: "https://cdn.simpleicons.org/postgresql", url: "https://www.postgresql.org", license: "PostgreSQL" },
        { name: "Tailwind CSS", version: "4.2", category: "Styling", logo: "https://cdn.simpleicons.org/tailwindcss", url: "https://tailwindcss.com", license: "MIT" },
        { name: "shadcn/ui", version: "—", category: "Komponenten", logo: "https://cdn.simpleicons.org/shadcnui/white", url: "https://ui.shadcn.com", license: "MIT" },
        { name: "NextAuth.js", version: "5.0-beta", category: "Auth", logo: "https://cdn.simpleicons.org/auth0", url: "https://authjs.dev", license: "ISC" },
        { name: "Vitest", version: "4.x", category: "Testing", logo: "https://cdn.simpleicons.org/vitest", url: "https://vitest.dev", license: "MIT" },
        { name: "Recharts", version: "3.8", category: "Charts", logo: "https://cdn.simpleicons.org/d3dotjs", url: "https://recharts.org", license: "MIT" },
        { name: "Pino", version: "10.3", category: "Logging", logo: "https://cdn.simpleicons.org/pino/white", url: "https://getpino.io", license: "MIT" },
        { name: "Upstash Redis", version: "—", category: "Cache", logo: "https://cdn.simpleicons.org/redis", url: "https://upstash.com", license: "MIT" },
        { name: "Vercel", version: "—", category: "Hosting", logo: "https://cdn.simpleicons.org/vercel/white", url: "https://vercel.com", license: "—" },
        { name: "Playwright", version: "1.58", category: "E2E", logo: "https://cdn.simpleicons.org/playwright", url: "https://playwright.dev", license: "Apache-2.0" },
        { name: "Lucide", version: "0.563", category: "Icons", logo: "https://cdn.simpleicons.org/lucide/white", url: "https://lucide.dev", license: "ISC" },
        { name: "bcryptjs", version: "3.x", category: "Crypto", logo: "https://cdn.simpleicons.org/letsencrypt", url: "https://github.com/dcodeIO/bcrypt.js", license: "MIT" },
      ],
    });
  } catch (error) {
    return handleApiError(error);
  }
});
