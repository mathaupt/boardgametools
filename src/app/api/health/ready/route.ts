import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getAppVersion } from "@/lib/app-version";
import { checkRateLimit } from "@/lib/rate-limit";
import { hasValidReadinessAuthorization, isReadinessTokenConfigured } from "@/lib/health/readiness-auth";
import { probeDatabase } from "@/lib/health/database-probe";

export const runtime = "nodejs";
const NO_STORE = { "Cache-Control": "no-store" };

export async function GET(request: NextRequest) {
  const token = env.HEALTH_READINESS_TOKEN;
  if (!isReadinessTokenConfigured(token)) {
    return NextResponse.json({ error: "Readiness ist nicht konfiguriert." }, { status: 503, headers: NO_STORE });
  }

  if (!hasValidReadinessAuthorization(request.headers.get("authorization"), token)) {
    return NextResponse.json({ error: "Nicht authentifiziert." }, { status: 401, headers: NO_STORE });
  }

  const { allowed, retryAfterMs } = checkRateLimit("health-readiness:authenticated", 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Zu viele Readiness-Anfragen." }, {
      status: 429,
      headers: { ...NO_STORE, "Retry-After": String(Math.ceil(retryAfterMs / 1_000)) },
    });
  }

  const database = await probeDatabase();
  const status = database.status;
  return NextResponse.json({
    check: "readiness",
    status,
    version: getAppVersion(),
    timestamp: new Date().toISOString(),
    database: { status, responseTimeMs: database.responseTimeMs },
  }, { status: status === "unhealthy" ? 503 : 200, headers: NO_STORE });
}
