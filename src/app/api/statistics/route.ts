import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";

export const GET = withApiLogging(async function GET(_request: NextRequest) {
  const { userId } = await requireAuth();

  try {
    const result = await cachedQuery(
      async () => {
        // --- Overview ---
        const [totalGames, totalSessions, durationAgg, allSessions] =
          await Promise.all([
            prisma.game.count({ where: { ownerId: userId, deletedAt: null } }),
            prisma.gameSession.count({ where: { createdById: userId, deletedAt: null } }),
            prisma.gameSession.aggregate({
              where: { createdById: userId, deletedAt: null },
              _sum: { durationMinutes: true },
            }),
            prisma.gameSession.findMany({
              where: { createdById: userId, deletedAt: null },
              include: {
                game: true,
                players: {
                  include: {
                    user: { select: { id: true, name: true, email: true } },
                  },
                },
              },
              orderBy: { playedAt: "desc" },
              take: 1000,
            }),
          ]);

        const totalPlayTimeMinutes = durationAgg._sum.durationMinutes ?? 0;

        const uniquePlayerIds = new Set<string>();
        for (const s of allSessions) {
          for (const p of s.players) {
            uniquePlayerIds.add(p.userId);
          }
        }

        const overview = {
          totalGames,
          totalSessions,
          totalPlayTimeMinutes,
          uniquePlayersCount: uniquePlayerIds.size,
        };

        // --- Most Played (top 10 by session count) ---
        const gameMap = new Map<
          string,
          {
            gameId: string;
            gameName: string;
            gameImageUrl: string | null;
            sessionCount: number;
            totalMinutes: number;
          }
        >();

        for (const s of allSessions) {
          const existing = gameMap.get(s.gameId);
          if (existing) {
            existing.sessionCount += 1;
            existing.totalMinutes += s.durationMinutes ?? 0;
          } else {
            gameMap.set(s.gameId, {
              gameId: s.gameId,
              gameName: s.game.name,
              gameImageUrl: s.game.imageUrl,
              sessionCount: 1,
              totalMinutes: s.durationMinutes ?? 0,
            });
          }
        }

        const mostPlayed = Array.from(gameMap.values())
          .sort((a, b) => b.sessionCount - a.sessionCount)
          .slice(0, 10);

        // --- Recent Sessions (last 5) ---
        const recentSessions = allSessions.slice(0, 5).map((s) => ({
          id: s.id,
          gameName: s.game.name,
          playedAt: s.playedAt.toISOString(),
          playerCount: s.players.length,
        }));

        // --- Player Stats ---
        const playerMap = new Map<
          string,
          { userId: string; userName: string; totalSessions: number; wins: number }
        >();

        for (const s of allSessions) {
          for (const p of s.players) {
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
        const now = new Date();
        const months: string[] = [];
        for (let i = 11; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          months.push(key);
        }

        const monthMap = new Map<string, { sessions: number; totalMinutes: number }>();
        for (const m of months) {
          monthMap.set(m, { sessions: 0, totalMinutes: 0 });
        }

        for (const s of allSessions) {
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
