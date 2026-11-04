import prisma from "@/lib/db";
import { buildCollectionDiscovery } from "@/lib/gamification/discovery";
import { evaluateBadgeProgress } from "@/lib/gamification/badges";
import { gameTextForRead } from "@/lib/game-text";
import { ApiError } from "@/lib/require-auth";

export const AchievementService = {
  async dismissDiscoveryGame(userId: string, gameId: string): Promise<void> {
    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: userId, deletedAt: null },
      select: { id: true },
    });
    if (!game) throw new ApiError(404, "Spiel nicht gefunden.");

    await prisma.discoveryDismissal.upsert({
      where: { userId_gameId: { userId, gameId } },
      create: { userId, gameId },
      update: {},
    });
  },

  async getOverview(userId: string, now = new Date()) {
    const [createdSessions, playedGames, ownedGamesPlayed, games, completedSeries, dismissedGames] = await Promise.all([
      prisma.gameSession.count({ where: { createdById: userId, deletedAt: null } }),
      prisma.gameSession.groupBy({
        by: ["gameId"],
        where: { deletedAt: null, players: { some: { userId } } },
      }),
      prisma.gameSession.groupBy({
        by: ["gameId"],
        where: {
          deletedAt: null,
          game: { ownerId: userId, deletedAt: null },
          players: { some: { userId } },
        },
      }),
      prisma.game.findMany({
        where: { ownerId: userId, deletedAt: null },
        select: {
          id: true,
          name: true,
          imageUrl: true,
          sessions: {
            where: { deletedAt: null, players: { some: { userId } } },
            select: { playedAt: true },
            orderBy: { playedAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.gameSeries.count({
        where: {
          ownerId: userId,
          deletedAt: null,
          entries: { some: {}, every: { played: true } },
        },
      }),
      prisma.discoveryDismissal.findMany({ where: { userId }, select: { gameId: true } }),
    ]);

    const stats = {
      createdSessions,
      distinctGamesPlayed: playedGames.length,
      ownedGamesPlayed: ownedGamesPlayed.length,
      completedSeries,
    };
    const discoveryGames = games.map((game) => ({
      id: game.id,
      name: gameTextForRead(game.name),
      imageUrl: game.imageUrl,
      lastPlayedAt: game.sessions[0]?.playedAt ?? null,
    }));

    return {
      stats,
      badges: evaluateBadgeProgress(stats),
      discovery: buildCollectionDiscovery(discoveryGames, dismissedGames.map(({ gameId }) => gameId), now),
    };
  },
};
