import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, CalendarDays, Users, Vote, ArrowRight } from "lucide-react";
import { PendingInvites } from "@/components/pending-invites";
import type { GameSession, Event, Game, GameProposal } from "@prisma/client";

type UpcomingEvent = Event & {
  selectedGame: Game | null;
  proposals: (GameProposal & { game: Game | null })[];
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

  // Offene Einladungen laden
  const pendingInvites = await prisma.eventInvite.findMany({
    where: {
      userId,
      status: "pending",
      event: { eventDate: { gte: new Date() } },
    },
    include: {
      event: {
        include: {
          createdBy: { select: { name: true } },
        },
      },
    },
    orderBy: { event: { eventDate: "asc" } },
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
      href: "/dashboard/groups",
      color: "text-info bg-info/10",
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
            <Link href="/dashboard/groups/new">
              <Button variant="outline" className="w-full justify-start h-10">
                <Users className="h-4 w-4 mr-2" />
                Gruppe erstellen
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

      {/* Offene Einladungen */}
      <PendingInvites
        invites={pendingInvites.map((inv) => ({
          id: inv.id,
          eventId: inv.eventId,
          status: inv.status,
          event: {
            id: inv.event.id,
            title: inv.event.title,
            eventDate: inv.event.eventDate.toISOString(),
            location: inv.event.location,
            createdBy: inv.event.createdBy,
          },
        }))}
      />

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

      {/* Upcoming Events – prominent full-width section */}
      {upcomingEvents.length > 0 && (
        <Card className="border-primary/20 bg-primary/[0.02]">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Vote className="h-4 w-4 text-primary" />
                Kommende Events
              </CardTitle>
              <CardDescription>Deine nächsten Spieleabende</CardDescription>
            </div>
            <Link href="/dashboard/events/new">
              <Button size="sm" variant="outline">
                Neues Event planen
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((evt: UpcomingEvent) => (
                <Link
                  key={evt.id}
                  href={`/dashboard/events/${evt.id}`}
                  className="group block rounded-lg border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1.5 text-center leading-tight">
                      <span className="text-xl font-bold text-primary">
                        {new Date(evt.eventDate).getDate()}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-primary/70">
                        {new Date(evt.eventDate).toLocaleDateString("de-DE", { month: "short" })}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{evt.title}</p>
                      {evt.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">{evt.location}</p>
                      )}
                      <div className="mt-2">
                        {evt.selectedGame ? (
                          <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs text-success font-medium">
                            {evt.selectedGame.name}
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-md bg-warning/10 px-2 py-0.5 text-xs text-warning-foreground font-medium">
                            Voting · {evt.proposals.length} Vorschläge
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bottom section */}
      <div className="grid gap-6 lg:grid-cols-2">
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

        {/* Placeholder for future content */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Letzte Aktivität</CardTitle>
            <CardDescription>Neueste Änderungen in deinen Gruppen</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Noch keine Gruppenaktivität.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
