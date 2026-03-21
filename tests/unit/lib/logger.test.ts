import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("logger", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("exports a logger with standard methods", async () => {
    const logger = (await import("@/lib/logger")).default;
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.debug).toBe("function");
  });

  it("uses debug level in non-production", async () => {
    process.env.NODE_ENV = "development";
    delete process.env.LOG_LEVEL;
    const logger = (await import("@/lib/logger")).default;
    expect(logger.level).toBe("debug");
  });

  it("respects LOG_LEVEL env var", async () => {
    process.env.LOG_LEVEL = "warn";
    const logger = (await import("@/lib/logger")).default;
    expect(logger.level).toBe("warn");
  });
});
