"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trophy, ThumbsUp, ThumbsDown, Users, Star, Gamepad } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

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
    name: string;
  };
  _count: {
    votes: number;
  };
}

interface VotingClientProps {
  proposals: Proposal[];
  eventId: string;
  userId: string | null;
  userVoteIds: Set<string>;
  isPast: boolean;
  selectedGameId?: string;
}

export default function VotingClient({ 
  proposals, 
  eventId, 
  userId, 
  userVoteIds, 
  isPast, 
  selectedGameId 
}: VotingClientProps) {
  const [voting, setVoting] = useState<string | null>(null);
  const [localUserVoteIds, setLocalUserVoteIds] = useState<Set<string>>(userVoteIds);
  const [localProposals, setLocalProposals] = useState(proposals);
  const { toast } = useToast();

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
      ).sort((a, b) => b._count.votes - a._count.votes));
      
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
      ).sort((a, b) => b._count.votes - a._count.votes));
      
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
    <div className="space-y-3">
      {localProposals
        .sort((a, b) => b._count.votes - a._count.votes)
        .map((proposal, index) => (
          <div key={proposal.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 focus-within:ring-2 focus-within:ring-ring transition-colors bg-card gap-4 sm:gap-0">
            <div className="flex items-start sm:items-center gap-3 flex-1">
              {index === 0 && selectedGameId && (
                <Trophy className="h-5 w-5 text-warning flex-shrink-0 mt-0.5 sm:mt-0" aria-label="Trophy für führendes Spiel" />
              )}
              {/* Game Image */}
              <div className="flex-shrink-0">
                {proposal.game.imageUrl ? (
                  <img 
                    src={proposal.game.imageUrl} 
                    alt={proposal.game.name}
                    className="w-16 h-16 rounded-lg object-cover border border-border"
                    onError={(e) => {
                      // Fallback to placeholder if image fails to load
                      e.currentTarget.src = '/placeholder-game.png';
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted border border-border flex items-center justify-center">
                    <Gamepad className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-lg text-foreground break-words">{proposal.game.name}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  Vorgeschlagen von {proposal.proposedBy.name}
                </div>
                
                {/* Spiel-Details */}
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="flex items-center gap-1 border-border bg-card">
                    <Users className="h-3 w-3" />
                    {proposal.game.minPlayers}-{proposal.game.maxPlayers} Spieler
                  </Badge>
                  
                  {proposal.game.playTimeMinutes && (
                    <Badge variant="outline" className="flex items-center gap-1 border-border bg-card">
                      ⏱️ {proposal.game.playTimeMinutes} Min.
                    </Badge>
                  )}
                  
                  {proposal.game.complexity && (
                    <Badge variant="outline" className="flex items-center gap-1 border-border bg-card">
                      <Star className="h-3 w-3" />
                      {"★".repeat(proposal.game.complexity)}{"☆".repeat(5 - proposal.game.complexity)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-3">
              {/* Vote Count */}
              <div className="text-center min-w-[60px]">
                <div className="text-2xl font-bold text-foreground">{proposal._count.votes}</div>
                <div className="text-xs text-muted-foreground">Votes</div>
              </div>
              
              {/* Voting Buttons */}
              {userId && !isPast && (
                <div className="flex gap-1">
                  {hasVoted(proposal.id) ? (
                    <Button
                      onClick={() => handleRemoveVote(proposal.id)}
                      disabled={voting === proposal.id}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 border-border bg-card hover:bg-accent"
                      aria-label={`Vote für ${proposal.game.name} entfernen`}
                    >
                      <ThumbsDown className="h-4 w-4" />
                      <span className="hidden sm:inline">{voting === proposal.id ? 'Wird entfernt...' : 'Entfernen'}</span>
                      <span className="sm:hidden">{voting === proposal.id ? '...' : '✕'}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={() => handleVote(proposal.id)}
                      disabled={voting === proposal.id}
                      size="sm"
                      className="flex items-center gap-1 bg-primary text-primary-foreground hover:bg-primary/90"
                      aria-label={`Für ${proposal.game.name} stimmen`}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span className="hidden sm:inline">{voting === proposal.id ? 'Wird abgestimmt...' : 'Vote'}</span>
                      <span className="sm:hidden">{voting === proposal.id ? '...' : '✓'}</span>
                    </Button>
                  )}
                </div>
              )}
              
              {/* Selected Badge */}
              {selectedGameId === proposal.game.id && (
                <Badge variant="default" className="bg-success text-success-foreground border-success">Ausgewählt</Badge>
              )}
            </div>
          </div>
        ))}
    </div>
  );
}
