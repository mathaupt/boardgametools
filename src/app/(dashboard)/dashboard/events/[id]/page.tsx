import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { gameTextForRead } from "@/lib/game-text";
import { privateEventAccessFilter } from "@/lib/private-event-access";
import { Button } from "@/components/ui/button";
import { PublicShareCard } from "./public-share-card";
import { getPublicBaseUrl } from "@/lib/public-link";
import { ArrowLeft, Mail, Vote, Share2, Download } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import DatePollClient from "./date-poll-client";
import { EventMailDialog } from "@/components/event-mail-dialog";
import CloseVotingButton from "./close-voting-button";
import { EventInfoCard } from "./event-info-card";
import { EventGuestCard } from "./event-guest-card";
import { EventProposalsCard } from "./event-proposals-card";
import { evaluateEventState } from "@/lib/events/event-state";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");
  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null, ...privateEventAccessFilter(userId) },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      invites: {
        include: { user: { select: { id: true, name: true, email: true } } }
      },
      proposals: {
        include: {
          game: true,
          proposedBy: { select: { id: true, name: true, email: true } },
          guest: { select: { id: true, nickname: true } },
          _count: { select: { votes: true, guestVotes: true } }
        }
      },
      selectedGame: true,
      winningProposal: true,
      guestParticipants: {
        include: { _count: { select: { votes: true } } },
        orderBy: { createdAt: "asc" }
      },
      dateProposals: {
        include: {
          votes: {
            include: { user: { select: { id: true, name: true, email: true } } },
          },
          guestVotes: {
            include: { guest: { select: { id: true, nickname: true } } },
          },
        },
        orderBy: { date: "asc" },
      }
    }
  });

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-destructive text-6xl mb-4">📅</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Event nicht gefunden</h1>
          <p className="text-muted-foreground mb-4">Das gesuchte Event existiert nicht.</p>
          <Button asChild>
            <Link href="/dashboard/events">
              <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
              Zurück zu Events
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  const isCreator = event.createdById === userId;
  const eventState = evaluateEventState(event, new Date());
  const isTerminal = eventState.phase === "closed" || eventState.phase === "cancelled" || eventState.phase === "past" || eventState.phase === "unavailable";
  const isPast = isTerminal;
  const publicUrl = event.shareToken ? `${await getPublicBaseUrl()}/public/event/${event.shareToken}` : null;
  const guestVoteCount = event.guestParticipants.reduce((sum, guest) => sum + (guest._count?.votes ?? 0), 0);
  const acceptedCount = event.invites.filter((inv) => inv.status === "accepted").length;

  // Get user votes for each proposal
  const userVotes = userId ? await prisma.vote.findMany({
    where: { userId, proposal: { eventId: id } },
    select: { proposalId: true }
  }) : [];
  const userVoteIds = new Set(userVotes.map(vote => vote.proposalId));

  // Normalize proposals: merge BGG inline data for proposals without a Game record
  const normalizedProposals = event.proposals.map((proposal) => {
    const game = proposal.game ?? {
      id: `bgg-${proposal.bggId}`,
      name: proposal.bggName ?? "Unbekanntes Spiel",
      imageUrl: proposal.bggImageUrl ?? null,
      minPlayers: proposal.bggMinPlayers ?? 1,
      maxPlayers: proposal.bggMaxPlayers ?? 4,
      playTimeMinutes: proposal.bggPlayTimeMinutes ?? null,
      complexity: null,
    };
    const proposedBy = proposal.proposedBy ?? (proposal.guest
      ? { name: proposal.guest.nickname }
      : { name: "Gast" });
    return {
      ...proposal,
      bggName: proposal.bggName == null ? null : gameTextForRead(proposal.bggName),
      game: { ...game, name: gameTextForRead(game.name) },
      proposedBy,
    };
  });

  return (
    <div className="space-y-6">
      <h1 className="sr-only">Event: {event.title}</h1>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/dashboard/events" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Zurück zu Events
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {isCreator && !isPast && (
            <>
              <EventMailDialog
                eventId={event.id}
                eventTitle={event.title}
                totalInvites={event.invites.length}
                acceptedCount={acceptedCount}
              />
              <Button asChild variant="outline">
                <Link href={`/dashboard/events/${event.id}/invite`}>
                  <Mail className="h-4 w-4 mr-2" aria-hidden="true" />
                  Einladungen
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href={`/dashboard/events/${event.id}/share`}>
                  <Share2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Teilen
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/dashboard/events/${event.id}/voting`}>
                  <Vote className="h-4 w-4 mr-2" aria-hidden="true" />
                  Voting
                </Link>
              </Button>
              {eventState.available.close && (
                <CloseVotingButton eventId={event.id} />
              )}
            </>
          )}
          <Button asChild variant="outline">
            <Link href={`/api/events/${event.id}/calendar`} target="_blank">
              <Download className="h-4 w-4 mr-2" aria-hidden="true" />
              Kalender
            </Link>
          </Button>
        </div>
      </div>

      <EventInfoCard event={event} eventState={eventState} />

      {/* Public link + guest overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PublicShareCard
          eventId={event.id}
          initialIsPublic={event.isPublic}
          initialShareToken={event.shareToken}
          initialPublicUrl={publicUrl}
          canManage={isCreator}
        />
        <EventGuestCard
          guestParticipants={event.guestParticipants}
          guestVoteCount={guestVoteCount}
        />
      </div>

      {/* Terminabstimmung */}
      <DatePollClient
        eventId={event.id}
        userId={userId || null}
        isCreator={isCreator}
        canVoteDate={eventState.available.voteDate}
        canManageDates={eventState.available.manageDates}
        canSelectDate={eventState.available.selectDate}
        canResetDates={eventState.available.resetDates}
        blockedReason={eventState.blockedReason}
        knownParticipants={[
          { id: event.createdBy.id, displayName: event.createdBy.name ?? "Organisator", kind: "user" },
          ...event.invites
            .filter((invite) => invite.status === "accepted" && invite.user !== null)
            .map((invite) => ({ id: invite.user?.id ?? invite.id, displayName: invite.user?.name ?? "Teilnehmer", kind: "user" as const })),
          ...event.guestParticipants.map((guest) => ({ id: guest.id, displayName: guest.nickname, kind: "guest" as const })),
        ]}
        initialProposals={event.dateProposals.map((p) => ({
          ...p,
          date: p.date.toISOString(),
        }))}
        selectedDate={event.selectedDate?.toISOString() ?? null}
      />

      <EventProposalsCard
        eventId={event.id}
        proposals={normalizedProposals}
        userId={userId || null}
        userVoteIds={userVoteIds}
        isPast={!eventState.available.voteGame}
        isCreator={isCreator}
        selectedGameId={event.selectedGame?.id}
        winningProposalId={event.winningProposalId ?? undefined}
      />
    </div>
  );
}
