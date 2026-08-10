import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Query parameters consumed by the PrismaPg/Pool configuration.
// They are stripped from the connection string so node-postgres does not try to
// send them as Postgres GUCs.
const POOL_CONFIG_PARAMS = ["connection_limit", "connect_timeout", "pool_timeout"];

interface PoolConfig {
  connectionString: string;
  max: number;
  connectionTimeoutMillis: number;
  idleTimeoutMillis: number;
}

function getDefaultPoolSize(): number {
  // On Vercel serverless keep the local pool small. The upstream Postgres pooler
  // (PgBouncer / Vercel Postgres pool) handles concurrency across invocations.
  return process.env.VERCEL === "1" ? 1 : 10;
}

function getDefaultConnectionTimeoutMillis(): number {
  // Vercel cold starts + TLS handshakes can take longer than the old 5s default.
  return 10_000;
}

export function parsePoolConfig(url: string): PoolConfig {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    // If the URL is not parseable, fall back to the string as-is and use defaults.
    return {
      connectionString: url,
      max: getDefaultPoolSize(),
      connectionTimeoutMillis: getDefaultConnectionTimeoutMillis(),
      idleTimeoutMillis: 20_000,
    };
  }

  const params = parsed.searchParams;

  let max = getDefaultPoolSize();
  const connectionLimit = params.get("connection_limit");
  if (connectionLimit) {
    const n = parseInt(connectionLimit, 10);
    if (!isNaN(n) && n > 0) {
      max = n;
    }
  }

  let connectionTimeoutMillis = getDefaultConnectionTimeoutMillis();
  const connectTimeout = params.get("connect_timeout");
  if (connectTimeout) {
    const n = parseInt(connectTimeout, 10);
    if (!isNaN(n) && n > 0) {
      connectionTimeoutMillis = n * 1000;
    }
  }

  let idleTimeoutMillis = 20_000;
  const poolTimeout = params.get("pool_timeout");
  if (poolTimeout) {
    const n = parseInt(poolTimeout, 10);
    if (!isNaN(n) && n >= 0) {
      idleTimeoutMillis = n * 1000;
    }
  }

  for (const key of POOL_CONFIG_PARAMS) {
    params.delete(key);
  }
  // PgBouncer hint used by Prisma ORM / Vercel Postgres; node-postgres does not understand it.
  params.delete("pgbouncer");

  return {
    connectionString: parsed.toString(),
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
  };
}

function createPrismaClient(): PrismaClient {
  const rawUrl = env.DATABASE_URL;
  const { connectionString, max, connectionTimeoutMillis, idleTimeoutMillis } =
    parsePoolConfig(rawUrl);

  const adapter = new PrismaPg({
    connectionString,
    max,
    connectionTimeoutMillis,
    idleTimeoutMillis,
  });

  return new PrismaClient({
    adapter,
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;

export default prisma;
