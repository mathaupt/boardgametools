import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, CalendarDays, Users, Vote, ArrowRight } from "lucide-react";
import type { GameSession, Event } from "@prisma/client";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [gamesCount, sessionsCount, groupsCount, eventsCount] = await Promise.all([
    prisma.game.count({ where: { ownerId: userId } }),
    prisma.gameSession.count({ where: { createdById: userId } }),
    prisma.groupMember.count({ where: { userId } }),
    prisma.eventInvite.count({ where: { userId, status: "accepted" } }),
  ]);

  const recentSessions = await prisma.gameSession.findMany({
    where: { createdById: userId },
    include: { game: true },
    orderBy: { playedAt: "desc" },
    take: 5,
  });

  const upcomingEvents = await prisma.event.findMany({
    where: {
      invites: { some: { userId, status: "accepted" } },
      eventDate: { gte: new Date() },
    },
    orderBy: { eventDate: "asc" },
    take: 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Willkommen zurück, {session?.user?.name}!</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Schnell-Aktionen</CardTitle>
          <CardDescription>Direkt zu deinen wichtigsten Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/games/new">
              <Button variant="outline" className="w-full justify-start">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Spiel hinzufügen
              </Button>
            </Link>
            <Link href="/dashboard/bgg">
              <Button variant="outline" className="w-full justify-start">
                <Gamepad2 className="h-4 w-4 mr-2" />
                BGG Import
              </Button>
            </Link>
            <Link href="/dashboard/sessions/new">
              <Button variant="outline" className="w-full justify-start">
                <CalendarDays className="h-4 w-4 mr-2" />
                Session erstellen
              </Button>
            </Link>
            <Link href="/dashboard/events/new">
              <Button variant="outline" className="w-full justify-start">
                <Vote className="h-4 w-4 mr-2" />
                Event planen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/dashboard/games">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Spiele</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gamesCount}</div>
              <p className="text-xs text-muted-foreground">in deiner Sammlung</p>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                Verwalten <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/sessions">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sessions</CardTitle>
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{sessionsCount}</div>
              <p className="text-xs text-muted-foreground">gespielte Partien</p>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                Verwalten <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Card className="opacity-60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gruppen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{groupsCount}</div>
            <p className="text-xs text-muted-foreground">Mitgliedschaften</p>
            <p className="text-xs text-muted-foreground mt-2 italic">Demnächst verfügbar</p>
          </CardContent>
        </Card>

        <Link href="/dashboard/events">
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Events</CardTitle>
              <Vote className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{eventsCount}</div>
              <p className="text-xs text-muted-foreground">angenommene Einladungen</p>
              <Button variant="ghost" size="sm" className="mt-2 p-0 h-auto text-xs">
                Verwalten <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Letzte Sessions</CardTitle>
            <CardDescription>Deine zuletzt gespielten Partien</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Sessions erfasst.</p>
            ) : (
              <ul className="space-y-3">
                {recentSessions.map((s: GameSession & { game: { name: string } }) => (
                  <li key={s.id} className="flex justify-between items-center">
                    <span className="font-medium">{s.game.name}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(s.playedAt).toLocaleDateString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kommende Events</CardTitle>
            <CardDescription>Deine nächsten Spieleabende</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Keine anstehenden Events.</p>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((evt: Event) => (
                  <li key={evt.id} className="flex justify-between items-center">
                    <span className="font-medium">{evt.title}</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(evt.eventDate).toLocaleDateString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
