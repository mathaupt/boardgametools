import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";

type ValidPeriod = "1h" | "6h" | "24h" | "7d" | "30d";

const PERIOD_MS: Record<ValidPeriod, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function isValidPeriod(value: string): value is ValidPeriod {
  return value in PERIOD_MS;
}

// GET /api/admin/monitoring/stats — Aggregated monitoring statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAdmin()

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "24h";
    const period: ValidPeriod = isValidPeriod(periodParam) ? periodParam : "24h";

    const now = new Date();
    const since = new Date(now.getTime() - PERIOD_MS[period]);

    const whereClause = { createdAt: { gte: since } };

    // --- Summary aggregation ---
    const [totalRequests, errorCount, durationAgg, uniqueUsersResult] = await Promise.all([
      prisma.apiLog.count({ where: whereClause }),
      prisma.apiLog.count({
        where: { ...whereClause, statusCode: { gte: 400 } },
      }),
      prisma.apiLog.aggregate({
        where: whereClause,
        _avg: { durationMs: true },
      }),
      prisma.apiLog.groupBy({
        by: ["userId"],
        where: { ...whereClause, userId: { not: null } },
      }),
    ]);

    const errorRate = totalRequests > 0
      ? Math.round((errorCount / totalRequests) * 10000) / 100
      : 0;

    const avgDurationMs = Math.round(durationAgg._avg.durationMs ?? 0);
    const uniqueUsers = uniqueUsersResult.length;

    // --- P95 duration (approximate via OFFSET/LIMIT – avoids loading all rows) ---
    let p95DurationMs = 0;
    if (totalRequests > 0) {
      const p95Index = Math.floor(totalRequests * 0.95);
      const p95Result = await prisma.apiLog.findMany({
        where: whereClause,
        orderBy: { durationMs: "asc" },
        skip: Math.min(p95Index, totalRequests - 1),
        take: 1,
        select: { durationMs: true },
      });
      p95DurationMs = p95Result[0]?.durationMs ?? 0;
    }

    // --- Requests by hour (PostgreSQL date_trunc) ---
    const requestsByHourRaw = await prisma.$queryRaw<
      Array<{ hour: Date; count: bigint; errors: bigint }>
    >(
      Prisma.sql`
        SELECT
          date_trunc('hour', "createdAt") AS hour,
          COUNT(*)::bigint AS count,
          COUNT(*) FILTER (WHERE "statusCode" >= 400)::bigint AS errors
        FROM "ApiLog"
        WHERE "createdAt" >= ${since}
        GROUP BY date_trunc('hour', "createdAt")
        ORDER BY hour ASC
      `
    );

    const requestsByHour = requestsByHourRaw.map((row) => ({
      hour: new Date(row.hour).toISOString(),
      count: Number(row.count),
      errors: Number(row.errors),
    }));

    // --- Top 20 endpoints ---
    const topEndpointsRaw = await prisma.$queryRaw<
      Array<{ path: string; count: bigint; avg_duration: number; error_count: bigint }>
    >(
      Prisma.sql`
        SELECT
          "path",
          COUNT(*)::bigint AS count,
          AVG("durationMs")::float AS avg_duration,
          COUNT(*) FILTER (WHERE "statusCode" >= 400)::bigint AS error_count
        FROM "ApiLog"
        WHERE "createdAt" >= ${since}
        GROUP BY "path"
        ORDER BY count DESC
        LIMIT 20
      `
    );

    const topEndpoints = topEndpointsRaw.map((row) => ({
      path: row.path,
      count: Number(row.count),
      avgDurationMs: Math.round(row.avg_duration),
      errorCount: Number(row.error_count),
    }));

    // --- Status code distribution ---
    const statusDistributionRaw = await prisma.apiLog.groupBy({
      by: ["statusCode"],
      where: whereClause,
      _count: { _all: true },
      orderBy: { statusCode: "asc" },
    });

    const statusDistribution = statusDistributionRaw.map((row) => ({
      statusCode: row.statusCode,
      count: row._count._all,
    }));

    // --- Top 10 users ---
    const topUsersRaw = await prisma.$queryRaw<
      Array<{ userId: string; userName: string | null; count: bigint }>
    >(
      Prisma.sql`
        SELECT
          a."userId",
          u."name" AS "userName",
          COUNT(*)::bigint AS count
        FROM "ApiLog" a
        LEFT JOIN "User" u ON a."userId" = u."id"
        WHERE a."createdAt" >= ${since}
          AND a."userId" IS NOT NULL
        GROUP BY a."userId", u."name"
        ORDER BY count DESC
        LIMIT 10
      `
    );

    const topUsers = topUsersRaw.map((row) => ({
      userId: row.userId,
      userName: row.userName ?? "Unbekannt",
      count: Number(row.count),
    }));

    // --- Method distribution ---
    const methodDistributionRaw = await prisma.apiLog.groupBy({
      by: ["method"],
      where: whereClause,
      _count: { _all: true },
      orderBy: { _count: { method: "desc" } },
    });

    const methodDistribution = methodDistributionRaw.map((row) => ({
      method: row.method,
      count: row._count._all,
    }));

    return NextResponse.json({
      summary: {
        totalRequests,
        errorCount,
        errorRate,
        avgDurationMs,
        p95DurationMs,
        uniqueUsers,
      },
      requestsByHour,
      topEndpoints,
      statusDistribution,
      topUsers,
      methodDistribution,
    });
  } catch (error) {
    console.error("Error fetching monitoring stats:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler beim Abrufen der Statistiken" },
      { status: 500 }
    );
  }
}
