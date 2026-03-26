import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";

export const GET = withApiLogging(async function GET(_request: NextRequest) {
  const { userId } = await requireAuth();

  try {
    const result = await cachedQuery(
      async () => {
        const sessionWhere = { createdById: userId, deletedAt: null };

        // Compute 12-month window for monthly activity
        const now = new Date();
        const months: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          months.push(key);
        }
        const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

        // --- Run all independent queries in parallel ---
        const [
          totalGames,
          totalSessions,
          durationAgg,
          uniquePlayers,
          mostPlayedGrouped,
          recentSessionsRaw,
          playerDataRaw,
          monthlyDataRaw,
        ] = await Promise.all([
          prisma.game.count({ where: { ownerId: userId, deletedAt: null } }),
          prisma.gameSession.count({ where: sessionWhere }),
          prisma.gameSession.aggregate({
            where: sessionWhere,
            _sum: { durationMinutes: true },
          }),
          prisma.sessionPlayer.findMany({
            where: { session: sessionWhere },
            select: { userId: true },
            distinct: ["userId"],
          }),
          prisma.gameSession.groupBy({
            by: ["gameId"],
            where: sessionWhere,
            _count: { id: true },
            _sum: { durationMinutes: true },
            orderBy: { _count: { id: "desc" } },
            take: 10,
          }),
          prisma.gameSession.findMany({
            where: sessionWhere,
            select: {
              id: true,
              playedAt: true,
              game: { select: { name: true } },
              _count: { select: { players: true } },
            },
            orderBy: { playedAt: "desc" },
            take: 5,
          }),
          prisma.sessionPlayer.findMany({
            where: { session: sessionWhere },
            select: {
              userId: true,
              isWinner: true,
              user: { select: { name: true, email: true } },
            },
          }),
          prisma.gameSession.findMany({
            where: { ...sessionWhere, playedAt: { gte: twelveMonthsAgo } },
            select: { playedAt: true, durationMinutes: true },
          }),
        ]);

        // --- Overview ---
        const overview = {
          totalGames,
          totalSessions,
          totalPlayTimeMinutes: durationAgg._sum.durationMinutes ?? 0,
          uniquePlayersCount: uniquePlayers.length,
        };

        // --- Most Played (enrich grouped results with game details) ---
        const gameIds = mostPlayedGrouped.map((g) => g.gameId);
        const games =
          gameIds.length > 0
            ? await prisma.game.findMany({
                where: { id: { in: gameIds } },
                select: { id: true, name: true, imageUrl: true },
              })
            : [];
        const gameDetailsMap = new Map(games.map((g) => [g.id, g]));

        const mostPlayed = mostPlayedGrouped.map((g) => {
          const details = gameDetailsMap.get(g.gameId);
          return {
            gameId: g.gameId,
            gameName: details?.name ?? "Unbekannt",
            gameImageUrl: details?.imageUrl ?? null,
            sessionCount: g._count.id,
            totalMinutes: g._sum.durationMinutes ?? 0,
          };
        });

        // --- Recent Sessions ---
        const recentSessions = recentSessionsRaw.map((s) => ({
          id: s.id,
          gameName: s.game.name,
          playedAt: s.playedAt.toISOString(),
          playerCount: s._count.players,
        }));

        // --- Player Stats (computed in JS from minimal data) ---
        const playerMap = new Map<
          string,
          { userId: string; userName: string; totalSessions: number; wins: number }
        >();

        for (const p of playerDataRaw) {
          const existing = playerMap.get(p.userId);
          if (existing) {
            existing.totalSessions += 1;
            if (p.isWinner) existing.wins += 1;
          } else {
            playerMap.set(p.userId, {
              userId: p.userId,
              userName: p.user.name ?? p.user.email ?? "Unbekannt",
              totalSessions: 1,
              wins: p.isWinner ? 1 : 0,
            });
          }
        }

        const playerStats = Array.from(playerMap.values())
          .map((p) => ({
            ...p,
            winRate:
              p.totalSessions > 0
                ? Math.round((p.wins / p.totalSessions) * 100)
                : 0,
          }))
          .sort((a, b) => b.winRate - a.winRate);

        // --- Monthly Activity (last 12 months) ---
        const monthMap = new Map<string, { sessions: number; totalMinutes: number }>();
        for (const m of months) {
          monthMap.set(m, { sessions: 0, totalMinutes: 0 });
        }

        for (const s of monthlyDataRaw) {
          const d = new Date(s.playedAt);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          const entry = monthMap.get(key);
          if (entry) {
            entry.sessions += 1;
            entry.totalMinutes += s.durationMinutes ?? 0;
          }
        }

        const monthlyActivity = months.map((m) => ({
          month: m,
          ...monthMap.get(m)!,
        }));

        return {
          overview,
          mostPlayed,
          recentSessions,
          playerStats,
          monthlyActivity,
        };
      },
      ["user-statistics-api", userId],
      { revalidate: 120, tags: [CacheTags.userStats(userId)] }
    );

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
