import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

interface ComponentHealth {
  status: "healthy" | "degraded" | "unhealthy";
  responseTimeMs?: number;
  message?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  environment: string;
  uptime: number;
  timestamp: string;
  memory: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  components: {
    database: ComponentHealth;
  };
  database?: {
    userCount: number;
    gameCount: number;
    sessionCount: number;
    lastMigration: string | null;
  };
}

// Read version once at module load
const APP_VERSION = process.env.npm_package_version || "unknown";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`health:${ip}`, 30, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const mem = process.memoryUsage();
  const response: HealthResponse = {
    status: "healthy",
    version: APP_VERSION,
    environment: process.env.NODE_ENV || "unknown",
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
    memory: {
      heapUsedMB: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(mem.heapTotal / 1024 / 1024),
      rssMB: Math.round(mem.rss / 1024 / 1024),
    },
    components: {
      database: { status: "healthy" },
    },
  };

  // Database health check with timing
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbResponseTime = Date.now() - dbStart;

    response.components.database = {
      status: dbResponseTime > 2000 ? "degraded" : "healthy",
      responseTimeMs: dbResponseTime,
    };

    // Fetch counts and migration info
    const [userCount, gameCount, sessionCount, migrations] = await Promise.all([
      prisma.user.count(),
      prisma.game.count(),
      prisma.gameSession.count(),
      prisma.$queryRaw`
        SELECT migration_name as name, finished_at as migrated_at
        FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 1
      ` as Promise<Array<{ name: string; migrated_at: string }>>,
    ]);

    response.database = {
      userCount,
      gameCount,
      sessionCount,
      lastMigration: migrations[0]?.name || null,
    };

    if (dbResponseTime > 2000) {
      response.status = "degraded";
    }
  } catch (error) {
    const dbResponseTime = Date.now() - dbStart;
    response.components.database = {
      status: "unhealthy",
      responseTimeMs: dbResponseTime,
      message: error instanceof Error ? error.message : "Unknown error",
    };
    response.status = "unhealthy";
  }

  const httpStatus = response.status === "unhealthy" ? 503 : 200;
  return NextResponse.json(response, {
    status: httpStatus,
    headers: { "Cache-Control": "no-store" },
  });
});
