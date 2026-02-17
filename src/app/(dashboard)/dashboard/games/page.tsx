import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Users, Clock, Star, Download } from "lucide-react";

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const games = await prisma.game.findMany({
    where: { ownerId: userId },
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sessions: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Meine Spiele</h1>
          <p className="text-muted-foreground">Verwalte deine Brettspielsammlung</p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/games/import">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Von BGG importieren
            </Button>
          </Link>
          <Link href="/dashboard/games/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Spiel hinzufügen
            </Button>
          </Link>
        </div>
      </div>

      {games.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Du hast noch keine Spiele in deiner Sammlung.</p>
            <Link href="/dashboard/games/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Spiel hinzufügen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <Link key={game.id} href={`/dashboard/games/${game.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <CardTitle className="line-clamp-1">{game.name}</CardTitle>
                  {game.description && (
                    <CardDescription className="line-clamp-2">{game.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{game.minPlayers}-{game.maxPlayers}</span>
                    </div>
                    {game.playTimeMinutes && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>{game.playTimeMinutes} Min.</span>
                      </div>
                    )}
                    {game.complexity && (
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{game.complexity}/5</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    {game._count.sessions} Sessions gespielt
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
