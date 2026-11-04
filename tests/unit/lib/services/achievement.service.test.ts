import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createdSessions: vi.fn(),
  playedGames: vi.fn(),
  games: vi.fn(),
  ownedGame: vi.fn(),
  completedSeries: vi.fn(),
  dismissedGames: vi.fn(),
  dismissalUpsert: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  default: {
    gameSession: { count: mocks.createdSessions, groupBy: mocks.playedGames },
    game: { findMany: mocks.games, findFirst: mocks.ownedGame },
    gameSeries: { count: mocks.completedSeries },
    discoveryDismissal: { findMany: mocks.dismissedGames, upsert: mocks.dismissalUpsert },
  },
}));
vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } },
}));

import { AchievementService } from "@/lib/services/achievement.service";

describe("AchievementService.getOverview", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.createdSessions.mockResolvedValue(10);
    mocks.playedGames
      .mockResolvedValueOnce([{ gameId: "game-1" }, { gameId: "game-2" }])
      .mockResolvedValueOnce([{ gameId: "game-1" }]);
    mocks.games.mockResolvedValue([
      { id: "game-1", name: "Azul", imageUrl: null, sessions: [] },
      { id: "game-2", name: "Catan", imageUrl: null, sessions: [{ playedAt: new Date("2025-01-01T00:00:00Z") }] },
      { id: "game-3", name: "Cascadia", imageUrl: null, sessions: [] },
    ]);
    mocks.completedSeries.mockResolvedValue(1);
    mocks.dismissedGames.mockResolvedValue([]);
  });

  it("derives created-session and played-game achievements from their separate sources", async () => {
    const result = await AchievementService.getOverview("user-1", new Date("2026-11-04T12:00:00Z"));

    expect(result.stats).toEqual({ createdSessions: 10, distinctGamesPlayed: 2, ownedGamesPlayed: 1, completedSeries: 1 });
    expect(result.badges.find(({ id }) => id === "sessions-10")?.earned).toBe(true);
    expect(mocks.createdSessions).toHaveBeenCalledWith({ where: { createdById: "user-1", deletedAt: null } });
    expect(mocks.playedGames).toHaveBeenCalledWith(expect.objectContaining({
      by: ["gameId"],
      where: { deletedAt: null, players: { some: { userId: "user-1" } } },
    }));
    expect(mocks.playedGames).toHaveBeenCalledWith(expect.objectContaining({
      by: ["gameId"],
      where: { deletedAt: null, game: { ownerId: "user-1", deletedAt: null }, players: { some: { userId: "user-1" } } },
    }));
    expect(mocks.playedGames).toHaveBeenCalledTimes(2);
  });

  it("returns only owned never-played and year-old games and excludes dismissed games", async () => {
    mocks.dismissedGames.mockResolvedValue([{ gameId: "game-3" }]);

    const result = await AchievementService.getOverview("user-1", new Date("2026-11-04T12:00:00Z"));

    expect(result.discovery.neverPlayed).toEqual([{ id: "game-1", name: "Azul", imageUrl: null, lastPlayedAt: null }]);
    expect(result.discovery.longUnplayed.map(({ id }) => id)).toEqual(["game-2"]);
    expect(mocks.games).toHaveBeenCalledWith(expect.objectContaining({
      where: { ownerId: "user-1", deletedAt: null },
      select: expect.objectContaining({ sessions: expect.any(Object) }),
    }));
    expect(mocks.dismissedGames).toHaveBeenCalledWith({ where: { userId: "user-1" }, select: { gameId: true } });
  });

  it("counts only complete series with at least one played entry", async () => {
    await AchievementService.getOverview("user-1");

    expect(mocks.completedSeries).toHaveBeenCalledWith({
      where: {
        ownerId: "user-1",
        deletedAt: null,
        entries: { some: {}, every: { played: true } },
      },
    });
  });

  it("dismisses only a game in the active collection of the requesting user", async () => {
    mocks.ownedGame.mockResolvedValue({ id: "game-1" });

    await AchievementService.dismissDiscoveryGame("user-1", "game-1");

    expect(mocks.ownedGame).toHaveBeenCalledWith({
      where: { id: "game-1", ownerId: "user-1", deletedAt: null },
      select: { id: true },
    });
    expect(mocks.dismissalUpsert).toHaveBeenCalledWith({
      where: { userId_gameId: { userId: "user-1", gameId: "game-1" } },
      create: { userId: "user-1", gameId: "game-1" },
      update: {},
    });
  });

  it("does not allow dismissing a game outside the owner's collection", async () => {
    mocks.ownedGame.mockResolvedValue(null);

    await expect(AchievementService.dismissDiscoveryGame("user-1", "game-other"))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(mocks.dismissalUpsert).not.toHaveBeenCalled();
  });
});
