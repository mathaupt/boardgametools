import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body, status: init?.status ?? 200, headers: new Headers(init?.headers),
    }),
  },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/event-share", () => ({ findPublicEventByToken: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn(async () => ({ allowed: true, retryAfterMs: 0 })),
  rateLimitResponse: vi.fn((ms: number) => ({ status: 429, headers: new Headers({ "Retry-After": String(ms / 1000) }) })),
}));
vi.mock("@/lib/events/event-state", () => ({ evaluateEventState: vi.fn(() => ({ available: { proposeGame: true } })) }));
vi.mock("@/lib/bgg-catalog", () => ({
  searchBggCatalog: vi.fn(),
  getBggCatalogDetail: vi.fn(),
  BggCatalogError: class BggCatalogError extends Error { constructor(public status: number, message: string) { super(message); } },
}));

import { findPublicEventByToken } from "@/lib/event-share";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import { evaluateEventState } from "@/lib/events/event-state";
import { BggCatalogError, getBggCatalogDetail, searchBggCatalog } from "@/lib/bgg-catalog";
import { GET } from "@/app/api/public/event/[token]/bgg/route";

const request = (query = "Catan") => new Request(`http://localhost/api/public/event/token/bgg?query=${encodeURIComponent(query)}`);
const context = { params: Promise.resolve({ token: "token" }) };
const event = {
  id: "event-1", status: "voting", eventDate: new Date("2026-12-01T18:00:00Z"),
  selectedDate: null, selectedGameId: null, winningProposalId: null, deletedAt: null,
};

describe("GET /api/public/event/[token]/bgg", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findPublicEventByToken).mockResolvedValue(event as never);
    vi.mocked(searchBggCatalog).mockResolvedValue([]);
    vi.mocked(evaluateEventState).mockReturnValue({ available: { proposeGame: true } } as never);
  });

  it("allows token-scoped catalog search without requiring a session", async () => {
    const match = { bggId: "13", name: "Catan", yearPublished: 1995, imageUrl: null };
    vi.mocked(searchBggCatalog).mockResolvedValue([match]);
    const response = await (GET as Function)(request(), context);
    expect(response.status).toBe(200);
    expect(response.body).toEqual([match]);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(findPublicEventByToken).toHaveBeenCalledWith("token");
    expect(searchBggCatalog).toHaveBeenCalledWith("Catan", expect.any(AbortSignal));
  });

  it("rejects invalid input and missing events before contacting BGG", async () => {
    expect((await (GET as Function)(request("x"), context)).status).toBe(400);
    vi.mocked(findPublicEventByToken).mockResolvedValue(null as never);
    expect((await (GET as Function)(request(), context)).status).toBe(404);
    expect(searchBggCatalog).not.toHaveBeenCalled();
  });

  it("blocks catalog access when event proposals are closed", async () => {
    vi.mocked(evaluateEventState).mockReturnValue({ available: { proposeGame: false } } as never);
    const response = await (GET as Function)(request(), context);
    expect(response.status).toBe(409);
    expect(searchBggCatalog).not.toHaveBeenCalled();
  });

  it("supports numeric detail lookup through the same event guard", async () => {
    const detail = { bggId: "13", name: "Catan" };
    vi.mocked(getBggCatalogDetail).mockResolvedValue(detail as never);
    const response = await (GET as Function)(new Request("http://localhost/api/public/event/token/bgg?bggId=13"), context);
    expect(response.status).toBe(200);
    expect(response.body).toEqual(detail);
    expect(getBggCatalogDetail).toHaveBeenCalledWith("13", expect.any(AbortSignal));
  });

  it("rejects both or neither catalog selector", async () => {
    expect((await (GET as Function)(new Request("http://localhost/api/public/event/token/bgg"), context)).status).toBe(400);
    expect((await (GET as Function)(new Request("http://localhost/api/public/event/token/bgg?query=Catan&bggId=13"), context)).status).toBe(400);
  });

  it("rejects repeated selector parameters", async () => {
    const response = await (GET as Function)(new Request("http://localhost/api/public/event/token/bgg?query=one&query=two"), context);
    expect(response.status).toBe(400);
  });

  it("preserves the documented upstream error status", async () => {
    vi.mocked(searchBggCatalog).mockRejectedValue(new BggCatalogError(503, "BGG nicht verfügbar"));
    const response = await (GET as Function)(request(), context);
    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: "BGG nicht verfügbar" });
    expect(response.headers.get("Cache-Control")).toContain("no-store");
  });

  it("applies a separate public BGG rate-limit bucket", async () => {
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: false, retryAfterMs: 3000 });
    expect((await (GET as Function)(request(), context)).status).toBe(429);
    expect(checkRateLimitAsync).toHaveBeenCalledWith(expect.stringContaining("pub-bgg:"), 20, 60_000);
  });
});
