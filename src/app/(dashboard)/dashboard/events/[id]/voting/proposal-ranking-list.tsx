"use client";

import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Star, Trophy, Vote, X, Gamepad2, Trash2 } from "lucide-react";
import { ProposalWithDetails } from "./voting-types";

interface ProposalRankingListProps {
  proposals: ProposalWithDetails[];
  voting: string | null;
  deletingProposal: string | null;
  eventIsCreator: boolean;
  currentUserId: string;
  onVote: (proposalId: string) => void;
  onRemoveVote: (proposalId: string) => void;
  onDeleteProposal: (proposalId: string) => void;
}

export default function ProposalRankingList({
  proposals,
  voting,
  deletingProposal,
  eventIsCreator,
  currentUserId,
  onVote,
  onRemoveVote,
  onDeleteProposal,
}: ProposalRankingListProps) {
  return (
    <>
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Trophy className="h-5 w-5 text-warning" />
        Voting-Rangliste
      </h2>
      
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
        proposals.map((proposal, index) => (
          <Card key={proposal.id} className="relative">
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
                          <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-primary-foreground ${
                      index === 0 ? 'bg-warning' : 
                      index === 1 ? 'bg-muted-foreground' : 
                      index === 2 ? 'bg-accent' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <CardTitle className="text-lg">{proposal.game.name}</CardTitle>
                  </div>
                  
                  {/* Spiel-Details */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {proposal.game.minPlayers}-{proposal.game.maxPlayers} Spieler
                    </Badge>
                    
                    {proposal.game.playTimeMinutes && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        ⏱️ {proposal.game.playTimeMinutes} Min.
                      </Badge>
                    )}
                    
                    {proposal.game.complexity && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
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
                    <div className="text-2xl font-bold">{proposal._count.votes}</div>
                    <div className="text-sm text-muted-foreground">Votes</div>
                  </div>
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
                        <span className="text-xs">...</span>
                      ) : (
                        <Trash2 className="h-4 w-4" />
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
                      <X className="h-4 w-4" />
                      Vote entfernen
                    </>
                  ) : (
                    <>
                      <Vote className="h-4 w-4" />
                      {voting === proposal.id ? 'Wird abgestimmt...' : 'Vote'}
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
