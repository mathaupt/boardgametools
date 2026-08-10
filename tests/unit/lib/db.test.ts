import { describe, it, expect } from "vitest";
import { prisma, default as prismaDefault, parsePoolConfig } from "@/lib/db";

describe("db", () => {
  it("exports a prisma client instance", () => {
    expect(prisma).toBeDefined();
    expect(typeof prisma.$connect).toBe("function");
    expect(typeof prisma.$disconnect).toBe("function");
  });

  it("default export is same as named export", () => {
    expect(prismaDefault).toBe(prisma);
  });
});

describe("parsePoolConfig", () => {
  it("returns defaults for a URL without pool query params", () => {
    const config = parsePoolConfig("postgres://u:p@host:5432/db");
    expect(config.connectionString).toBe("postgres://u:p@host:5432/db");
    expect(config.max).toBe(10);
    expect(config.connectionTimeoutMillis).toBe(10_000);
    expect(config.idleTimeoutMillis).toBe(20_000);
  });

  it("parses connection_limit, connect_timeout and pool_timeout from the URL", () => {
    const config = parsePoolConfig(
      "postgres://u:p@host:5432/db?connection_limit=5&connect_timeout=15&pool_timeout=8"
    );
    expect(config.connectionString).toBe("postgres://u:p@host:5432/db");
    expect(config.max).toBe(5);
    expect(config.connectionTimeoutMillis).toBe(15_000);
    expect(config.idleTimeoutMillis).toBe(8_000);
  });

  it("strips Prisma/PgBouncer-specific params from the connection string", () => {
    const config = parsePoolConfig(
      "postgres://u:p@host:5432/db?pgbouncer=true&connect_timeout=12&connection_limit=1"
    );
    expect(config.connectionString).toBe("postgres://u:p@host:5432/db");
    expect(config.connectionString).not.toContain("pgbouncer");
    expect(config.connectionTimeoutMillis).toBe(12_000);
    expect(config.max).toBe(1);
  });

  it("uses max=1 on Vercel when no connection_limit is set", () => {
    const original = process.env.VERCEL;
    process.env.VERCEL = "1";
    const config = parsePoolConfig("postgres://u:p@host:5432/db");
    expect(config.max).toBe(1);
    process.env.VERCEL = original;
  });

  it("ignores invalid or zero query params and falls back to defaults", () => {
    const config = parsePoolConfig(
      "postgres://u:p@host:5432/db?connection_limit=abc&connect_timeout=0&pool_timeout=-5"
    );
    expect(config.max).toBe(10);
    expect(config.connectionTimeoutMillis).toBe(10_000);
    expect(config.idleTimeoutMillis).toBe(20_000);
  });
});
