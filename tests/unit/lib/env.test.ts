import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("env", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("throws when SQL_DATABASE_URL is missing", async () => {
    delete process.env.SQL_DATABASE_URL;
    process.env.NEXTAUTH_SECRET = "test-secret";
    await expect(() => import("@/lib/env")).rejects.toThrow("SQL_DATABASE_URL");
  });

  it("throws when NEXTAUTH_SECRET is missing", async () => {
    process.env.SQL_DATABASE_URL = "postgres://test";
    delete process.env.NEXTAUTH_SECRET;
    await expect(() => import("@/lib/env")).rejects.toThrow("NEXTAUTH_SECRET");
  });

  it("uses default values for optional vars", async () => {
    process.env.SQL_DATABASE_URL = "postgres://test";
    process.env.NEXTAUTH_SECRET = "test-secret";
    delete process.env.NEXTAUTH_URL;
    delete process.env.LOG_LEVEL;
    const { env } = await import("@/lib/env");
    expect(env.NEXTAUTH_URL).toBe("http://localhost:3000");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.BGG_API_URL).toBe("https://boardgamegeek.com/xmlapi2");
    expect(env.SMTP_HOST).toBe("localhost");
    expect(env.SMTP_PORT).toBe("2525");
  });

  it("reads env vars when all are set", async () => {
    process.env.SQL_DATABASE_URL = "postgres://mydb";
    process.env.NEXTAUTH_SECRET = "my-secret";
    process.env.NEXTAUTH_URL = "https://example.com";
    process.env.LOG_LEVEL = "debug";
    const { env } = await import("@/lib/env");
    expect(env.DATABASE_URL).toBe("postgres://mydb");
    expect(env.NEXTAUTH_SECRET).toBe("my-secret");
    expect(env.NEXTAUTH_URL).toBe("https://example.com");
    expect(env.LOG_LEVEL).toBe("debug");
  });
});
