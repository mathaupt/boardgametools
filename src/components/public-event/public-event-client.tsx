"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { SerializedPublicEvent } from "@/lib/public-event";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { GuestRegistrationPanel } from "./guest-registration-panel";
import { DateVotingSection } from "./date-voting-section";
import { CollectionGameProposer } from "./collection-game-proposer";
import { BggGameSearch } from "./bgg-game-search";
import { PublicProposalVoteActions } from "./public-proposal-vote-actions";
import type { Proposal, StoredGuestState } from "./types";
import { ProposalCompactRow } from "@/components/event-voting/proposal-compact-row";
import { ProposalSortControl } from "@/components/event-voting/proposal-sort-control";
import { sortProposals } from "@/lib/voting/sort-proposals";
import type { ProposalSort, VotingProposal } from "@/lib/voting/types";
import { usePublicEventLifecycle } from "./use-public-event-lifecycle";
import { PublicEventStateBadge } from "./public-event-state-badge";

interface PublicEventClientProps {
  token: string;
  event: SerializedPublicEvent;
}

const STORAGE_PREFIX = "bgt-public-guest:";

export function PublicEventClient({ token, event }: PublicEventClientProps) {
  const { toast } = useToast();
  const [activeGuest, setActiveGuest] = useState<StoredGuestState | null>(null);
  const [guestVotes, setGuestVotes] = useState<Set<string>>(new Set());
  const [proposalSort, setProposalSort] = useState<ProposalSort>("votes");
  const [userVoting, setUserVoting] = useState<string | null>(null);
  const [guestVoting, setGuestVoting] = useState<string | null>(null);
  const { eventState, proposals, setProposals, dateProposals, refreshEventState } = usePublicEventLifecycle(token, event);

  const storageKey = `${STORAGE_PREFIX}${token}`;
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

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: StoredGuestState = JSON.parse(raw);
      setActiveGuest(parsed);
      setGuestVotes(new Set(parsed.votes ?? []));
    } catch {
      // Non-critical: localStorage may be corrupted or unavailable
    }
  }, [storageKey]);

  const persistGuest = useCallback((guest: StoredGuestState, votes: Set<string>) => {
    if (typeof window === "undefined") return;
    const payload: StoredGuestState = {
      id: guest.id,
      nickname: guest.nickname,
      votes: Array.from(votes),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [storageKey]);

  const handleGuestJoined = useCallback((guest: StoredGuestState) => {
    setActiveGuest(guest);
    setGuestVotes(new Set());
  }, []);

  const handleProposalAdded = useCallback((proposal: Proposal) => {
    setProposals((prev) => [...prev, proposal]);
  }, [setProposals]);

  const updateProposalState = (
    proposalId: string,
    updater: (proposal: Proposal) => Proposal
  ) => {
    setProposals((prev) =>
      prev.map((proposal) => (proposal.id === proposalId ? updater(proposal) : proposal))
    );
  };

  const handleUserVote = async (proposalId: string, shouldVote: boolean) => {
    if (!event.currentUserId || !canVoteGame) return;
    setUserVoting(proposalId);
    try {
      const endpoint = `/api/events/${event.id}/votes${shouldVote ? "" : `?proposalId=${proposalId}`}`;
      const response = await fetch(endpoint, {
        method: shouldVote ? "POST" : "DELETE",
        headers: shouldVote ? { "Content-Type": "application/json" } : undefined,
        body: shouldVote ? JSON.stringify({ proposalId }) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) await refreshEventState();
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        throw new Error(data?.error ?? "Vote fehlgeschlagen");
      }
      updateProposalState(proposalId, (proposal) => {
        const registered = proposal.voteCounts.registered + (shouldVote ? 1 : -1);
        const totalVotes = registered + proposal.voteCounts.guests;
        return {
          ...proposal,
          userHasVoted: shouldVote,
          voteCounts: {
            ...proposal.voteCounts,
            registered: Math.max(registered, 0),
          },
          totalVotes: Math.max(totalVotes, 0),
        };
      });
    } catch (error) {
      console.error("User vote error", error);
      toast({
        title: "Vote fehlgeschlagen",
        description: error instanceof Error ? error.message : "Versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setUserVoting(null);
    }
  };

  const handleGuestVote = async (proposalId: string, shouldVote: boolean) => {
    if (!activeGuest || !canVoteGame) {
      toast({ title: "Gastzugang erforderlich", description: "Bitte zuerst als Gast beitreten." });
      return;
    }
    setGuestVoting(proposalId);
    try {
      const response = await fetch(`/api/public/event/${token}/vote${shouldVote ? "" : `?guestId=${activeGuest.id}&proposalId=${proposalId}`}`, {
        method: shouldVote ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: shouldVote ? JSON.stringify({ guestId: activeGuest.id, proposalId }) : undefined,
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) await refreshEventState();
        if (response.status === 409) throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        throw new Error(data?.error ?? "Gast-Vote fehlgeschlagen");
      }
      setGuestVotes((prev) => {
        const updated = new Set(prev);
        if (shouldVote) {
          updated.add(proposalId);
        } else {
          updated.delete(proposalId);
        }
        persistGuest(activeGuest, updated);
        return updated;
      });
      updateProposalState(proposalId, (proposal) => {
        const guestCount = proposal.voteCounts.guests + (shouldVote ? 1 : -1);
        const totalVotes = proposal.voteCounts.registered + Math.max(guestCount, 0);
        return {
          ...proposal,
          voteCounts: {
            ...proposal.voteCounts,
            guests: Math.max(guestCount, 0),
          },
          totalVotes: Math.max(totalVotes, 0),
        };
      });
    } catch (error) {
      console.error("Guest vote error", error);
      toast({
        title: "Gast-Vote fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setGuestVoting(null);
    }
  };

  return (
    <div className="space-y-6">
      <GuestRegistrationPanel
        token={token}
        activeGuest={activeGuest}
        initialGuestList={event.guestParticipants}
        onGuestJoined={handleGuestJoined}
        persistGuest={persistGuest}
        canJoin={canJoin}
        blockedReason={eventState.blockedReason}
        onStateConflict={refreshEventState}
      />

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Spielvorschläge</h2>
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
                Noch keine Spielvorschläge vorhanden. {event.currentUserId ? "Du kannst direkt eines hinzufügen." : "Nutze die BGG-Suche unten, um ein Spiel vorzuschlagen."}
              </CardContent>
            </Card>
          ) : (
            <ul className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
            {visibleProposals.map((proposal) => {
              const userHasVoted = proposal.userHasVoted ?? false;
              const guestHasVoted = guestVotes.has(proposal.id);
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
                    currentUserId={event.currentUserId}
                    activeGuest={!!activeGuest}
                    userHasVoted={userHasVoted}
                    guestHasVoted={guestHasVoted}
                    userVoting={userVoting}
                    guestVoting={guestVoting}
                    canVote={canVoteGame}
                    onUserVote={() => handleUserVote(proposal.id, !userHasVoted)}
                    onGuestVote={() => handleGuestVote(proposal.id, !guestHasVoted)}
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
        currentUserId={event.currentUserId}
        activeGuest={activeGuest}
        knownGuests={event.guestParticipants}
        canVote={canVoteDate}
        onStateConflict={refreshEventState}
        selectedDate={event.selectedDate}
        initialDateProposals={dateProposals}
      />

      {event.currentUserId && (
        <CollectionGameProposer
          token={token}
          currentUserId={event.currentUserId}
          proposedGameIds={proposedGameIds}
          onProposalAdded={handleProposalAdded}
          onStateConflict={refreshEventState}
        />
      )}

      {/* BGG-Import: available to everyone (guests + logged-in) */}
      {canProposeGame && (
        <BggGameSearch
          token={token}
          activeGuestId={activeGuest?.id ?? null}
          currentUserId={event.currentUserId}
          proposalOpen={canProposeGame}
          onProposalAdded={handleProposalAdded}
          onStateConflict={refreshEventState}
        />
      )}
    </div>
  );
}
