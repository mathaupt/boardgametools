import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  handleApiError: vi.fn((error: Error & { statusCode?: number }) => ({
    status: error.statusCode ?? 500,
    body: { error: error.message },
  })),
  checkRateLimit: vi.fn(),
  rateLimitResponse: vi.fn((retryAfterMs: number) => ({ status: 429, body: { retryAfterMs } })),
  fetch: vi.fn(),
  ApiError: class ApiError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: mocks.requireAuth,
  handleApiError: mocks.handleApiError,
  ApiError: mocks.ApiError,
}));
vi.mock("@/lib/api-logger", () => ({
  withApiLogging: (handler: (request: Request) => Promise<unknown>) => async (request: Request) => {
    try { return await handler(request); }
    catch (error) { return mocks.handleApiError(error as Error & { statusCode?: number }); }
  },
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitResponse: mocks.rateLimitResponse,
}));
vi.mock("@/lib/env", () => ({ env: { BGG_AUTH_TOKEN: "test-bgg-token" } }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }));

import { GET } from "@/app/api/bgg/route";

const request = (query: string) => new Request(`http://localhost/api/bgg?${query}`, {
  headers: { "x-forwarded-for": "192.0.2.10" },
});
const xml = (body: string) => new Response(body, { status: 200 });

describe("GET /api/bgg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.checkRateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
    mocks.fetch.mockReset();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("requires authentication before looking up BGG data", async () => {
    mocks.requireAuth.mockRejectedValue(new mocks.ApiError(401, "Unauthorized"));

    const response = await (GET as Function)(request("query=Catan"));

    expect(response.status).toBe(401);
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.handleApiError).toHaveBeenCalled();
  });

  it("rate-limits requests by the forwarded client IP", async () => {
    mocks.checkRateLimit.mockReturnValue({ allowed: false, retryAfterMs: 2500 });

    const response = await (GET as Function)(request("query=Catan"));

    expect(response.status).toBe(429);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith("bgg:192.0.2.10", 20, 60_000);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects invalid BGG ids and query lengths before contacting the provider", async () => {
    expect((await (GET as Function)(request("bggId=1%26query=other"))).status).toBe(400);
    expect((await (GET as Function)(request("query=x"))).status).toBe(400);
    expect((await (GET as Function)(request(`query=${"x".repeat(201)}`))).status).toBe(400);
    expect((await (GET as Function)(request(""))).status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("returns normalized game details and sends the optional BGG token", async () => {
    mocks.fetch.mockResolvedValueOnce(xml(
      '<items><item><name type="primary" value="Catan"/><description>Ein Spiel &amp; mehr</description><yearpublished value="1995"/><minplayers value="3"/><maxplayers value="4"/><playingtime value="60"/><statistics><ratings><average value="7.2"/><ranks><rank value="42"/></ranks><averageweight value="2.3"/></ratings></statistics><image>https://images.example/catan&amp;large.jpg</image></item></items>'
    ));

    const response = await (GET as Function)(request("bggId=13"));

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      bggId: "13",
      name: "Catan",
      yearPublished: "1995",
      minPlayers: "3",
      maxPlayers: "4",
      playTimeMinutes: "60",
      complexity: "2.3",
      rating: "7.2",
      rank: "42",
    });
    expect(response.body.imageUrl).toContain("catan&large.jpg");
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://boardgamegeek.com/xmlapi2/thing?id=13&stats=1",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer test-bgg-token" }) }),
    );
  });

  it("reports a missing game when the BGG detail response has no name", async () => {
    mocks.fetch.mockResolvedValueOnce(xml("<items><item><yearpublished value=\"1995\"/></item></items>"));

    const response = await (GET as Function)(request("bggId=13"));

    expect(response.status).toBe(404);
    expect(mocks.handleApiError).not.toHaveBeenCalled();
  });

  it("searches BGG and enriches results with one batched thumbnail request", async () => {
    mocks.fetch
      .mockResolvedValueOnce(xml('<items><item type="boardgame" id="13"><name type="primary" value="Catan"/><yearpublished value="1995"/></item><item type="boardgame" id="822"><name type="primary" value="Carcassonne"/></item></items>'))
      .mockResolvedValueOnce(xml('<items><item id="13"><thumbnail>https://images.example/catan-thumb.jpg</thumbnail></item><item id="822"><image>https://images.example/carcassonne.jpg</image></item></items>'));

    const response = await (GET as Function)(request(`query=${encodeURIComponent("Catan & friends")}`));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { bggId: "13", name: "Catan", yearPublished: "1995", type: "boardgame", imageUrl: "https://images.example/catan-thumb.jpg" },
      { bggId: "822", name: "Carcassonne", yearPublished: "", type: "boardgame", imageUrl: "https://images.example/carcassonne.jpg" },
    ]);
    expect(mocks.fetch.mock.calls[0][0]).toContain("query=Catan%20%26%20friends");
    expect(mocks.fetch.mock.calls[1][0]).toBe("https://boardgamegeek.com/xmlapi2/thing?id=13,822");
  });

  it("keeps search results available if the optional thumbnail request fails", async () => {
    mocks.fetch
      .mockResolvedValueOnce(xml('<items><item type="boardgame" id="13"><name type="primary" value="Catan"/></item></items>'))
      .mockRejectedValueOnce(new Error("thumbnail service unavailable"));

    const response = await (GET as Function)(request("query=Catan"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual([{ bggId: "13", name: "Catan", yearPublished: "", type: "boardgame" }]);
  });

  it("handles upstream failures and oversized BGG responses without exposing internals", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response("", { status: 502, statusText: "Bad Gateway" }));
    const upstreamFailure = await (GET as Function)(request("bggId=13"));
    expect(upstreamFailure.status).toBe(500);
    expect(upstreamFailure.body).toEqual({ error: "BGG API Error" });

    mocks.fetch.mockResolvedValueOnce(new Response("<items/>", {
      status: 200,
      headers: { "content-length": String(2 * 1024 * 1024 + 1) },
    }));
    const oversized = await (GET as Function)(request("bggId=13"));
    expect(oversized.status).toBe(500);
    expect(oversized.body).toEqual({ error: "BGG API response too large" });
  });
});
