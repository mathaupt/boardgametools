import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  findFirst: vi.fn(),
  searchBGGGames: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/api-logger", () => ({
  withApiLogging: (handler: (request: Request) => Promise<unknown>) => async (request: Request) => {
    try { return await handler(request); }
    catch (error) {
      const apiError = error as Error & { statusCode?: number };
      return { status: apiError.statusCode ?? 500, body: { error: apiError.message } };
    }
  },
}));
vi.mock("@/lib/db", () => ({ default: { game: { findFirst: mocks.findFirst } } }));
vi.mock("@/lib/bgg", () => ({ searchBGGGames: mocks.searchBGGGames }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn(), debug: vi.fn() } }));

import { GET } from "@/app/api/barcode/lookup/route";

const request = (ean: string) => {
  const url = `http://localhost/api/barcode/lookup?ean=${encodeURIComponent(ean)}`;
  return Object.assign(new Request(url), { nextUrl: new URL(url) });
};

describe("GET /api/barcode/lookup", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
    mocks.findFirst.mockResolvedValue(null);
    mocks.searchBGGGames.mockResolvedValue([]);
    mocks.fetch.mockReset();
    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("requires login and rejects missing or too-short barcodes", async () => {
    mocks.requireAuth.mockRejectedValueOnce(Object.assign(new Error("Unauthorized"), { statusCode: 401 }));
    expect((await (GET as Function)(request("12345678"))).status).toBe(401);
    expect((await (GET as Function)(request("1234567"))).status).toBe(400);
    expect((await (GET as Function)(request(""))).status).toBe(400);
    expect(mocks.findFirst).not.toHaveBeenCalled();
  });

  it("returns an owner-scoped local game without contacting external providers", async () => {
    const game = { id: "game-1", ownerId: "user-1", name: "Catan" };
    mocks.findFirst.mockResolvedValueOnce(game);

    const response = await (GET as Function)(request("4010350612428"));

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ source: "local", ean: "4010350612428", localGame: game, bggResults: [] });
    expect(mocks.findFirst).toHaveBeenCalledWith({ where: { ean: "4010350612428", ownerId: "user-1", deletedAt: null } });
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("returns a not-found result when the product provider has no match", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({ total: 0, items: [] }), { status: 200 }));

    const response = await (GET as Function)(request("4010350612428"));

    expect(response.body).toEqual({
      source: "not_found", ean: "4010350612428", localGame: null, productName: null, bggResults: [],
    });
    expect(mocks.searchBGGGames).not.toHaveBeenCalled();
  });

  it("searches BGG with a cleaned product title and returns bounded results", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      total: 1,
      items: [{ ean: "4010350612428", title: "Kosmos 692865 - Catan (German Edition)", brand: "Kosmos" }],
    }), { status: 200 }));
    mocks.searchBGGGames.mockResolvedValueOnce(Array.from({ length: 12 }, (_, index) => ({ bggId: String(index), name: `Game ${index}` })));

    const response = await (GET as Function)(request("4010350612428"));

    expect(mocks.searchBGGGames).toHaveBeenCalledWith("Catan");
    expect(response.status).toBe(200);
    expect(response.body.source).toBe("upcitemdb");
    expect(response.body.cleanedName).toBe("Catan");
    expect(response.body.bggResults).toHaveLength(10);
    expect(mocks.fetch).toHaveBeenCalledWith(
      "https://api.upcitemdb.com/prod/trial/lookup?upc=4010350612428",
      { headers: { Accept: "application/json" } },
    );
  });

  it("continues with a bare product title when UPC lookup fails", async () => {
    mocks.fetch.mockRejectedValueOnce(new Error("provider unavailable"));

    const response = await (GET as Function)(request("4010350612428"));

    expect(response.status).toBe(200);
    expect(response.body.source).toBe("not_found");
    expect(mocks.searchBGGGames).not.toHaveBeenCalled();
  });

  it("returns a generic server error when BGG lookup fails", async () => {
    mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({
      total: 1,
      items: [{ ean: "4010350612428", title: "Catan", brand: "" }],
    }), { status: 200 }));
    mocks.searchBGGGames.mockRejectedValueOnce(new Error("BGG internal detail"));

    const response = await (GET as Function)(request("4010350612428"));

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: "Interner Serverfehler" });
  });
});
