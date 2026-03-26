import { PrismaClient } from "@prisma/client";
import { env } from "@/lib/env";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Append connection pool parameters if not already present
function getDatasourceUrl(): string {
  const url = env.DATABASE_URL;
  if (!url || url.includes("connection_limit") || url.includes("pool_timeout")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}connection_limit=10&pool_timeout=20`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: getDatasourceUrl(),
    log: env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
