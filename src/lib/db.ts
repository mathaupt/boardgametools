import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "@/lib/env";
import { parsePoolConfig } from "@/lib/db-pool-config";

export { parsePoolConfig } from "@/lib/db-pool-config";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

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
