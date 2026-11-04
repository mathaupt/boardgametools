import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ get: vi.fn(), limit: vi.fn(), limitedResponse: vi.fn(), json: vi.fn((body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({ body, status: init?.status ?? 200, headers: init?.headers })) }));
vi.mock("next/server", () => ({ NextResponse: { json: mocks.json } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimitAsync: mocks.limit, rateLimitResponse: mocks.limitedResponse }));
vi.mock("@/lib/services/profile.service", () => ({ ProfileService: { getPublicProfile: mocks.get } }));

import { POST } from "@/app/api/public/profile/route";

describe("POST /api/public/profile", () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.limit.mockResolvedValue({ allowed: true, retryAfterMs: 0 }); });

  it("returns the same not-found response for invalid, disabled, or revoked links", async () => {
    mocks.get.mockResolvedValue(null);
    const request = new Request("http://localhost/api/public/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: "invalid" }) }) as never;
    const response = await POST(request);
    expect(response).toMatchObject({ status: 404, body: { error: "Profil nicht gefunden." }, headers: { "Cache-Control": "private, no-store" } });
  });

  it("rate-limits and returns non-cacheable aggregate data without putting the bearer token in the request path", async () => {
    mocks.get.mockResolvedValue({ name: "Mara", badges: [], totals: { sessions: 2, gamesPlayed: 3, seriesCompleted: 0 } });
    const token = "x".repeat(43);
    const request = new Request("http://localhost/api/public/profile", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "127.0.0.1" }, body: JSON.stringify({ token }) }) as never;
    const response = await POST(request);
    expect(mocks.limit).toHaveBeenCalledWith("public-profile:127.0.0.1", 60, 60_000);
    expect(mocks.get).toHaveBeenCalledWith(token);
    expect(response).toMatchObject({ status: 200, body: { name: "Mara", totals: { sessions: 2 } }, headers: { "Cache-Control": "private, no-store" } });
  });
});
