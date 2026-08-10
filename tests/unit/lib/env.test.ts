import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { env } from "@/lib/env";

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws when no database URL is set", () => {
    delete process.env.SQL_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    expect(() => env.DATABASE_URL).toThrow("SQL_DATABASE_URL");
  });

  it("falls back to DATABASE_URL when SQL_DATABASE_URL is not set", () => {
    delete process.env.SQL_DATABASE_URL;
    delete process.env.POSTGRES_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    process.env.DATABASE_URL = "postgres://fallback";
    expect(env.DATABASE_URL).toBe("postgres://fallback");
  });

  it("falls back to POSTGRES_URL when neither SQL_DATABASE_URL nor DATABASE_URL is set", () => {
    delete process.env.SQL_DATABASE_URL;
    delete process.env.DATABASE_URL;
    delete process.env.POSTGRES_URL_NON_POOLING;
    process.env.POSTGRES_URL = "postgres://vercel-postgres";
    expect(env.DATABASE_URL).toBe("postgres://vercel-postgres");
  });

  it("throws when NEXTAUTH_SECRET is missing", () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(() => env.NEXTAUTH_SECRET).toThrow("NEXTAUTH_SECRET");
  });

  it("uses default values for optional vars", () => {
    delete process.env.NEXTAUTH_URL;
    delete process.env.LOG_LEVEL;
    expect(env.NEXTAUTH_URL).toBe("http://localhost:3000");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.BGG_API_URL).toBe("https://boardgamegeek.com/xmlapi2");
    expect(env.SMTP_HOST).toBe("localhost");
    expect(env.SMTP_PORT).toBe(587);
  });

  it("reads env vars when all are set", () => {
    process.env.SQL_DATABASE_URL = "postgres://mydb";
    process.env.NEXTAUTH_SECRET = "my-secret";
    process.env.NEXTAUTH_URL = "https://example.com";
    process.env.LOG_LEVEL = "debug";
    expect(env.DATABASE_URL).toBe("postgres://mydb");
    expect(env.NEXTAUTH_SECRET).toBe("my-secret");
    expect(env.NEXTAUTH_URL).toBe("https://example.com");
    expect(env.LOG_LEVEL).toBe("debug");
  });
});
