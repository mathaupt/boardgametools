import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Calendar, Users, Clock, Trophy } from "lucide-react";
import Link from "next/link";

export default async function SessionsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const sessions = await prisma.gameSession.findMany({
    where: { createdById: userId },
    include: {
      game: true,
      players: {
        include: { user: true }
      }
    },
    orderBy: { playedAt: "desc" },
    take: 20
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gespielte Sessions</h1>
          <p className="text-muted-foreground">Verfolge deine Brettspiel-Sessions</p>
        </div>
        <Link href="/dashboard/sessions/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Session eintragen
          </Button>
        </Link>
      </div>

      {sessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">🎲</div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Sessions</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Du hast noch keine Brettspiel-Sessions eingetragen. 
              Beginne damit, deine ersten Sessions zu dokumentieren!
            </p>
            <Link href="/dashboard/sessions/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Session eintragen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                        🎲
                      </div>
                      {session.game.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.playedAt).toLocaleDateString('de-DE')}
                      </div>
                      {session.durationMinutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {session.durationMinutes} Min.
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {session.players.length} Spieler
                      </div>
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/dashboard/sessions/${session.id}`}>
                      <Button variant="outline" size="sm">
                        Details
                      </Button>
                    </Link>
                    <Link href={`/dashboard/sessions/${session.id}/edit`}>
                      <Button variant="outline" size="sm">
                        Bearbeiten
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardHeader>
              
              {session.notes && (
                <CardContent>
                  <p className="text-sm text-gray-600">{session.notes}</p>
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
                              {player.isWinner && <Trophy className="h-4 w-4 text-yellow-500" />}
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
