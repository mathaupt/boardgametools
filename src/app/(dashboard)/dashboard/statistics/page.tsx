import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Gamepad2,
  CalendarDays,
  Clock,
  Users,
  Trophy,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { StatisticsCharts } from "./statistics-charts";

export default async function StatisticsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const { totalGames, totalSessions, totalPlayTimeMinutes, uniquePlayersCount, mostPlayed, playerStats, monthlyActivity } = await cachedQuery(
    async () => {
      const [totalGames, totalSessions, durationAgg, allSessions] =
        await Promise.all([
          prisma.game.count({ where: { ownerId: userId } }),
          prisma.gameSession.count({ where: { createdById: userId } }),
          prisma.gameSession.aggregate({
            where: { createdById: userId },
            _sum: { durationMinutes: true },
          }),
          prisma.gameSession.findMany({
            where: { createdById: userId },
            include: {
              game: true,
              players: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                },
              },
            },
            orderBy: { playedAt: "desc" },
          }),
        ]);

      const totalPlayTimeMinutes = durationAgg._sum.durationMinutes ?? 0;

      const uniquePlayerIds = new Set<string>();
      for (const s of allSessions) {
        for (const p of s.players) {
          uniquePlayerIds.add(p.userId);
        }
      }

      const gameMap = new Map<string, { gameId: string; gameName: string; gameImageUrl: string | null; sessionCount: number; totalMinutes: number }>();
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

      const playerMap = new Map<string, { userId: string; userName: string; totalSessions: number; wins: number }>();
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
          winRate: p.totalSessions > 0 ? Math.round((p.wins / p.totalSessions) * 100) : 0,
        }))
        .sort((a, b) => b.winRate - a.winRate);

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

      return { totalGames, totalSessions, totalPlayTimeMinutes, uniquePlayersCount: uniquePlayerIds.size, mostPlayed, playerStats, monthlyActivity };
    },
    ["user-statistics", userId],
    { revalidate: 120, tags: [CacheTags.userStats(userId)] }
  );

  // --- Empty state ---
  if (totalSessions === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
          <p className="text-muted-foreground">
            Auswertungen deiner Spieleabende
          </p>
        </div>
        <Card className="flex flex-col items-center justify-center py-16">
          <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold">Noch keine Daten vorhanden</h2>
          <p className="text-sm text-muted-foreground mt-1 mb-6 text-center max-w-md">
            Erstelle deine erste Session, um Statistiken und Auswertungen zu
            sehen.
          </p>
          <Link href="/dashboard/sessions/new">
            <Button>
              <CalendarDays className="h-4 w-4 mr-2" />
              Erste Session erstellen
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Statistiken</h1>
        <p className="text-muted-foreground">
          Auswertungen deiner Spieleabende
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spiele</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGames}</div>
            <p className="text-xs text-muted-foreground">in deiner Sammlung</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sessions</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSessions}</div>
            <p className="text-xs text-muted-foreground">gespielte Partien</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spielzeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(totalPlayTimeMinutes)}
            </div>
            <p className="text-xs text-muted-foreground">Gesamtspielzeit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Spieler</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniquePlayersCount}</div>
            <p className="text-xs text-muted-foreground">
              verschiedene Mitspieler
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <StatisticsCharts
        monthlyActivity={monthlyActivity}
        playerStats={playerStats}
      />

      {/* Most Played Games & Player Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Most Played */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Meistgespielte Spiele
            </CardTitle>
            <CardDescription>Top 10 nach Anzahl der Sessions</CardDescription>
          </CardHeader>
          <CardContent>
            {mostPlayed.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Daten.</p>
            ) : (
              <div className="space-y-3">
                {mostPlayed.map((game, index) => (
                  <div
                    key={game.gameId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5 text-right">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {game.gameName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDuration(game.totalMinutes)} Spielzeit
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap ml-2">
                      {game.sessionCount}{" "}
                      {game.sessionCount === 1 ? "Session" : "Sessions"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Player Leaderboard */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Trophy className="h-4 w-4" />
              Spieler-Rangliste
            </CardTitle>
            <CardDescription>Sortiert nach Siegquote</CardDescription>
          </CardHeader>
          <CardContent>
            {playerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine Daten.</p>
            ) : (
              <div className="space-y-3">
                {playerStats.map((player, index) => (
                  <div
                    key={player.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5 text-right">
                        {index + 1}.
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {player.userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {player.wins} {player.wins === 1 ? "Sieg" : "Siege"}{" "}
                          in {player.totalSessions}{" "}
                          {player.totalSessions === 1 ? "Session" : "Sessions"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap ml-2">
                      {player.winRate}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
