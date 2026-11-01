import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { mockProbe, mockRateLimit } = vi.hoisted(() => ({ mockProbe: vi.fn(), mockRateLimit: vi.fn() }));
vi.mock("@/lib/health/database-probe", () => ({ probeDatabase: mockProbe }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mockRateLimit }));

import { GET } from "@/app/api/health/ready/route";

const token = "readiness-token-for-tests-only-1234567890";

describe("GET /api/health/ready", () => {
  beforeEach(() => {
    vi.stubEnv("HEALTH_READINESS_TOKEN", token);
    mockProbe.mockResolvedValue({ status: "healthy", responseTimeMs: 12 });
    mockRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
  });

  afterEach(() => vi.unstubAllEnvs());

  it("rejects missing or invalid Bearer credentials without probing the database", async () => {
    const missing = await GET(new NextRequest("http://localhost/api/health/ready"));
    const invalid = await GET(new NextRequest("http://localhost/api/health/ready", { headers: { authorization: "Bearer wrong" } }));

    expect(missing.status).toBe(401);
    expect(invalid.status).toBe(401);
    expect(mockProbe).not.toHaveBeenCalled();
    expect(missing.headers.get("cache-control")).toBe("no-store");
  });

  it("fails closed when the server token is missing or too short", async () => {
    vi.stubEnv("HEALTH_READINESS_TOKEN", "short");
    const response = await GET(new NextRequest("http://localhost/api/health/ready", { headers: { authorization: "Bearer short" } }));

    expect(response.status).toBe(503);
    expect(mockProbe).not.toHaveBeenCalled();
    expect(JSON.stringify(await response.json())).not.toContain("short");
  });

  it("returns bounded readiness details for a valid token and throttles authenticated probes", async () => {
    const request = () => new NextRequest("http://localhost/api/health/ready", { headers: { authorization: `Bearer ${token}` } });
    const response = await GET(request());

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      check: "readiness",
      status: "healthy",
      version: expect.any(String),
      timestamp: expect.any(String),
      database: { status: "healthy", responseTimeMs: 12 },
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    mockRateLimit.mockReturnValueOnce({ allowed: false, retryAfterMs: 10_000 });
    const limited = await GET(request());
    expect(limited.status).toBe(429);
  });

  it("returns 200 for a degraded probe and 503 without raw database errors for an unhealthy probe", async () => {
    mockProbe.mockResolvedValueOnce({ status: "degraded", responseTimeMs: 1_200 });
    mockProbe.mockResolvedValueOnce({ status: "unhealthy", responseTimeMs: 2_000 });
    const request = new NextRequest("http://localhost/api/health/ready", { headers: { authorization: `Bearer ${token}` } });

    const degraded = await GET(request);
    const unhealthy = await GET(request);
    expect(degraded.status).toBe(200);
    expect(unhealthy.status).toBe(503);
    expect(JSON.stringify(await unhealthy.json())).not.toMatch(/password|connection|SQL|private/i);
  });
});
