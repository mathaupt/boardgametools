import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body, status: init?.status ?? 200,
    })),
  },
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: vi.fn((handler: unknown) => handler) }));

vi.mock("@/lib/require-auth", () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return {
    requireAuth: vi.fn(),
    handleApiError: vi.fn((err: unknown) => ({
      body: { error: (err as Error)?.message || "Internal server error" },
      status: (err as { statusCode?: number })?.statusCode || 500,
    })),
    ApiError,
  };
});

vi.mock("@/lib/db", () => ({
  default: {
    game: { count: vi.fn(), findMany: vi.fn() },
    gameSession: { count: vi.fn(), aggregate: vi.fn(), groupBy: vi.fn(), findMany: vi.fn() },
    sessionPlayer: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((fn: () => Promise<unknown>) => fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: { userStats: (id: string) => `stats-${id}` },
}));

vi.mock("@/lib/error-messages", () => ({
  Errors: { INTERNAL_SERVER_ERROR: "Interner Serverfehler" },
}));

import { requireAuth } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { GET } from "@/app/api/statistics/route";
import { createMockRequest, parseResponse } from "./helpers";

const USER_ID = "user-stats-1";

function setupEmptyStats() {
  vi.mocked(prisma.game.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.gameSession.count).mockResolvedValue(0 as never);
  vi.mocked(prisma.gameSession.aggregate).mockResolvedValue({ _sum: { durationMinutes: null } } as never);
  vi.mocked(prisma.sessionPlayer.findMany)
    .mockResolvedValueOnce([] as never)
    .mockResolvedValueOnce([] as never);
  vi.mocked(prisma.gameSession.groupBy).mockResolvedValue([] as never);
  vi.mocked(prisma.gameSession.findMany)
    .mockResolvedValueOnce([] as never)
    .mockResolvedValueOnce([] as never);
  vi.mocked(prisma.game.findMany).mockResolvedValue([] as never);
}

describe("API /api/statistics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID, role: "USER", name: "Stats User", email: "stats@example.com",
    });
  });

  it("returns complete statistics structure", async () => {
    setupEmptyStats();

    const req = createMockRequest("GET", "http://localhost:3000/api/statistics");
    const res = await (GET as Function)(req);
    const { status, body } = parseResponse(res);

    expect(status).toBe(200);
    expect(body).toHaveProperty("overview");
    expect(body).toHaveProperty("mostPlayed");
    expect(body).toHaveProperty("recentSessions");
    expect(body).toHaveProperty("playerStats");
    expect(body).toHaveProperty("monthlyActivity");
    expect(body.overview).toEqual({
      totalGames: 0, totalSessions: 0, totalPlayTimeMinutes: 0, uniquePlayersCount: 0,
    });
  });

  it("returns correct overview with data", async () => {
    vi.mocked(prisma.game.count).mockResolvedValue(5 as never);
    vi.mocked(prisma.gameSession.count).mockResolvedValue(20 as never);
    vi.mocked(prisma.gameSession.aggregate).mockResolvedValue({ _sum: { durationMinutes: 600 } } as never);
    vi.mocked(prisma.sessionPlayer.findMany)
      .mockResolvedValueOnce([{ userId: "p1" }, { userId: "p2" }] as never)
      .mockResolvedValueOnce([] as never);
    vi.mocked(prisma.gameSession.groupBy).mockResolvedValue([] as never);
    vi.mocked(prisma.gameSession.findMany)
      .mockResolvedValueOnce([] as never)
      .mockResolvedValueOnce([] as never);
    vi.mocked(prisma.game.findMany).mockResolvedValue([] as never);

    const req = createMockRequest("GET", "http://localhost:3000/api/statistics");
    const res = await (GET as Function)(req);
    const { body } = parseResponse(res);

    expect(body.overview).toEqual({
      totalGames: 5, totalSessions: 20, totalPlayTimeMinutes: 600, uniquePlayersCount: 2,
    });
  });

  it("uses cachedQuery with correct key", async () => {
    setupEmptyStats();

    const req = createMockRequest("GET", "http://localhost:3000/api/statistics");
    await (GET as Function)(req);

    expect(cachedQuery).toHaveBeenCalledWith(
      expect.any(Function),
      ["user-statistics-api", USER_ID],
      { revalidate: 120, tags: [`stats-${USER_ID}`] }
    );
  });

  it("returns 12 months of monthly activity", async () => {
    setupEmptyStats();

    const req = createMockRequest("GET", "http://localhost:3000/api/statistics");
    const res = await (GET as Function)(req);
    const { body } = parseResponse(res);

    expect(body.monthlyActivity).toHaveLength(12);
  });

  it("handles snapshots, missing games, unnamed players, duplicate players and activity outside the window", async () => {
    vi.mocked(prisma.game.count).mockResolvedValue(2 as never);
    vi.mocked(prisma.gameSession.count).mockResolvedValue(3 as never);
    vi.mocked(prisma.gameSession.aggregate).mockResolvedValue({ _sum: { durationMinutes: null } } as never);
    vi.mocked(prisma.sessionPlayer.findMany)
      .mockResolvedValueOnce([{ userId: "p1" }, { userId: "p2" }] as never)
      .mockResolvedValueOnce([
        { userId: "p1", isWinner: true, user: { name: "Alex", email: "a@example.test" } },
        { userId: "p1", isWinner: false, user: { name: "Alex", email: "a@example.test" } },
        { userId: "p2", isWinner: false, user: { name: null, email: null } },
      ] as never);
    vi.mocked(prisma.gameSession.groupBy).mockResolvedValue([
      { gameId: "game-1", _count: { id: 2 }, _sum: { durationMinutes: null } },
      { gameId: "gone", _count: { id: 1 }, _sum: { durationMinutes: 50 } },
      { gameId: null, _count: { id: 1 }, _sum: { durationMinutes: 10 } },
    ] as never);
    vi.mocked(prisma.game.findMany).mockResolvedValue([{ id: "game-1", name: "Catan", imageUrl: null }] as never);
    vi.mocked(prisma.gameSession.findMany)
      .mockResolvedValueOnce([
        { id: "s1", playedAt: new Date("2026-11-01T12:00:00Z"), game: { name: "Catan" }, gameNameSnapshot: "Snapshot", _count: { players: 4 } },
        { id: "s2", playedAt: new Date("2026-10-01T12:00:00Z"), game: null, gameNameSnapshot: "Snapshot-Spiel", _count: { players: 2 } },
        { id: "s3", playedAt: new Date("2026-09-01T12:00:00Z"), game: null, gameNameSnapshot: null, _count: { players: 1 } },
      ] as never)
      .mockResolvedValueOnce([
        { playedAt: new Date(), durationMinutes: 30 },
        { playedAt: new Date("2000-01-01T00:00:00Z"), durationMinutes: 99 },
      ] as never);

    const response = await (GET as Function)(createMockRequest("GET", "http://localhost:3000/api/statistics"));
    const { body } = parseResponse(response);
    expect(body.mostPlayed).toEqual([
      { gameId: "game-1", gameName: "Catan", gameImageUrl: null, sessionCount: 2, totalMinutes: 0 },
      { gameId: "gone", gameName: "Unbekannt", gameImageUrl: null, sessionCount: 1, totalMinutes: 50 },
    ]);
    expect(body.recentSessions.map((session: { gameName: string }) => session.gameName)).toEqual(["Catan", "Snapshot-Spiel", "Unbekanntes Spiel"]);
    expect(body.playerStats).toEqual([
      { userId: "p1", userName: "Alex", totalSessions: 2, wins: 1, winRate: 50 },
      { userId: "p2", userName: "Unbekannt", totalSessions: 1, wins: 0, winRate: 0 },
    ]);
    expect(body.monthlyActivity.reduce((sum: number, month: { totalMinutes: number }) => sum + month.totalMinutes, 0)).toBe(30);
  });
});
