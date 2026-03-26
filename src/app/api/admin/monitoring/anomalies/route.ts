import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { Prisma } from "@prisma/client";
import logger from "@/lib/logger";

type ValidPeriod = "1h" | "6h" | "24h" | "7d";

const PERIOD_MS: Record<ValidPeriod, number> = {
  "1h": 60 * 60 * 1000,
  "6h": 6 * 60 * 60 * 1000,
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
};

function isValidPeriod(value: string): value is ValidPeriod {
  return value in PERIOD_MS;
}

interface Anomaly {
  id: string;
  type: "error-rate" | "slow-endpoint" | "error-spike" | "unusual-activity" | "auth-failures" | "server-errors";
  severity: "low" | "medium" | "high";
  title: string;
  description: string;
  details: Record<string, unknown>;
  detectedAt: string;
}

// GET /api/admin/monitoring/anomalies — Detect anomalies in API logs
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAdmin()

    const { searchParams } = new URL(request.url);
    const periodParam = searchParams.get("period") || "24h";
    const period: ValidPeriod = isValidPeriod(periodParam) ? periodParam : "24h";

    const now = new Date();
    const since = new Date(now.getTime() - PERIOD_MS[period]);
    const detectedAt = now.toISOString();

    const anomalies: Anomaly[] = [];

    const whereClause = { createdAt: { gte: since } };

    // Fetch base counts for several checks
    const [totalRequests, errorCount] = await Promise.all([
      prisma.apiLog.count({ where: whereClause }),
      prisma.apiLog.count({
        where: { ...whereClause, statusCode: { gte: 400 } },
      }),
    ]);

    // --- 1. High Error Rate ---
    if (totalRequests > 0) {
      const errorRate = (errorCount / totalRequests) * 100;
      if (errorRate > 10) {
        anomalies.push({
          id: "high-error-rate",
          type: "error-rate",
          severity: "high",
          title: "Hohe Fehlerrate",
          description: `Die Fehlerrate liegt bei ${errorRate.toFixed(1)}% (${errorCount} von ${totalRequests} Anfragen). Der Schwellenwert von 10% wurde überschritten.`,
          details: {
            errorRate: Math.round(errorRate * 100) / 100,
            errorCount,
            totalRequests,
            threshold: 10,
          },
          detectedAt,
        });
      }
    }

    // --- 2. Slow Endpoints ---
    const slowEndpointsRaw = await prisma.$queryRaw<
      Array<{ path: string; avg_duration: number; count: bigint }>
    >(
      Prisma.sql`
        SELECT
          "path",
          AVG("durationMs")::float AS avg_duration,
          COUNT(*)::bigint AS count
        FROM "ApiLog"
        WHERE "createdAt" >= ${since}
        GROUP BY "path"
        HAVING AVG("durationMs") > 2000
        ORDER BY avg_duration DESC
      `
    );

    if (slowEndpointsRaw.length > 0) {
      const endpoints = slowEndpointsRaw.map((row) => ({
        path: row.path,
        avgDurationMs: Math.round(row.avg_duration),
        requestCount: Number(row.count),
      }));

      anomalies.push({
        id: "slow-endpoints",
        type: "slow-endpoint",
        severity: "medium",
        title: "Langsame Endpunkte erkannt",
        description: `${endpoints.length} Endpunkt${endpoints.length === 1 ? "" : "e"} mit einer durchschnittlichen Antwortzeit über 2000ms: ${endpoints.map((e) => `${e.path} (${e.avgDurationMs}ms)`).join(", ")}.`,
        details: { endpoints },
        detectedAt,
      });
    }

    // --- 3. Error Spikes (1-hour windows with 3x avg errors) ---
    const errorsByHourRaw = await prisma.$queryRaw<
      Array<{ hour: Date; error_count: bigint }>
    >(
      Prisma.sql`
        SELECT
          date_trunc('hour', "createdAt") AS hour,
          COUNT(*)::bigint AS error_count
        FROM "ApiLog"
        WHERE "createdAt" >= ${since}
          AND "statusCode" >= 400
        GROUP BY date_trunc('hour', "createdAt")
        ORDER BY hour ASC
      `
    );

    if (errorsByHourRaw.length > 0) {
      const hourlyCounts = errorsByHourRaw.map((row) => ({
        hour: new Date(row.hour).toISOString(),
        count: Number(row.error_count),
      }));

      const avgErrorsPerHour =
        hourlyCounts.reduce((sum, h) => sum + h.count, 0) / hourlyCounts.length;

      const spikeThreshold = avgErrorsPerHour * 3;
      const spikeHours = hourlyCounts.filter((h) => h.count > spikeThreshold);

      if (spikeHours.length > 0 && avgErrorsPerHour > 0) {
        anomalies.push({
          id: "error-spikes",
          type: "error-spike",
          severity: "high",
          title: "Fehler-Spitzen erkannt",
          description: `${spikeHours.length} Stundenfenster mit mehr als dem 3-fachen der durchschnittlichen Fehleranzahl (Durchschnitt: ${avgErrorsPerHour.toFixed(1)}, Schwelle: ${spikeThreshold.toFixed(1)}). Betroffene Zeitfenster: ${spikeHours.map((h) => `${h.hour} (${h.count} Fehler)`).join(", ")}.`,
          details: {
            avgErrorsPerHour: Math.round(avgErrorsPerHour * 10) / 10,
            spikeThreshold: Math.round(spikeThreshold * 10) / 10,
            spikeHours,
          },
          detectedAt,
        });
      }
    }

    // --- 4. Unusual Activity (users with >100 requests) ---
    const highActivityUsersRaw = await prisma.$queryRaw<
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
        HAVING COUNT(*) > 100
        ORDER BY count DESC
      `
    );

    if (highActivityUsersRaw.length > 0) {
      const users = highActivityUsersRaw.map((row) => ({
        userId: row.userId,
        userName: row.userName ?? "Unbekannt",
        requestCount: Number(row.count),
      }));

      anomalies.push({
        id: "unusual-activity",
        type: "unusual-activity",
        severity: "low",
        title: "Ungewöhnliche Nutzeraktivität",
        description: `${users.length} Nutzer mit mehr als 100 Anfragen im Zeitraum: ${users.map((u) => `${u.userName} (${u.requestCount} Anfragen)`).join(", ")}.`,
        details: { users },
        detectedAt,
      });
    }

    // --- 5. Failed Auth Attempts (>20 401 responses) ---
    const authFailureCount = await prisma.apiLog.count({
      where: {
        ...whereClause,
        statusCode: 401,
      },
    });

    if (authFailureCount > 20) {
      anomalies.push({
        id: "auth-failures",
        type: "auth-failures",
        severity: "medium",
        title: "Viele fehlgeschlagene Authentifizierungen",
        description: `${authFailureCount} fehlgeschlagene Authentifizierungsversuche (HTTP 401) im Zeitraum erkannt. Der Schwellenwert von 20 wurde überschritten. Dies könnte auf einen Brute-Force-Angriff hindeuten.`,
        details: {
          count: authFailureCount,
          threshold: 20,
        },
        detectedAt,
      });
    }

    // --- 6. Server Errors (any 500 status codes) ---
    const serverErrorsRaw = await prisma.$queryRaw<
      Array<{ path: string; count: bigint; latest_error: string | null }>
    >(
      Prisma.sql`
        SELECT
          "path",
          COUNT(*)::bigint AS count,
          (
            SELECT "errorMessage"
            FROM "ApiLog" a2
            WHERE a2."path" = "ApiLog"."path"
              AND a2."statusCode" = 500
              AND a2."createdAt" >= ${since}
            ORDER BY a2."createdAt" DESC
            LIMIT 1
          ) AS latest_error
        FROM "ApiLog"
        WHERE "createdAt" >= ${since}
          AND "statusCode" = 500
        GROUP BY "path"
        ORDER BY count DESC
      `
    );

    if (serverErrorsRaw.length > 0) {
      const affectedPaths = serverErrorsRaw.map((row) => ({
        path: row.path,
        count: Number(row.count),
        latestError: row.latest_error,
      }));

      const totalServerErrors = affectedPaths.reduce((sum, p) => sum + p.count, 0);

      anomalies.push({
        id: "server-errors",
        type: "server-errors",
        severity: "high",
        title: "Serverfehler aufgetreten",
        description: `${totalServerErrors} Serverfehler (HTTP 500) auf ${affectedPaths.length} Endpunkt${affectedPaths.length === 1 ? "" : "en"} erkannt: ${affectedPaths.map((p) => `${p.path} (${p.count}x)`).join(", ")}.`,
        details: { totalServerErrors, affectedPaths },
        detectedAt,
      });
    }

    // --- Health Score Calculation ---
    let healthScore = 100;
    for (const anomaly of anomalies) {
      switch (anomaly.severity) {
        case "high":
          healthScore -= 30;
          break;
        case "medium":
          healthScore -= 15;
          break;
        case "low":
          healthScore -= 5;
          break;
      }
    }
    healthScore = Math.max(0, healthScore);

    return NextResponse.json({
      anomalies,
      healthScore,
      checkedAt: detectedAt,
    });
  } catch (error) {
    logger.error({ err: error }, "Error detecting anomalies");
    return NextResponse.json(
      { error: "Interner Serverfehler bei der Anomalie-Erkennung" },
      { status: 500 }
    );
  }
}
