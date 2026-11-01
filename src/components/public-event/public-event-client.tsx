"use client";

import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { SerializedPublicEvent } from "@/lib/public-event";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { GuestRegistrationPanel } from "./guest-registration-panel";
import { DateVotingSection } from "./date-voting-section";
import { CollectionGameProposer } from "./collection-game-proposer";
import { BggGameSearch } from "./bgg-game-search";
import { PublicProposalVoteActions } from "./public-proposal-vote-actions";
import type { Proposal } from "./types";
import { ProposalCompactRow } from "@/components/event-voting/proposal-compact-row";
import { ProposalSortControl } from "@/components/event-voting/proposal-sort-control";
import { sortProposals } from "@/lib/voting/sort-proposals";
import type { ProposalSort, VotingProposal } from "@/lib/voting/types";
import { usePublicEventLifecycle } from "./use-public-event-lifecycle";
import { PublicEventStateBadge } from "./public-event-state-badge";
import { usePublicActor } from "./use-public-actor";
import { upsertPublicGuest } from "@/lib/events/public-participants";
import { PublicEventSectionLinks } from "./public-event-section-links";
import { ParticipantsSection } from "./participants-section";
import { PersonalSelectionSummary } from "./personal-selection-summary";

interface PublicEventClientProps {
  token: string;
  event: SerializedPublicEvent;
}

export function PublicEventClient({ token, event }: PublicEventClientProps) {
  const { toast } = useToast();
  const [proposalSort, setProposalSort] = useState<ProposalSort>("votes");
  const [voting, setVoting] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const { eventState, proposals, setProposals, dateProposals, guestParticipants, setGuestParticipants, refreshError, refreshEventState } = usePublicEventLifecycle(token, event);
  const { actor, guestVotes, registerGuest, persistGuestVotes } = usePublicActor({
    token,
    user: event.currentUser,
    guests: guestParticipants,
    proposalIds: proposals.map((proposal) => proposal.id),
  });
  const actorKey = actor.kind === "user" ? `user:${actor.userId}` : actor.kind === "guest" ? `guest:${actor.guestId}` : actor.kind;
  const actorKeyRef = useRef(actorKey);
  useLayoutEffect(() => {
    actorKeyRef.current = actorKey;
  }, [actorKey]);
  const visibleActor = sessionExpired ? { kind: "observer" as const } : actor;
  const canVoteGame = eventState.available.voteGame;
  const canProposeGame = eventState.available.proposeGame;
  const canVoteDate = eventState.available.voteDate;
  const canJoin = eventState.available.join;

  const proposedGameIds = useMemo(
    () => new Set(proposals.map((p) => p.game.id)),
    [proposals]
  );

  const visibleProposals = useMemo(() => sortProposals(proposals, proposalSort, (proposal): VotingProposal => ({
    id: proposal.id,
    name: proposal.game.name,
    createdAt: proposal.createdAt,
    voteCounts: proposal.voteCounts,
    totalVotes: proposal.totalVotes,
  })), [proposals, proposalSort]);

  const activeGuest = actor.kind === "guest" ? { id: actor.guestId, nickname: actor.nickname } : null;

  const handleGuestJoined = useCallback((guest: import("@/lib/public-event").PublicGuest) => {
    setGuestParticipants((current) => upsertPublicGuest(current, guest));
    registerGuest(guest);
    void refreshEventState();
  }, [refreshEventState, registerGuest, setGuestParticipants]);

  const handleProposalAdded = useCallback((proposal: Proposal) => {
    setProposals((prev) => [...prev, proposal]);
  }, [setProposals]);

  const handleSessionExpired = useCallback(() => setSessionExpired(true), []);

  const updateProposalState = (
    proposalId: string,
    updater: (proposal: Proposal) => Proposal
  ) => {
    setProposals((prev) =>
      prev.map((proposal) => (proposal.id === proposalId ? updater(proposal) : proposal))
    );
  };

  const handleVote = async (proposalId: string, shouldVote: boolean) => {
    if ((actor.kind !== "user" && actor.kind !== "guest") || !canVoteGame) return;
    const requestActorKey = actorKey;
    const isUser = actor.kind === "user";
    const guestId = actor.kind === "guest" ? actor.guestId : null;
    setVoting(proposalId);
    try {
      const endpoint = isUser
        ? `/api/events/${event.id}/votes${shouldVote ? "" : `?proposalId=${encodeURIComponent(proposalId)}`}`
        : `/api/public/event/${encodeURIComponent(token)}/vote${shouldVote ? "" : `?guestId=${encodeURIComponent(guestId!)}&proposalId=${encodeURIComponent(proposalId)}`}`;
      const response = await fetch(endpoint, {
        method: shouldVote ? "POST" : "DELETE",
        headers: shouldVote ? { "Content-Type": "application/json" } : undefined,
        body: shouldVote ? JSON.stringify(isUser ? { proposalId } : { guestId, proposalId }) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409 || response.status === 401) await refreshEventState();
        if (response.status === 401 && isUser) setSessionExpired(true);
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        throw new Error(data?.error ?? "Vote fehlgeschlagen");
      }
      if (actorKeyRef.current !== requestActorKey) {
        await refreshEventState();
        return;
      }
      updateProposalState(proposalId, (proposal) => {
        const field = isUser ? "registered" : "guests";
        const count = Math.max(proposal.voteCounts[field] + (shouldVote ? 1 : -1), 0);
        const voteCounts = { ...proposal.voteCounts, [field]: count };
        return {
          ...proposal,
          userHasVoted: isUser ? shouldVote : proposal.userHasVoted,
          voteCounts,
          totalVotes: voteCounts.registered + voteCounts.guests,
        };
      });
      if (!isUser) {
        const updated = new Set(guestVotes);
        if (shouldVote) updated.add(proposalId);
        else updated.delete(proposalId);
        persistGuestVotes(updated);
        await refreshEventState();
      }
    } catch (error) {
      console.error("Public vote error", error);
      toast({
        title: "Vote fehlgeschlagen",
        description: error instanceof Error ? error.message : "Versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  return (
    <div className="space-y-6">
      <GuestRegistrationPanel
        token={token}
        actor={visibleActor}
        onGuestJoined={handleGuestJoined}
        canJoin={canJoin && !sessionExpired}
        blockedReason={eventState.blockedReason}
        onStateConflict={refreshEventState}
        sessionExpired={sessionExpired}
      />

      <PublicEventSectionLinks hasGames hasDates={dateProposals.length > 0} />
      {refreshError && <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm text-foreground" role="status">
        {refreshError} <button type="button" className="ml-2 min-h-11 font-medium text-primary underline underline-offset-4" onClick={() => void refreshEventState()}>Wiederholen</button>
      </p>}

      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]">
      <div className="min-w-0 space-y-6">
      <section id="event-games" aria-labelledby="event-games-title" className="min-w-0 scroll-mt-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 id="event-games-title" className="text-xl font-semibold text-foreground">Spiele wählen</h2>
            <p className="text-sm text-muted-foreground">
              Stimme für deine Favoriten oder bring eigene Vorschläge ein.
            </p>
          </div>
          {!canVoteGame && (
            <PublicEventStateBadge label={eventState.label} />
          )}
        </div>
        <div className="mt-4 space-y-4">
          {proposals.length > 0 && (
            <div className="flex justify-end">
              <ProposalSortControl value={proposalSort} onChange={setProposalSort} id="public-event-proposal-sort" />
            </div>
          )}
          {proposals.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/50">
              <CardContent className="py-10 text-center text-muted-foreground">
              Noch keine Spielvorschläge vorhanden. {visibleActor.kind === "user" ? "Du kannst direkt eines hinzufügen." : "Nutze die BGG-Suche unten, um ein Spiel vorzuschlagen."}
              </CardContent>
            </Card>
          ) : (
            <ul className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            {visibleProposals.map((proposal) => {
              const userHasVoted = proposal.userHasVoted ?? false;
              const hasVoted = visibleActor.kind === "user" ? userHasVoted : visibleActor.kind === "guest" && guestVotes.has(proposal.id);
              return (
                <ProposalCompactRow
                  key={proposal.id}
                  token={token}
                  proposalId={proposal.id}
                  name={proposal.game.name}
                  imageUrl={proposal.game.imageUrl}
                  minPlayers={proposal.game.minPlayers}
                  maxPlayers={proposal.game.maxPlayers}
                  playTimeMinutes={proposal.game.playTimeMinutes}
                  proposedBy={proposal.proposedBy?.name ?? "unbekannt"}
                  totalVotes={proposal.totalVotes}
                  voteSummary={`${proposal.voteCounts.registered} Nutzer · ${proposal.voteCounts.guests} Gäste`}
                  selected={event.winningProposal?.id === proposal.id || event.selectedGame?.id === proposal.game.id}
                >
                  <PublicProposalVoteActions
                    proposalId={proposal.id}
                    actor={visibleActor}
                    hasVoted={hasVoted}
                    busy={voting !== null}
                    canVote={canVoteGame}
                    onToggle={() => handleVote(proposal.id, !hasVoted)}
                  />
                </ProposalCompactRow>
              );
            })}
            </ul>
          )}
        </div>
      </section>

      {/* Terminabstimmung */}
      <DateVotingSection
        eventId={event.id}
        token={token}
        currentUserId={visibleActor.kind === "user" ? visibleActor.userId : null}
        activeGuest={activeGuest}
        knownGuests={guestParticipants}
        canVote={canVoteDate}
        onStateConflict={refreshEventState}
        onSessionExpired={handleSessionExpired}
        onSaved={refreshEventState}
        selectedDate={event.selectedDate}
        initialDateProposals={dateProposals}
      />

      {visibleActor.kind === "user" && (
        <CollectionGameProposer
          token={token}
          currentUserId={visibleActor.userId}
          proposedGameIds={proposedGameIds}
          onProposalAdded={handleProposalAdded}
          onStateConflict={refreshEventState}
          onSessionExpired={handleSessionExpired}
        />
      )}

      {canProposeGame && (
        <BggGameSearch
          token={token}
          activeGuestId={visibleActor.kind === "guest" ? visibleActor.guestId : null}
          currentUserId={visibleActor.kind === "user" ? visibleActor.userId : null}
          proposalOpen={canProposeGame}
          onProposalAdded={handleProposalAdded}
          onStateConflict={refreshEventState}
          onSessionExpired={handleSessionExpired}
        />
      )}
      <PersonalSelectionSummary actor={visibleActor} proposals={proposals} dateProposals={dateProposals} guestVotes={guestVotes} />
      </div>
      <ParticipantsSection invites={event.invites} guests={guestParticipants} activeGuestId={activeGuest?.id ?? null} />
      </div>
    </div>
  );
}
