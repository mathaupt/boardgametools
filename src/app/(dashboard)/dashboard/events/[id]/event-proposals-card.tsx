import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Vote, Plus } from "lucide-react";
import Link from "next/link";
import VotingClient from "./voting-client";

interface NormalizedProposal {
  id: string;
  game: {
    id: string;
    name: string;
    imageUrl: string | null;
    minPlayers: number;
    maxPlayers: number;
    playTimeMinutes: number | null;
    complexity: number | null;
  };
  proposedBy: { name: string | null };
  _count: { votes: number; guestVotes: number };
  [key: string]: unknown;
}

interface EventProposalsCardProps {
  eventId: string;
  proposals: NormalizedProposal[];
  userId: string | null;
  userVoteIds: Set<string>;
  isPast: boolean;
  isCreator: boolean;
  selectedGameId?: string;
  winningProposalId?: string;
}

export function EventProposalsCard({
  eventId,
  proposals,
  userId,
  userVoteIds,
  isPast,
  isCreator,
  selectedGameId,
  winningProposalId,
}: EventProposalsCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Vote className="h-5 w-5" />
              Spielvorschläge ({proposals.length})
            </CardTitle>
            <CardDescription>Vorgeschlagene Spiele für dieses Event</CardDescription>
          </div>
          {isCreator && !isPast && (
            <Link href={`/dashboard/events/${eventId}/voting`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Spiel vorschlagen
              </Button>
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {proposals.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">🎲</div>
            <h3 className="font-semibold mb-2">Noch keine Vorschläge</h3>
            <p className="text-muted-foreground mb-4">
              Es wurden noch keine Spiele für dieses Event vorgeschlagen.
            </p>
            {isCreator && !isPast && (
              <Link href={`/dashboard/events/${eventId}/voting`}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Ersten Vorschlag machen
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <VotingClient
            proposals={proposals}
            eventId={eventId}
            userId={userId}
            userVoteIds={userVoteIds}
            isPast={isPast}
            selectedGameId={selectedGameId}
            winningProposalId={winningProposalId}
          />
        )}
      </CardContent>
    </Card>
  );
}
