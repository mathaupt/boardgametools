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

  const statCards = [
    {
      label: "Spiele",
      count: gamesCount,
      sub: "in deiner Sammlung",
      icon: Gamepad2,
      href: "/dashboard/games",
      color: "text-primary bg-primary/10",
    },
    {
      label: "Sessions",
      count: sessionsCount,
      sub: "gespielte Partien",
      icon: CalendarDays,
      href: "/dashboard/sessions",
      color: "text-success bg-success/10",
    },
    {
      label: "Gruppen",
      count: groupsCount,
      sub: "Mitgliedschaften",
      icon: Users,
      href: null,
      color: "text-muted-foreground bg-muted",
    },
    {
      label: "Events",
      count: eventsCount,
      sub: "angenommene Einladungen",
      icon: Vote,
      href: "/dashboard/events",
      color: "text-accent-foreground bg-accent/60",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Willkommen zurück, {session?.user?.name}!
        </p>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Schnell-Aktionen</CardTitle>
          <CardDescription>Direkt zu deinen wichtigsten Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/dashboard/games/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Spiel hinzufügen
              </Button>
            </Link>
            <Link href="/dashboard/bgg">
              <Button variant="outline" className="w-full justify-start h-10">
                <Gamepad2 className="h-4 w-4 mr-2" />
                BGG Import
              </Button>
            </Link>
            <Link href="/dashboard/sessions/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <CalendarDays className="h-4 w-4 mr-2" />
                Session erstellen
              </Button>
            </Link>
            <Link href="/dashboard/events/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <Vote className="h-4 w-4 mr-2" />
                Event planen
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => {
          const content = (
            <Card
              key={stat.label}
              className={`h-full transition-all ${stat.href ? "hover:shadow-md cursor-pointer" : "opacity-60"}`}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1 tracking-tight">{stat.count}</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.sub}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                {stat.href ? (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs font-medium text-primary flex items-center gap-1">
                      Verwalten <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground mt-3 pt-3 border-t italic">
                    Demnächst verfügbar
                  </p>
                )}
              </CardContent>
            </Card>
          );
          return stat.href ? (
            <Link key={stat.label} href={stat.href}>{content}</Link>
          ) : (
            <div key={stat.label}>{content}</div>
          );
        })}
      </div>

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Sessions</CardTitle>
            <CardDescription>Deine zuletzt gespielten Partien</CardDescription>
          </CardHeader>
          <CardContent>
            {recentSessions.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Sessions erfasst.</p>
            ) : (
              <ul className="space-y-3">
                {recentSessions.map((s: GameSession & { game: { name: string } }) => (
                  <li key={s.id} className="flex justify-between items-center">
                    <span className="font-medium text-sm">{s.game.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.playedAt).toLocaleDateString("de-DE")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Vote className="h-4 w-4 text-primary" />
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
              <div className="flex flex-col items-center gap-3 py-8 text-center text-muted-foreground">
                <CalendarDays className="h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm">Keine anstehenden Events. Plane deinen nächsten Spieleabend!</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((evt: UpcomingEvent) => (
                  <li key={evt.id}>
                    <Link
                      href={`/dashboard/events/${evt.id}`}
                      className="block rounded-lg border bg-card px-4 py-3 transition-all hover:border-primary/30 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm">{evt.title}</p>
                          {evt.location && (
                            <p className="text-xs text-muted-foreground mt-0.5">{evt.location}</p>
                          )}
                        </div>
                        <span className="inline-flex items-center rounded-md bg-primary px-2.5 py-1 text-xs font-medium text-primary-foreground shrink-0">
                          {new Date(evt.eventDate).toLocaleDateString("de-DE", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })}
                        </span>
                      </div>

                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        {evt.selectedGame ? (
                          <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-success font-medium">
                            Ausgewählt: {evt.selectedGame.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-warning/10 px-2 py-0.5 text-warning-foreground font-medium">
                            Voting läuft
                          </span>
                        )}

                        {evt.proposals.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            {evt.proposals.map((proposal) => (
                              <div
                                key={proposal.id}
                                className="h-8 w-8 overflow-hidden rounded-full border bg-muted"
                                title={proposal.game.name}
                              >
                                {proposal.game.imageUrl ? (
                                  <img
                                    src={proposal.game.imageUrl}
                                    alt={proposal.game.name}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
                                    <Gamepad2 className="h-3.5 w-3.5" />
                                  </div>
                                )}
                              </div>
                            ))}
                            <span className="text-[11px] text-muted-foreground">
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
