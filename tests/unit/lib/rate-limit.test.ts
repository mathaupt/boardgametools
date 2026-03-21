import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("rate-limit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
  });

  async function freshImport() {
    return await import("@/lib/rate-limit");
  }

  describe("checkRateLimit", () => {
    it("allows the first request", async () => {
      const { checkRateLimit } = await freshImport();
      const result = checkRateLimit("ip-1");
      expect(result.allowed).toBe(true);
      expect(result.retryAfterMs).toBe(0);
    });

    it("allows requests under the limit", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        expect(checkRateLimit("ip-2").allowed).toBe(true);
      }
    });

    it("blocks requests exceeding the limit", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        checkRateLimit("ip-3");
      }
      const result = checkRateLimit("ip-3");
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    });

    it("uses custom maxRequests", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 3; i++) {
        expect(checkRateLimit("ip-4", 3).allowed).toBe(true);
      }
      expect(checkRateLimit("ip-4", 3).allowed).toBe(false);
    });

    it("different identifiers are independent", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        checkRateLimit("ip-a");
      }
      expect(checkRateLimit("ip-a").allowed).toBe(false);
      expect(checkRateLimit("ip-b").allowed).toBe(true);
    });

    it("resets after window expires", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        checkRateLimit("ip-5");
      }
      expect(checkRateLimit("ip-5").allowed).toBe(false);

      vi.advanceTimersByTime(60_001);

      expect(checkRateLimit("ip-5").allowed).toBe(true);
    });

    it("uses custom windowMs", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        checkRateLimit("ip-6", 10, 5_000);
      }
      expect(checkRateLimit("ip-6", 10, 5_000).allowed).toBe(false);

      vi.advanceTimersByTime(5_001);

      expect(checkRateLimit("ip-6", 10, 5_000).allowed).toBe(true);
    });

    it("returns correct retryAfterMs when blocked", async () => {
      const { checkRateLimit } = await freshImport();
      for (let i = 0; i < 10; i++) {
        checkRateLimit("ip-7", 10, 30_000);
      }
      const result = checkRateLimit("ip-7", 10, 30_000);
      expect(result.allowed).toBe(false);
      expect(result.retryAfterMs).toBeGreaterThan(0);
      expect(result.retryAfterMs).toBeLessThanOrEqual(30_000);
    });
  });

  describe("rateLimitResponse", () => {
    it("returns 429 status", async () => {
      const { rateLimitResponse } = await freshImport();
      const response = rateLimitResponse(30_000);
      expect(response.status).toBe(429);
    });

    it("sets Retry-After header in seconds", async () => {
      const { rateLimitResponse } = await freshImport();
      const response = rateLimitResponse(30_000);
      expect(response.headers.get("Retry-After")).toBe("30");
    });

    it("returns JSON error body", async () => {
      const { rateLimitResponse } = await freshImport();
      const response = rateLimitResponse(5_000);
      const body = await response.json();
      expect(body.error).toBeTruthy();
    });

    it("rounds Retry-After up to nearest second", async () => {
      const { rateLimitResponse } = await freshImport();
      const response = rateLimitResponse(1_500);
      expect(response.headers.get("Retry-After")).toBe("2");
    });
  });
});
