import type { PrismaClient } from "@/generated/prisma/client";
import { env } from "@/lib/env";
import { parsePoolConfig } from "@/lib/db-pool-config";

type ReadinessClient = Pick<PrismaClient, "$transaction">;
const globalForReadiness = globalThis as typeof globalThis & {
  readinessPrisma?: Promise<ReadinessClient>;
};

export function getReadinessPrisma(): Promise<ReadinessClient> {
  if (!globalForReadiness.readinessPrisma) {
    const pending = createReadinessPrisma();
    const cached = pending.catch((error: unknown) => {
      if (globalForReadiness.readinessPrisma === cached) {
        delete globalForReadiness.readinessPrisma;
      }
      throw error;
    });
    globalForReadiness.readinessPrisma = cached;
  }
  return globalForReadiness.readinessPrisma;
}

async function createReadinessPrisma(): Promise<ReadinessClient> {
  const { connectionString } = parsePoolConfig(env.DATABASE_URL);
  const [{ PrismaClient: Prisma }, { PrismaPg }] = await Promise.all([
    import("@/generated/prisma/client"),
    import("@prisma/adapter-pg"),
  ]);

  const adapter = new PrismaPg({
    connectionString,
    max: 1,
    connectionTimeoutMillis: 1_000,
    idleTimeoutMillis: 1_000,
  });
  return new Prisma({ adapter, log: [] });
}
