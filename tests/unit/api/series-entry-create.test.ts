import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), series: vi.fn(), game: vi.fn(), entryFindFirst: vi.fn(), entryFindUnique: vi.fn(), entryCreate: vi.fn(), bgg: vi.fn(), importGame: vi.fn(), invalidate: vi.fn(), error: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.error }));
vi.mock("@/lib/db", () => ({ default: { gameSeries: { findFirst: m.series }, game: { findFirst: m.game }, gameSeriesEntry: { findFirst: m.entryFindFirst, findUnique: m.entryFindUnique, create: m.entryCreate } } }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: m.bgg }));
vi.mock("@/lib/bgg-import-game", () => ({ createOrReuseBggGame: m.importGame }));
vi.mock("@/lib/cache", () => ({ invalidateTag: m.invalidate }));
vi.mock("@/lib/cache-tags", () => ({ CacheTags: { userSeries: () => "series" } }));
vi.mock("@/lib/error-messages", () => ({ Errors: { SERIES_NOT_FOUND: "Reihe fehlt", GAME_NOT_FOUND: "Spiel fehlt", GAME_NOT_FOUND_BGG: "BGG-Spiel fehlt", GAME_ID_OR_BGG_ID_REQUIRED: "Spiel-ID fehlt" } }));
import { POST } from "@/app/api/series/[id]/entries/route";
const ctx = { params: Promise.resolve({ id: "series-1" }) };
const req = (body: unknown) => ({ json: async () => body });
const game = { id: "game-1", name: "Catan", description: null, imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 60, complexity: 3, bggId: "13" };
const entry = { id: "entry-1", gameId: "game-1", gameName: "Catan", gameDescription: null, gameImageUrl: null, minPlayers: 2, maxPlayers: 4, gamePlayTimeMinutes: 60, complexity: 3, bggId: "13", game };
beforeEach(() => {
  vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "owner" }); m.series.mockResolvedValue({ id: "series-1" });
  m.game.mockResolvedValue(game); m.entryFindFirst.mockResolvedValue(null); m.entryFindUnique.mockResolvedValue(null);
  m.entryCreate.mockResolvedValue(entry); m.bgg.mockResolvedValue({ name: "BGG Game", description: "d", imageUrl: null, minPlayers: 1, maxPlayers: 4, playTimeMinutes: 30, complexity: 2.4 });
  m.importGame.mockResolvedValue({ game }); m.error.mockImplementation((error: Error) => ({ status: 500, body: { error: error.message } }));
});
describe("POST series entries", () => {
  it("validates series, body shape, origin, identifiers, difficulty and temporary reason", async () => {
    m.series.mockResolvedValueOnce(null); expect(await POST(req({ gameId: "game-1" }) as never, ctx)).toMatchObject({ status: 404 });
    for (const body of [null, [], "bad", 4]) expect((await POST(req(body) as never, ctx)).status).toBe(400);
    const invalid = [
      { kind: "weird", gameId: "game-1" }, { gameId: "x".repeat(101) }, { gameId: 42 }, { bggId: "0" },
      { bggId: 1.2 }, { difficulty: "x".repeat(101) }, { reason: "BORROWED" }, { kind: "temporary", bggId: "13", reason: "BAD" },
      { kind: "temporary", gameId: "game-1", bggId: "13" }, { kind: "temporary", bggId: "" },
    ];
    for (const body of invalid) expect((await POST(req(body) as never, ctx)).status).toBe(400);
  });

  it("adds collection games, resolves BGG games already owned and imports missing owned games", async () => {
    expect(await POST(req({ gameId: "game-1", difficulty: "Easy" }) as never, ctx)).toMatchObject({ status: 201 });
    m.game.mockResolvedValueOnce(game);
    expect(await POST(req({ bggId: "13" }) as never, ctx)).toMatchObject({ status: 201 });
    expect(m.bgg).not.toHaveBeenCalled();
    m.game.mockResolvedValueOnce(null).mockResolvedValueOnce(game);
    expect(await POST(req({ bggId: 42 }) as never, ctx)).toMatchObject({ status: 201 });
    expect(m.importGame).toHaveBeenCalledWith("owner", "42", expect.objectContaining({ name: "BGG Game", complexity: 2 }));
  });

  it("rejects missing, unavailable or duplicate collection games", async () => {
    expect(await POST(req({}) as never, ctx)).toMatchObject({ status: 400 });
    m.game.mockResolvedValueOnce(null); expect(await POST(req({ gameId: "gone" }) as never, ctx)).toMatchObject({ status: 404 });
    m.entryFindUnique.mockResolvedValueOnce({ id: "existing" }); expect(await POST(req({ gameId: "game-1" }) as never, ctx)).toMatchObject({ status: 409 });
    m.entryFindFirst.mockResolvedValueOnce({ id: "same-bgg" }); expect(await POST(req({ gameId: "game-1" }) as never, ctx)).toMatchObject({ status: 409 });
    m.entryCreate.mockRejectedValueOnce({ code: "P2002" }); expect(await POST(req({ gameId: "game-1" }) as never, ctx)).toMatchObject({ status: 409 });
  });

  it("adds temporary BGG snapshots, rejects duplicate or missing BGG games and maps creation conflicts", async () => {
    expect(await POST(req({ kind: "temporary", bggId: 13, reason: "BROUGHT_BY_SOMEONE" }) as never, ctx)).toMatchObject({ status: 201 });
    expect(m.entryCreate).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameId: null, bggId: "13", source: "TEMPORARY_BGG", temporaryReason: "BROUGHT_BY_SOMEONE", complexity: 2, sortOrder: 0 }) }));
    m.entryFindFirst.mockResolvedValueOnce({ id: "duplicate" }); expect(await POST(req({ kind: "temporary", bggId: "13" }) as never, ctx)).toMatchObject({ status: 409 });
    m.bgg.mockResolvedValueOnce(null); expect(await POST(req({ kind: "temporary", bggId: "14" }) as never, ctx)).toMatchObject({ status: 404 });
    m.entryCreate.mockRejectedValueOnce({ code: "P2002" }); expect(await POST(req({ kind: "temporary", bggId: "15" }) as never, ctx)).toMatchObject({ status: 409 });
  });

  it("forwards authentication, parsing and unexpected persistence errors", async () => {
    const authError = new Error("Unauthorized"); m.auth.mockRejectedValueOnce(authError);
    await POST(req({ gameId: "game-1" }) as never, ctx); expect(m.error).toHaveBeenCalledWith(authError);
    const jsonError = new Error("bad json"); await POST({ json: async () => { throw jsonError; } } as never, ctx); expect(m.error).toHaveBeenCalledWith(jsonError);
    const dbError = new Error("db failed"); m.entryCreate.mockRejectedValueOnce(dbError);
    await POST(req({ gameId: "game-1" }) as never, ctx); expect(m.error).toHaveBeenCalledWith(dbError);
  });
});
