import { getReadinessPrisma } from "@/lib/health/readiness-prisma";

export type DatabaseProbeStatus = "healthy" | "degraded" | "unhealthy";

export interface DatabaseProbeResult {
  status: DatabaseProbeStatus;
  responseTimeMs: number;
}

const MAX_PROBE_MS = 2_000;
const DEGRADED_AFTER_MS = 1_000;
let inFlightProbe: Promise<DatabaseProbeResult> | null = null;

export function probeDatabase(): Promise<DatabaseProbeResult> {
  if (inFlightProbe) return inFlightProbe;

  const current = runProbe();
  inFlightProbe = current;
  return current.finally(() => {
    if (inFlightProbe === current) inFlightProbe = null;
  });
}

async function runProbe(): Promise<DatabaseProbeResult> {
  const startedAt = Date.now();
  try {
    const prisma = await getReadinessPrisma();
    await prisma.$transaction(async (transaction) => {
      await transaction.$executeRaw`SET LOCAL statement_timeout = '1500ms'`;
      await transaction.$queryRaw`SELECT 1`;
    }, { maxWait: 1_000, timeout: MAX_PROBE_MS });

    const responseTimeMs = Date.now() - startedAt;
    return {
      status: responseTimeMs >= DEGRADED_AFTER_MS ? "degraded" : "healthy",
      responseTimeMs,
    };
  } catch {
    return { status: "unhealthy", responseTimeMs: Math.min(Date.now() - startedAt, MAX_PROBE_MS) };
  }
}
