import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPendingInvites } from "@/lib/queries/pending-invites";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Gamepad2, CalendarDays, Users, Vote, ArrowRight } from "lucide-react";
import { PendingInvites } from "@/components/pending-invites";
import { formatDate, formatShortMonth } from "@/lib/date";
import type { GameSession, Event, Game, GameProposal } from "@/generated/prisma/client";

type UpcomingEvent = Event & {
  selectedGame: Game | null;
  winningProposal: GameProposal | null;
  proposals: (GameProposal & { game: Game | null })[];
};

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const [gamesCount, sessionsCount, groupsCount, eventsCount] = await cachedQuery(
    () => Promise.all([
      prisma.game.count({ where: { ownerId: userId, deletedAt: null } }),
      prisma.gameSession.count({ where: { createdById: userId, deletedAt: null } }),
      prisma.groupMember.count({ where: { userId } }),
      prisma.event.count({
        where: {
          deletedAt: null,
          OR: [
            { createdById: userId },
            { invites: { some: { userId } } },
          ],
        },
      }),
    ]),
    ["dashboard-counts", userId!],
    { revalidate: 60, tags: [CacheTags.userDashboard(userId!)] }
  );

  const recentSessions = await cachedQuery(
    () => prisma.gameSession.findMany({
      where: { createdById: userId, deletedAt: null },
      include: { game: true },
      orderBy: { playedAt: "desc" },
      take: 5,
    }),
    ["dashboard-recent-sessions", userId!],
    { revalidate: 60, tags: [CacheTags.userSessions(userId!), CacheTags.userDashboard(userId!)] }
  );

  const upcomingEvents: UpcomingEvent[] = await cachedQuery(
    () => prisma.event.findMany({
      where: {
        deletedAt: null,
        eventDate: { gte: new Date() },
        OR: [
          { createdById: userId },
          { invites: { some: { userId, status: "accepted" } } },
        ],
      },
      include: {
        selectedGame: true,
        winningProposal: true,
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
    }),
    ["dashboard-upcoming-events", userId!],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!), CacheTags.userDashboard(userId!)] }
  );

  // Offene Einladungen laden
  const pendingInvites = await getPendingInvites(userId!);

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
          <CardTitle as="h2" className="text-base">Schnell-Aktionen</CardTitle>
          <CardDescription>Direkt zu deinen wichtigsten Funktionen</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" className="w-full justify-start h-10">
              <Link href="/dashboard/games/new">
                <Gamepad2 className="h-4 w-4 mr-2" />
                Spiel hinzufügen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-10">
              <Link href="/dashboard/bgg">
                <Gamepad2 className="h-4 w-4 mr-2" />
                BGG Import
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-10">
              <Link href="/dashboard/sessions/new">
                <CalendarDays className="h-4 w-4 mr-2" />
                Session erstellen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-10">
              <Link href="/dashboard/groups/new">
                <Users className="h-4 w-4 mr-2" />
                Gruppe erstellen
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start h-10">
              <Link href="/dashboard/events/new">
                <Vote className="h-4 w-4 mr-2" />
                Event planen
              </Link>
            </Button>
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
              className={`h-full transition-[colors,box-shadow] ${stat.href ? "hover:shadow-md" : "opacity-60"}`}
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
            <Link key={stat.label} href={stat.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {content}
            </Link>
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
              <CardTitle as="h2" className="flex items-center gap-2 text-base">
                <Vote className="h-4 w-4 text-primary" />
                Kommende Events
              </CardTitle>
              <CardDescription>Deine nächsten Spieleabende</CardDescription>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard/events/new">
                Neues Event planen
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcomingEvents.map((evt: UpcomingEvent) => (
                <Link
                  key={evt.id}
                  href={`/dashboard/events/${evt.id}`}
                  className="group block rounded-lg border bg-card p-4 transition-[colors,box-shadow] hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 flex flex-col items-center justify-center rounded-lg bg-primary/10 px-2.5 py-1.5 text-center leading-tight">
                      <span className="text-xl font-bold text-primary">
                        {new Date(evt.eventDate).getDate()}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-primary/70">
                        {formatShortMonth(evt.eventDate)}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-sm group-hover:text-primary transition-colors">{evt.title}</p>
                      {evt.location && (
                        <p className="text-xs text-muted-foreground mt-0.5">{evt.location}</p>
                      )}
                      <div className="mt-2">
                        {(evt.selectedGame || evt.winningProposal) ? (
                          <span className="inline-flex items-center rounded-md bg-success/10 px-2 py-0.5 text-xs text-success font-medium">
                            {evt.selectedGame?.name || evt.winningProposal?.bggName}
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
            <CardTitle as="h2" className="text-base">Letzte Sessions</CardTitle>
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
                      {formatDate(s.playedAt)}
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
            <CardTitle as="h2" className="text-base">Letzte Aktivität</CardTitle>
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
