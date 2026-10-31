"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Vote, X, Trash2 } from "lucide-react";
import { ProposalWithDetails } from "./voting-types";
import { ProposalCompactRow } from "@/components/event-voting/proposal-compact-row";
import { ProposalSortControl } from "@/components/event-voting/proposal-sort-control";
import { proposalRanks, sortProposals } from "@/lib/voting/sort-proposals";
import type { ProposalSort, VotingProposal } from "@/lib/voting/types";
import { gameTextForRead } from "@/lib/game-text";

interface ProposalRankingListProps {
  eventId: string;
  proposals: ProposalWithDetails[];
  voting: string | null;
  deletingProposal: string | null;
  eventIsCreator: boolean;
  currentUserId: string;
  onVote: (proposalId: string) => void;
  onRemoveVote: (proposalId: string) => void;
  onDeleteProposal: (proposalId: string) => void;
  winningProposalId?: string | null;
  selectedGameId?: string | null;
  canChangeVoting?: boolean;
}

function toSortableProposal(proposal: ProposalWithDetails): VotingProposal {
  return {
    id: proposal.id,
    name: gameTextForRead(proposal.game.name),
    createdAt: proposal.createdAt
      ? proposal.createdAt instanceof Date
        ? proposal.createdAt.toISOString()
        : String(proposal.createdAt)
      : null,
    voteCounts: {
      registered: proposal._count.votes,
      guests: proposal._count.guestVotes ?? 0,
    },
    totalVotes: proposal.totalVotes ?? proposal._count.votes + (proposal._count.guestVotes ?? 0),
  };
}

export default function ProposalRankingList({
  eventId,
  proposals,
  voting,
  deletingProposal,
  eventIsCreator,
  currentUserId,
  onVote,
  onRemoveVote,
  onDeleteProposal,
  winningProposalId,
  selectedGameId,
  canChangeVoting = true,
}: ProposalRankingListProps) {
  const [sort, setSort] = useState<ProposalSort>("votes");
  const visibleProposals = useMemo(
    () => sortProposals(proposals, sort, toSortableProposal),
    [proposals, sort]
  );
  const ranks = useMemo(() => proposalRanks(visibleProposals, toSortableProposal), [visibleProposals]);
  return (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-warning" aria-hidden="true" />
        Voting-Rangliste
      </h2>

      {proposals.length > 0 && (
        <div className="flex min-w-0 justify-end">
          <ProposalSortControl value={sort} onChange={setSort} id="voting-page-proposal-sort" />
        </div>
      )}
      
      {proposals.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">🗳️</div>
            <h3 className="font-semibold mb-2">Noch keine Vorschläge</h3>
            <p className="text-muted-foreground mb-4">
              Füge Spiele hinzu, damit abgestimmt werden kann.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
          {visibleProposals.map((proposal) => (
            <ProposalCompactRow
              key={proposal.id}
              eventId={eventId}
              proposalId={proposal.id}
              name={gameTextForRead(proposal.game.name)}
              imageUrl={proposal.game.imageUrl}
              minPlayers={proposal.game.minPlayers}
              maxPlayers={proposal.game.maxPlayers}
              playTimeMinutes={proposal.game.playTimeMinutes}
              proposedBy={proposal.proposedBy.name}
              totalVotes={proposal._count.votes + (proposal._count.guestVotes ?? 0)}
              rank={sort === "votes" ? ranks.get(proposal.id) : undefined}
              selected={selectedGameId === proposal.game.id || winningProposalId === proposal.id}
            >
              {(eventIsCreator || proposal.proposedById === currentUserId) && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteProposal(proposal.id)}
                  disabled={!canChangeVoting || deletingProposal === proposal.id}
                  className="min-h-11 min-w-11 text-muted-foreground hover:text-destructive"
                  aria-label={`Vorschlag ${gameTextForRead(proposal.game.name)} löschen`}
                >
                  {deletingProposal === proposal.id ? <span className="text-xs">…</span> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                </Button>
              )}
              <Button
                onClick={() => proposal.userVoted ? onRemoveVote(proposal.id) : onVote(proposal.id)}
                disabled={!canChangeVoting || voting === proposal.id}
                variant={proposal.userVoted ? "outline" : "default"}
                className="min-h-11 gap-2"
                aria-pressed={proposal.userVoted}
              >
                {proposal.userVoted ? <X className="h-4 w-4" aria-hidden="true" /> : <Vote className="h-4 w-4" aria-hidden="true" />}
                {proposal.userVoted ? "Stimme entfernen" : voting === proposal.id ? "Wird abgestimmt …" : "Abstimmen"}
              </Button>
            </ProposalCompactRow>
          ))}
        </ul>
      )}
    </>
  );
}
