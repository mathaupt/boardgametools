import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { gameTextForRead } from "@/lib/game-text";
import { getPendingInvites } from "@/lib/queries/pending-invites";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { toDashboardISOString } from "@/lib/dashboard-date";
import { getTopDashboardProposalRanks } from "@/lib/dashboard-event-proposals";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

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

  const upcomingEvents = await cachedQuery(
    () => prisma.event.findMany({
      where: {
        deletedAt: null,
        eventDate: { gte: new Date() },
        OR: [
          { createdById: userId },
          { invites: { some: { userId, status: "accepted" } } },
        ],
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
        status: true,
        selectedGame: { select: { name: true } },
        winningProposal: { select: { bggName: true } },
      },
      orderBy: { eventDate: "asc" },
      take: 5,
    }),
    ["dashboard-upcoming-events", userId!],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!), CacheTags.userDashboard(userId!)] }
  );

  const featuredEvent = upcomingEvents[0];
  const hasSelectedGame = Boolean(featuredEvent?.selectedGame?.name || featuredEvent?.winningProposal?.bggName);
  const proposalVoteCounts = featuredEvent && !hasSelectedGame ? await cachedQuery(
    () => prisma.gameProposal.findMany({
      where: { eventId: featuredEvent.id },
      select: {
        id: true,
        createdAt: true,
        _count: { select: { votes: true, guestVotes: true } },
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    }),
    ["dashboard-upcoming-proposals", userId!, featuredEvent.id],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!), CacheTags.userDashboard(userId!)] }
  ) : [];
  const featuredProposalRanks = getTopDashboardProposalRanks(proposalVoteCounts.map((proposal) => ({
    id: proposal.id,
    votes: proposal._count.votes,
    guestVotes: proposal._count.guestVotes,
    createdAt: proposal.createdAt,
  })));
  const topProposalIds = featuredProposalRanks.map((proposal) => proposal.id);
  const featuredProposalDetails = featuredEvent && topProposalIds.length > 0 ? await cachedQuery(
    () => prisma.gameProposal.findMany({
      where: { eventId: featuredEvent.id, id: { in: topProposalIds } },
      select: {
        id: true,
        bggName: true,
        bggImageUrl: true,
        game: { select: { name: true, imageUrl: true, playTimeMinutes: true } },
      },
    }),
    ["dashboard-upcoming-proposal-details", userId!, featuredEvent.id, topProposalIds.join(":")],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!), CacheTags.userDashboard(userId!)] }
  ) : [];
  const proposalDetailsById = new Map(featuredProposalDetails.map((proposal) => [proposal.id, proposal]));
  const featuredProposals = featuredProposalRanks.flatMap(({ id, totalVotes }) => {
    const proposal = proposalDetailsById.get(id);
    if (!proposal) return [];
    return [{
      id,
      name: gameTextForRead(proposal.game?.name || proposal.bggName || "Spielvorschlag"),
      minutes: proposal.game?.playTimeMinutes ?? null,
      imageUrl: proposal.game?.imageUrl ?? proposal.bggImageUrl ?? null,
      totalVotes,
    }];
  });

  // Offene Einladungen laden
  const pendingInvites = await getPendingInvites(userId!);

  return <DashboardOverview
    name={session?.user?.name ?? null}
    counts={{ games: gamesCount, sessions: sessionsCount, groups: groupsCount, events: eventsCount }}
    events={upcomingEvents.map((event) => ({
      id: event.id, title: event.title, eventDate: toDashboardISOString(event.eventDate), location: event.location,
      selectedGameName: event.selectedGame?.name || event.winningProposal?.bggName
        ? gameTextForRead(event.selectedGame?.name || event.winningProposal?.bggName || "")
        : null,
      votingClosed: event.status === "closed",
      proposals: event.id === featuredEvent?.id ? featuredProposals : [],
    }))}
    recentSessions={recentSessions.map((item) => ({ id: item.id, gameName: gameTextForRead(item.game.name), playedAt: toDashboardISOString(item.playedAt) }))}
    invites={pendingInvites.map((invite) => ({ id: invite.id, eventId: invite.eventId, status: invite.status, event: { id: invite.event.id, title: invite.event.title, eventDate: invite.event.eventDate.toISOString(), location: invite.event.location, createdBy: invite.event.createdBy } }))}
  />;
}
