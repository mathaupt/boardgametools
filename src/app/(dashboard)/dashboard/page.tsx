import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { getPendingInvites } from "@/lib/queries/pending-invites";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import type { Event, Game, GameProposal } from "@/generated/prisma/client";

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

  return <DashboardOverview
    name={session?.user?.name ?? null}
    counts={{ games: gamesCount, sessions: sessionsCount, groups: groupsCount, events: eventsCount }}
    events={upcomingEvents.map((event) => ({
      id: event.id, title: event.title, eventDate: event.eventDate.toISOString(), location: event.location,
      selectedGameName: event.selectedGame?.name || event.winningProposal?.bggName || null,
      votingClosed: event.status === "closed",
      proposals: event.proposals.map((proposal) => ({ id: proposal.id, name: proposal.game?.name || proposal.bggName || "Spielvorschlag", minutes: proposal.game?.playTimeMinutes ?? null })),
    }))}
    recentSessions={recentSessions.map((item) => ({ id: item.id, gameName: item.game.name, playedAt: item.playedAt.toISOString() }))}
    invites={pendingInvites.map((invite) => ({ id: invite.id, eventId: invite.eventId, status: invite.status, event: { id: invite.event.id, title: invite.event.title, eventDate: invite.event.eventDate.toISOString(), location: invite.event.location, createdBy: invite.event.createdBy } }))}
  />;
}
