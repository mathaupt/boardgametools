import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

vi.mock("@/lib/db", () => {
  const db: Record<string, unknown> = {
    gameSession: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    game: { findFirst: vi.fn() },
    sessionPlayer: { deleteMany: vi.fn(), createMany: vi.fn() },
    $transaction: vi.fn(),
  };
  (db.$transaction as ReturnType<typeof vi.fn>).mockImplementation(
    (fn: (tx: unknown) => Promise<unknown>) => fn(db)
  );
  return { default: db };
});

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_fn: () => Promise<unknown>, _keys: string[], _opts?: unknown) => _fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: {
    userSessions: (id: string) => `sessions-${id}`,
    userStats: (id: string) => `stats-${id}`,
    userDashboard: (id: string) => `dash-${id}`,
  },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
}));

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { SessionService } from "@/lib/services/session.service";
import { ApiError } from "@/lib/require-auth";

const uid = "user-1";
const sid = "session-1";

const fakeSession = {
  id: sid,
  gameId: "game-1",
  playedAt: new Date("2024-06-01"),
  durationMinutes: 60,
  notes: "Fun game",
  createdById: uid,
  deletedAt: null,
  game: { id: "game-1", name: "Chess" },
  players: [
    { userId: uid, score: 10, isWinner: true, placement: 1, user: { id: uid, name: "Alice", email: "a@b.com" } },
  ],
};

describe("SessionService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply $transaction default (clearAllMocks resets it)
    vi.mocked(prisma.$transaction).mockImplementation(
      (fn: unknown) => (fn as (tx: unknown) => Promise<unknown>)(prisma)
    );
  });

  // ── list ──────────────────────────────────────────────────────

  it("list - returns all sessions (non-paginated)", async () => {
    vi.mocked(prisma.gameSession.findMany).mockResolvedValue([fakeSession] as never);

    const result = await SessionService.list(uid);

    expect(result).toEqual([fakeSession]);
    expect(prisma.gameSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { createdById: uid, deletedAt: null },
        orderBy: { playedAt: "desc" },
      })
    );
    expect(prisma.gameSession.count).not.toHaveBeenCalled();
  });

  it("list - returns paginated result", async () => {
    vi.mocked(prisma.gameSession.findMany).mockResolvedValue([fakeSession] as never);
    vi.mocked(prisma.gameSession.count).mockResolvedValue(1 as never);

    const result = await SessionService.list(uid, { page: 1, limit: 10 });

    expect(prisma.gameSession.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 })
    );
    expect(prisma.gameSession.count).toHaveBeenCalled();
    expect(result).toEqual({
      data: [fakeSession],
      total: 1,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  // ── getById ──────────────────────────────────────────────────

  it("getById - returns session with ratings", async () => {
    const sessionWithRatings = { ...fakeSession, ratings: [] };
    vi.mocked(prisma.gameSession.findFirst).mockResolvedValue(sessionWithRatings as never);

    const result = await SessionService.getById(uid, sid);

    expect(result).toEqual(sessionWithRatings);
    expect(prisma.gameSession.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: sid, createdById: uid, deletedAt: null },
        include: expect.objectContaining({ ratings: expect.any(Object) }),
      })
    );
  });

  it("getById - throws ApiError(404) when not found", async () => {
    vi.mocked(prisma.gameSession.findFirst).mockResolvedValue(null as never);

    await expect(SessionService.getById(uid, sid)).rejects.toThrow(ApiError);
    await expect(SessionService.getById(uid, sid)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  // ── create ───────────────────────────────────────────────────

  const validInput = {
    gameId: "game-1",
    playedAt: "2024-06-01T00:00:00Z",
    players: [{ userId: uid, score: 10, isWinner: true }],
  };

  it("create - creates session with players and invalidates caches", async () => {
    vi.mocked(prisma.game.findFirst).mockResolvedValue({ id: "game-1" } as never);
    vi.mocked(prisma.gameSession.create).mockResolvedValue(fakeSession as never);

    const result = await SessionService.create(uid, validInput);

    expect(result).toEqual(fakeSession);
    expect(prisma.game.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "game-1", ownerId: uid, deletedAt: null },
      })
    );
    expect(prisma.gameSession.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          gameId: "game-1",
          createdById: uid,
          players: {
            create: [
              expect.objectContaining({ userId: uid, score: 10, isWinner: true }),
            ],
          },
        }),
      })
    );
    expect(invalidateTag).toHaveBeenCalledWith(`sessions-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`stats-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`dash-${uid}`);
  });

  it("create - throws ApiError(400) when required fields missing", async () => {
    await expect(
      SessionService.create(uid, { gameId: "", playedAt: "2024-01-01", players: [] } as never)
    ).rejects.toThrow(ApiError);
    await expect(
      SessionService.create(uid, { gameId: "", playedAt: "2024-01-01", players: [] } as never)
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.gameSession.create).not.toHaveBeenCalled();
  });

  it("create - throws ApiError(404) when game not found or not owned", async () => {
    vi.mocked(prisma.game.findFirst).mockResolvedValue(null as never);

    await expect(SessionService.create(uid, validInput)).rejects.toThrow(ApiError);
    await expect(SessionService.create(uid, validInput)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.gameSession.create).not.toHaveBeenCalled();
  });

  // ── update ───────────────────────────────────────────────────

  it("update - updates session atomically with player replacement", async () => {
    const updatedSession = { ...fakeSession, notes: "Updated" };
    vi.mocked(prisma.gameSession.findFirst).mockResolvedValue(fakeSession as never);
    vi.mocked(prisma.gameSession.update).mockResolvedValue(updatedSession as never);
    vi.mocked(prisma.sessionPlayer.deleteMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.sessionPlayer.createMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(prisma.gameSession.findUnique).mockResolvedValue(updatedSession as never);

    const result = await SessionService.update(uid, sid, {
      notes: "Updated",
      players: [{ userId: "user-2", score: 20, isWinner: false }],
    });

    expect(result).toEqual(updatedSession);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.gameSession.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: sid } })
    );
    expect(prisma.sessionPlayer.deleteMany).toHaveBeenCalledWith({
      where: { sessionId: sid },
    });
    expect(prisma.sessionPlayer.createMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({ sessionId: sid, userId: "user-2", score: 20, isWinner: false }),
      ],
    });
    expect(invalidateTag).toHaveBeenCalledWith(`sessions-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`stats-${uid}`);
  });

  // ── delete ───────────────────────────────────────────────────

  it("delete - soft-deletes session and invalidates caches", async () => {
    vi.mocked(prisma.gameSession.findFirst).mockResolvedValue(fakeSession as never);
    vi.mocked(prisma.gameSession.update).mockResolvedValue({} as never);

    const result = await SessionService.delete(uid, sid);

    expect(result).toEqual({ message: "Session deleted" });
    expect(prisma.gameSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: sid },
        data: { deletedAt: expect.any(Date) },
      })
    );
    expect(invalidateTag).toHaveBeenCalledWith(`sessions-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`stats-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`dash-${uid}`);
  });

  it("delete - throws ApiError(404) when not found", async () => {
    vi.mocked(prisma.gameSession.findFirst).mockResolvedValue(null as never);

    await expect(SessionService.delete(uid, sid)).rejects.toThrow(ApiError);
    await expect(SessionService.delete(uid, sid)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.gameSession.update).not.toHaveBeenCalled();
  });
});
