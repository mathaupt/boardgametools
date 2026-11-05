import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), update: vi.fn(), delete: vi.fn(), handle: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { gameSeriesEntry: { findFirst: m.find, update: m.update, delete: m.delete } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { ENTRY_NOT_FOUND: "Eintrag nicht gefunden", RATING_RANGE: "Bewertung ungültig", ENTRY_REMOVED: "Eintrag entfernt" } }));
import { PUT, DELETE } from "@/app/api/series/[id]/entries/[entryId]/route";
const entry = { id: "entry-1", playedAt: null, played: false, seriesId: "series-1", gameId: null, gameName: "Exit", gameDescription: null, gameImageUrl: null, minPlayers: 1, maxPlayers: 4, gamePlayTimeMinutes: null, complexity: null, bggId: null };
const ctx = { params: Promise.resolve({ id: "series-1", entryId: "entry-1" }) };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "owner" }); m.find.mockResolvedValue(entry); m.update.mockResolvedValue(entry); m.delete.mockResolvedValue(entry); m.handle.mockImplementation(() => Response.json({ error: "server" }, { status: 500 })); });
const request = (method: string, body?: unknown) => new Request("http://local/api", { method, headers: { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) as never;

describe("Einzelner Reiheneintrag", () => {
  it("verlangt Besitz und validiert Metadaten", async () => {
    m.find.mockResolvedValueOnce(null); expect((await PUT(request("PUT", { rating: 3 }), ctx)).status).toBe(404);
    expect((await PUT(request("PUT", { rating: 8 }), ctx)).status).toBe(400);
    expect((await PUT(request("PUT", { difficulty: "x".repeat(51) }), ctx)).status).toBe(400);
    expect((await PUT(request("PUT", { playerCount: 0 }), ctx)).status).toBe(400);
  });
  it("setzt Abschlussdaten, löscht sie beim Zurücksetzen und aktualisiert optionale Werte", async () => {
    await PUT(request("PUT", { played: true, rating: 5, difficulty: "Schwer", sortOrder: 4, playTimeMinutes: 90, successful: true, playerCount: 2, score: 120 }), ctx);
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ played: true, playedAt: expect.any(Date), rating: 5, difficulty: "Schwer", sortOrder: 4, playTimeMinutes: 90, successful: true, playerCount: 2, score: 120 }) }));
    await PUT(request("PUT", { played: false }), ctx);
    expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { played: false, playedAt: null, rating: null, playTimeMinutes: null, successful: null, playerCount: null, score: null } }));
    await PUT(request("PUT", { playedAt: null, rating: null, difficulty: null }), ctx);
    expect(m.update).toHaveBeenLastCalledWith(expect.objectContaining({ data: { playedAt: null, rating: null, difficulty: null } }));
  });
  it("löscht nur den eigenen Reiheneintrag", async () => {
    expect(await (await DELETE(request("DELETE"), ctx)).json()).toEqual({ message: "Eintrag entfernt" });
    expect(m.delete).toHaveBeenCalledWith({ where: { id: "entry-1" } });
    m.find.mockResolvedValueOnce(null); expect((await DELETE(request("DELETE"), ctx)).status).toBe(404);
  });
});
