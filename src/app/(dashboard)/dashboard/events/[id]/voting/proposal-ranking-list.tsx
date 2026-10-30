"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Star, Trophy, Vote, X, Gamepad2, Trash2 } from "lucide-react";
import { ProposalWithDetails } from "./voting-types";
import { ProposalGameDetails } from "@/components/event-voting/proposal-game-details";
import { ProposalSortControl } from "@/components/event-voting/proposal-sort-control";
import { proposalRanks, sortProposals } from "@/lib/voting/sort-proposals";
import type { ProposalSort, VotingProposal } from "@/lib/voting/types";

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
}

function toSortableProposal(proposal: ProposalWithDetails): VotingProposal {
  return {
    id: proposal.id,
    name: proposal.game.name,
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
}: ProposalRankingListProps) {
  const [sort, setSort] = useState<ProposalSort>("votes");
  const visibleProposals = useMemo(
    () => sortProposals(proposals, sort, toSortableProposal),
    [proposals, sort]
  );
  const ranks = useMemo(
    () => proposalRanks(visibleProposals, toSortableProposal),
    [visibleProposals]
  );

  return (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-warning" aria-hidden="true" />
        Voting-Rangliste
      </h2>

      {proposals.length > 0 && (
        <div className="flex justify-end">
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
        visibleProposals.map((proposal) => (
          <Card key={proposal.id} className="relative" data-testid={`proposal-${proposal.id}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {/* Game Image */}
                    <div className="flex-shrink-0">
                      {proposal.game.imageUrl ? (
                        <Image 
                          src={proposal.game.imageUrl} 
                          alt={proposal.game.name}
                          width={48}
                          height={48}
                          className="rounded-lg object-cover border border-border"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-muted border border-border flex items-center justify-center">
                          <Gamepad2 className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
                        </div>
                      )}
                    </div>
                    {sort === "votes" && (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary-foreground bg-muted"
                        data-testid={`proposal-rank-${proposal.id}`}
                        aria-label={`Rang ${ranks.get(proposal.id)}`}
                      >
                        {ranks.get(proposal.id)}
                      </div>
                    )}
                    <ProposalGameDetails
                      eventId={eventId}
                      proposalId={proposal.id}
                      name={proposal.game.name}
                      titleClassName="text-lg font-semibold leading-none tracking-tight"
                      headingLevel={3}
                    />
                  </div>
                  
                  {/* Spiel-Details */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" aria-hidden="true" />
                      {proposal.game.minPlayers}-{proposal.game.maxPlayers} Spieler
                    </Badge>
                    
                    {proposal.game.playTimeMinutes && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        ⏱️ {proposal.game.playTimeMinutes} Min.
                      </Badge>
                    )}
                    
                    {proposal.game.complexity && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        {"★".repeat(proposal.game.complexity)}{"☆".repeat(5 - proposal.game.complexity)}
                      </Badge>
                    )}
                  </div>
                  
                  <CardDescription>
                    Vorgeschlagen von {proposal.proposedBy.name}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="text-center">
                    <div className="text-2xl font-bold" data-testid={`vote-count-${proposal.id}`}>
                      {proposal._count.votes + (proposal._count.guestVotes ?? 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">Stimmen</div>
                  </div>
                  {(selectedGameId === proposal.game.id || winningProposalId === proposal.id) && (
                    <Trophy className="h-5 w-5 text-warning" aria-label="Ausgewähltes Spiel" />
                  )}
                  {(eventIsCreator || proposal.proposedById === currentUserId) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteProposal(proposal.id)}
                      disabled={deletingProposal === proposal.id}
                      className="text-muted-foreground hover:text-destructive"
                      aria-label="Vorschlag löschen"
                    >
                      {deletingProposal === proposal.id ? (
                        <span className="text-xs">…</span>
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                {proposal.game.description && (
                  <p className="text-sm text-muted-foreground flex-1 mr-4">
                    {proposal.game.description}
                  </p>
                )}
                
                <Button
                  onClick={() => proposal.userVoted ? onRemoveVote(proposal.id) : onVote(proposal.id)}
                  disabled={voting === proposal.id}
                  variant={proposal.userVoted ? "outline" : "default"}
                  className="flex items-center gap-2"
                >
                  {proposal.userVoted ? (
                    <>
                      <X className="h-4 w-4" aria-hidden="true" />
                      Vote entfernen
                    </>
                  ) : (
                    <>
                      <Vote className="h-4 w-4" aria-hidden="true" />
                      {voting === proposal.id ? 'Wird abgestimmt…' : 'Vote'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </>
  );
}
