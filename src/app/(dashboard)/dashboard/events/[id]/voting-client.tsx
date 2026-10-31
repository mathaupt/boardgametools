"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProposalCompactRow } from "@/components/event-voting/proposal-compact-row";
import { ProposalSortControl } from "@/components/event-voting/proposal-sort-control";
import { sortProposals } from "@/lib/voting/sort-proposals";
import type { ProposalSort, VotingProposal } from "@/lib/voting/types";

interface Proposal {
  id: string;
  game: {
    id: string;
    name: string;
    minPlayers: number;
    maxPlayers: number;
    playTimeMinutes: number | null;
    complexity: number | null;
    imageUrl?: string | null;
  };
  proposedBy: {
    name: string | null;
  };
  _count: {
    votes: number;
    guestVotes?: number;
  };
  createdAt?: string | Date | null;
}

interface VotingClientProps {
  proposals: Proposal[];
  eventId: string;
  userId: string | null;
  userVoteIds: Set<string>;
  isPast: boolean;
  selectedGameId?: string;
  winningProposalId?: string;
}

function toSortableProposal(proposal: Proposal): VotingProposal {
  return {
    id: proposal.id,
    name: proposal.game.name,
    createdAt: proposal.createdAt instanceof Date
      ? proposal.createdAt.toISOString()
      : proposal.createdAt ?? null,
    voteCounts: { registered: proposal._count.votes, guests: proposal._count.guestVotes ?? 0 },
    totalVotes: proposal._count.votes + (proposal._count.guestVotes ?? 0),
  };
}

export default function VotingClient({ 
  proposals, 
  eventId, 
  userId, 
  userVoteIds, 
  isPast, 
  selectedGameId,
  winningProposalId 
}: VotingClientProps) {
  const [voting, setVoting] = useState<string | null>(null);
  const [localUserVoteIds, setLocalUserVoteIds] = useState<Set<string>>(userVoteIds);
  const [localProposals, setLocalProposals] = useState(proposals);
  const [sort, setSort] = useState<ProposalSort>("votes");
  const { toast } = useToast();

  const sortedProposals = useMemo(
    () => sortProposals(localProposals, sort, toSortableProposal),
    [localProposals, sort]
  );

  const handleVote = async (proposalId: string) => {
    if (!userId || isPast || voting) return;

    setVoting(proposalId);
    
    try {
      const response = await fetch(`/api/events/${eventId}/votes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposalId }),
      });

      if (!response.ok) {
        throw new Error('Fehler beim Abstimmen');
      }

      // Update local state
      setLocalUserVoteIds(prev => new Set([...prev, proposalId]));
      setLocalProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, _count: { ...p._count, votes: p._count.votes + 1 } }
          : p
      ));
      
    } catch (error) {
      console.error('Vote error:', error);
      toast({
        title: "Fehler beim Abstimmen",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  const handleRemoveVote = async (proposalId: string) => {
    if (!userId || isPast || voting) return;

    setVoting(proposalId);
    
    try {
      const response = await fetch(`/api/events/${eventId}/votes?proposalId=${proposalId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Fehler beim Entfernen des Votes');
      }

      // Update local state
      setLocalUserVoteIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(proposalId);
        return newSet;
      });
      setLocalProposals(prev => prev.map(p => 
        p.id === proposalId 
          ? { ...p, _count: { ...p._count, votes: p._count.votes - 1 } }
          : p
      ));
      
    } catch (error) {
      console.error('Remove vote error:', error);
      toast({
        title: "Fehler beim Entfernen des Votes",
        description: "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setVoting(null);
    }
  };

  const hasVoted = (proposalId: string) => localUserVoteIds.has(proposalId);

  return (
    <div className="space-y-3" data-testid="voting-proposals">
      <div className="flex justify-end">
        <ProposalSortControl value={sort} onChange={setSort} id="event-detail-proposal-sort" />
      </div>
      <ul className="min-w-0 overflow-hidden rounded-xl border border-border bg-card">
        {sortedProposals.map((proposal) => (
          <ProposalCompactRow
            key={proposal.id}
            eventId={eventId}
            proposalId={proposal.id}
            name={proposal.game.name}
            imageUrl={proposal.game.imageUrl}
            minPlayers={proposal.game.minPlayers}
            maxPlayers={proposal.game.maxPlayers}
            playTimeMinutes={proposal.game.playTimeMinutes}
            proposedBy={proposal.proposedBy.name}
            totalVotes={proposal._count.votes + (proposal._count.guestVotes ?? 0)}
            selected={selectedGameId === proposal.game.id || winningProposalId === proposal.id}
          >
            {userId && !isPast && (hasVoted(proposal.id) ? (
              <Button
                onClick={() => handleRemoveVote(proposal.id)}
                disabled={voting === proposal.id}
                variant="outline"
                className="min-h-11 gap-2"
                aria-label={`Vote für ${proposal.game.name} entfernen`}
                aria-pressed="true"
                data-testid={`remove-vote-${proposal.id}`}
              >
                <ThumbsDown className="h-4 w-4" aria-hidden="true" />
                Stimme entfernen
              </Button>
            ) : (
              <Button
                onClick={() => handleVote(proposal.id)}
                disabled={voting === proposal.id}
                className="min-h-11 gap-2"
                aria-label={`Für ${proposal.game.name} stimmen`}
                aria-pressed="false"
                data-testid={`vote-${proposal.id}`}
              >
                <ThumbsUp className="h-4 w-4" aria-hidden="true" />
                {voting === proposal.id ? "Wird abgestimmt …" : "Abstimmen"}
              </Button>
            ))}
          </ProposalCompactRow>
        ))}
      </ul>
    </div>
  );
}
