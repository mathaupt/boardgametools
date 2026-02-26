import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, CalendarDays, Users, Vote, ArrowRight } from "lucide-react";
import type { GameSession, Event, Game, GameProposal } from "@prisma/client";

type UpcomingEvent = Event & {
  selectedGame: Game | null;
  proposals: (GameProposal & { game: Game })[];
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [gamesCount, sessionsCount, groupsCount, eventsCount] = await Promise.all([
    prisma.game.count({ where: { ownerId: userId } }),
    prisma.gameSession.count({ where: { createdById: userId } }),
    prisma.groupMember.count({ where: { userId } }),
    prisma.event.count({
      where: {
        OR: [
          { createdById: userId },
          { invites: { some: { userId } } },
        ],
      },
    }),
  ]);

  const recentSessions = await prisma.gameSession.findMany({
    where: { createdById: userId },
    include: { game: true },
    orderBy: { playedAt: "desc" },
    take: 5,
  });

  const upcomingEvents: UpcomingEvent[] = await prisma.event.findMany({
    where: {
      eventDate: { gte: new Date() },
      OR: [
        { createdById: userId },
        { invites: { some: { userId, status: "accepted" } } },
      ],
    },
    include: {
      selectedGame: true,
      proposals: {
        include: {
          game: true,
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      },
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

      <div className="grid gap-6 lg:grid-cols-3">
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

        <Card className="lg:col-span-2 border border-primary/30 bg-primary/5">
          <CardHeader className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Vote className="h-5 w-5" />
                Kommende Events
              </CardTitle>
              <CardDescription>Deine nächsten Spieleabende und Abstimmungen</CardDescription>
            </div>
            <Link href="/dashboard/events/new">
              <Button size="sm" variant="outline">
                Neues Event planen
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingEvents.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center text-muted-foreground">
                <div className="text-4xl">📅</div>
                <p className="text-sm">Keine anstehenden Events. Plane deinen nächsten Spieleabend!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((evt: UpcomingEvent) => (
                  <li key={evt.id}>
                    <Link
                      href={`/dashboard/events/${evt.id}`}
                      className="block rounded-lg border border-primary/10 bg-white px-4 py-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{evt.title}</p>
                          {evt.location && (
                            <p className="text-sm text-slate-600">{evt.location}</p>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                          {new Date(evt.eventDate).toLocaleDateString("de-DE", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {evt.selectedGame ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100/60 px-2.5 py-1 text-emerald-700">
                            🎯 Ausgewählt: {evt.selectedGame.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100/60 px-2.5 py-1 text-amber-700">
                            🔄 Voting läuft
                          </span>
                        )}

                        {evt.proposals.length > 0 && (
                          <div className="flex items-center gap-2">
                            {evt.proposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                className="h-12 w-12 overflow-hidden rounded-full border border-border bg-muted"
                                title={proposal.game.name}
                              >
                                {proposal.game.imageUrl ? (
                                  <img
                                    src={proposal.game.imageUrl}
                                    alt={proposal.game.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-xs text-slate-600">
                                    🎲
                                  </div>
                                )}
                              </div>
                            ))}
                            <span className="text-[12px] font-medium text-slate-600">
                              {evt.proposals.length} Vorschläge
                            </span>
                          </div>
                        )}
                      </div>
                    </Link>
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
