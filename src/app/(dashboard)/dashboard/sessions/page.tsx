import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Clock, Trophy } from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/date";

export default async function SessionsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const sessions = await cachedQuery(
    () => prisma.gameSession.findMany({
      where: { createdById: userId, deletedAt: null },
      include: {
        game: true,
        players: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { playedAt: "desc" },
      take: 20
    }),
    ["user-sessions-list", userId!],
    { revalidate: 60, tags: [CacheTags.userSessions(userId!)] }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gespielte Sessions</h1>
          <p className="text-muted-foreground">Verfolge deine Brettspiel-Sessions</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/sessions/new">
            <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
            Session eintragen
          </Link>
        </Button>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h2 className="text-lg font-semibold mb-2">Noch keine Sessions</h2>
            <p className="text-muted-foreground mb-4 text-center">
              Du hast noch keine Brettspiel-Sessions eingetragen. 
              Beginne damit, deine ersten Sessions zu dokumentieren!
            </p>
            <Button asChild>
              <Link href="/dashboard/sessions/new">
                <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                Erste Session eintragen
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-2">
                  <div>
                    <CardTitle as="h2" className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center" aria-hidden="true">
                        🎲
                      </div>
                      {session.game.name}
                    </CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" aria-hidden="true" />
                        {formatDate(session.playedAt)}
                      </div>
                      {session.durationMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          {session.durationMinutes} Min.
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" aria-hidden="true" />
                        {session.players.length} Spieler
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/sessions/${session.id}`}>
                        Details
                      </Link>
                    </Button>
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/dashboard/sessions/${session.id}/edit`}>
                        Bearbeiten
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {session.notes && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{session.notes}</p>
                </CardContent>
              )}

              {session.players.length > 0 && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Spieler & Ergebnisse</h4>
                    <div className="space-y-1">
                      {session.players
                        .sort((a, b) => (a.placement || 999) - (b.placement || 999))
                        .map((player) => (
                          <div key={player.id} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {player.isWinner && <Trophy className="h-4 w-4 text-warning" aria-label="Gewinner" />}
                              {player.placement && (
                                <span className="font-medium">#{player.placement}</span>
                              )}
                              <span>{player.user.name}</span>
                            </div>
                            {player.score !== null && (
                              <span className="font-mono">{player.score}</span>
                            )}
                          </div>
                        ))}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
