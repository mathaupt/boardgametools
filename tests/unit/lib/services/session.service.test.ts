import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({
  findMany: vi.fn(), count: vi.fn(), sessionFindFirst: vi.fn(), create: vi.fn(), update: vi.fn(), findUnique: vi.fn(),
  gameFindFirst: vi.fn(), userFindUnique: vi.fn(), playerDelete: vi.fn(), playerCreateMany: vi.fn(), guestDelete: vi.fn(), guestCreateMany: vi.fn(),
  transaction: vi.fn(), cachedQuery: vi.fn(), invalidateTag: vi.fn(), validateString: vi.fn(), notify: vi.fn(), log: vi.fn(),
}));
vi.mock("@/lib/db", () => ({ default: { gameSession: { findMany: m.findMany, count: m.count, findFirst: m.sessionFindFirst, create: m.create, update: m.update, findUnique: m.findUnique }, game: { findFirst: m.gameFindFirst }, user: { findUnique: m.userFindUnique }, sessionPlayer: { deleteMany: m.playerDelete, createMany: m.playerCreateMany }, sessionGuestPlayer: { deleteMany: m.guestDelete, createMany: m.guestCreateMany }, $transaction: m.transaction } }));
vi.mock("@/lib/cache", () => ({ cachedQuery: m.cachedQuery, invalidateTag: m.invalidateTag }));
vi.mock("@/lib/cache-tags", () => ({ CacheTags: { userSessions: (id: string) => `sessions:${id}`, userStats: (id: string) => `stats:${id}`, userDashboard: (id: string) => `dashboard:${id}` } }));
vi.mock("@/lib/validation", () => ({ validateString: m.validateString }));
vi.mock("@/lib/services/push.service", () => ({ notifySessionCreated: m.notify }));
vi.mock("@/lib/logger", () => ({ default: { error: m.log } }));
vi.mock("@/lib/require-auth", () => ({ ApiError: class ApiError extends Error { statusCode: number; constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; } } }));
import { SessionService } from "@/lib/services/session.service";
import { ApiError } from "@/lib/require-auth";

const game = { id: "g1", name: "Catan", bggId: "13", imageUrl: "image", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60, complexity: 2 };
beforeEach(() => {
  vi.clearAllMocks(); m.validateString.mockReturnValue(null); m.cachedQuery.mockImplementation((query: () => unknown) => query());
  m.findMany.mockResolvedValue([{ id: "s1" }]); m.count.mockResolvedValue(12); m.sessionFindFirst.mockResolvedValue({ id: "s1" });
  m.create.mockResolvedValue({ id: "created" }); m.update.mockResolvedValue({ id: "updated" }); m.findUnique.mockResolvedValue({ id: "updated" });
  m.gameFindFirst.mockResolvedValue(game); m.userFindUnique.mockResolvedValue({ name: "Owner", email: "owner@example.test" });
  m.playerDelete.mockResolvedValue({ count: 1 }); m.playerCreateMany.mockResolvedValue({ count: 1 }); m.guestDelete.mockResolvedValue({ count: 1 }); m.guestCreateMany.mockResolvedValue({ count: 1 });
  m.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ gameSession: { update: m.update, findUnique: m.findUnique }, sessionPlayer: { deleteMany: m.playerDelete, createMany: m.playerCreateMany }, sessionGuestPlayer: { deleteMany: m.guestDelete, createMany: m.guestCreateMany } }));
  m.notify.mockResolvedValue(undefined);
});

describe("SessionService", () => {
  it("liefert gecachte Standardlisten und paginierte Listen", async () => {
    await SessionService.list("u1"); expect(m.cachedQuery).toHaveBeenCalledOnce();
    const result = await SessionService.list("u1", { page: 2, limit: 5 });
    expect(result).toEqual({ data: [{ id: "s1" }], total: 12, page: 2, limit: 5, totalPages: 3 });
    expect(m.findMany.mock.calls.at(-1)?.[0]).toMatchObject({ skip: 5, take: 5 });
  });

  it("findet eigene Sessions und verbirgt fehlende oder fremde Sessions", async () => {
    await expect(SessionService.getById("u1", "s1")).resolves.toEqual({ id: "s1" });
    m.sessionFindFirst.mockResolvedValueOnce(null);
    await expect(SessionService.getById("u2", "s1")).rejects.toBeInstanceOf(ApiError);
  });

  it("validiert Pflichtfelder, Notizen und Spielbesitz vor dem Erstellen", async () => {
    await expect(SessionService.create("u1", { gameId: "", playedAt: "", players: [] })).rejects.toMatchObject({ statusCode: 400 });
    m.validateString.mockReturnValueOnce("Notizen sind zu lang");
    await expect(SessionService.create("u1", { gameId: "g1", playedAt: "2026-11-01", players: [{ userId: "u1" }], notes: "x" })).rejects.toMatchObject({ statusCode: 400 });
    m.gameFindFirst.mockResolvedValueOnce(null);
    await expect(SessionService.create("u1", { gameId: "g2", playedAt: "2026-11-01", players: [{ userId: "u1" }] })).rejects.toMatchObject({ statusCode: 404 });
  });

  it("speichert Spiel-Snapshot, Spieler und optionale Push-Benachrichtigungen", async () => {
    await SessionService.create("u1", { gameId: "g1", playedAt: "2026-11-01", durationMinutes: "45", players: [{ userId: "u1" }, { userId: "u2", score: 5, isWinner: true, placement: 1 }], notes: "  " });
    expect(m.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameNameSnapshot: "Catan", durationMinutes: 45, players: { create: expect.arrayContaining([expect.objectContaining({ userId: "u2", score: 5, isWinner: true, placement: 1 })]) } }) }));
    expect(m.notify).toHaveBeenCalledWith("u2", "g1", "Catan", "Owner"); expect(m.invalidateTag).toHaveBeenCalledTimes(3);
    m.notify.mockRejectedValueOnce(new Error("offline"));
    await SessionService.create("u1", { gameId: "g1", playedAt: "2026-11-01", players: [{ userId: "u2" }] });
    expect(m.log).toHaveBeenCalledOnce();
    m.userFindUnique.mockResolvedValueOnce(null);
    await SessionService.create("u1", { gameId: "g1", playedAt: "2026-11-01", players: [{ userId: "u2" }] });
    expect(m.notify).toHaveBeenLastCalledWith("u2", "g1", "Catan", "Jemand");
  });

  it("erstellt aus einem Event einen Snapshot mit Defaults für optionale Werte", async () => {
    const tx = { gameSession: { create: vi.fn().mockResolvedValue({ id: "event-session" }) } };
    await SessionService.createFromEvent(tx as never, "owner", { gameId: null, gameNameSnapshot: "Gastspiel", playedAt: "2026-11-01", players: [{ userId: "owner" }], guestPlayers: [{ name: "Mia" }] });
    expect(tx.gameSession.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ gameId: null, gameBggIdSnapshot: null, notes: null, players: { create: [expect.objectContaining({ isWinner: false, score: null })] }, guestPlayers: { create: [expect.objectContaining({ name: "Mia", placement: null })] } }) }));
  });

  it("aktualisiert Sessions atomar mit optionalen Teilnehmenden und leeren Gästen", async () => {
    await SessionService.update("u1", "s1", { playedAt: "2026-11-02", durationMinutes: "0", notes: "neu", players: [{ userId: "u2" }], guestPlayers: [] });
    expect(m.transaction).toHaveBeenCalledOnce(); expect(m.playerDelete).toHaveBeenCalled(); expect(m.playerCreateMany).toHaveBeenCalled();
    expect(m.guestDelete).toHaveBeenCalled(); expect(m.guestCreateMany).not.toHaveBeenCalled(); expect(m.invalidateTag).toHaveBeenCalledTimes(3);
    m.sessionFindFirst.mockResolvedValueOnce(null);
    await expect(SessionService.update("u1", "gone", {})).rejects.toMatchObject({ statusCode: 404 });
    m.validateString.mockReturnValueOnce("ungültige Notiz");
    await expect(SessionService.update("u1", "s1", { notes: "bad" })).rejects.toMatchObject({ statusCode: 400 });
  });

  it("löscht Sessions weich und weist nicht mehr eigene Sessions ab", async () => {
    await expect(SessionService.delete("u1", "s1")).resolves.toEqual({ message: "Session deleted" });
    expect(m.update).toHaveBeenCalledWith(expect.objectContaining({ data: { deletedAt: expect.any(Date) } }));
    m.sessionFindFirst.mockResolvedValueOnce(null);
    await expect(SessionService.delete("u2", "s1")).rejects.toMatchObject({ statusCode: 404 });
  });
});
