"use client";

import { Loader2, ThumbsDown, ThumbsUp, Vote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PublicProposalVoteActionsProps {
  proposalId: string;
  currentUserId: string | null;
  activeGuest: boolean;
  userHasVoted: boolean;
  guestHasVoted: boolean;
  userVoting: string | null;
  guestVoting: string | null;
  isPast: boolean;
  onUserVote: () => void;
  onGuestVote: () => void;
}

export function PublicProposalVoteActions({
  proposalId,
  currentUserId,
  activeGuest,
  userHasVoted,
  guestHasVoted,
  userVoting,
  guestVoting,
  isPast,
  onUserVote,
  onGuestVote,
}: PublicProposalVoteActionsProps) {
  return (
    <>
      {currentUserId && (
        <Button
          data-testid={`user-vote-${proposalId}`}
          disabled={!!userVoting || isPast}
          onClick={onUserVote}
          variant={userHasVoted ? "outline" : "default"}
          className={cn("min-h-11 gap-2", userHasVoted && "border-success text-success")}
          aria-pressed={userHasVoted}
        >
          {userVoting === proposalId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : userHasVoted ? <ThumbsDown className="h-4 w-4" aria-hidden="true" /> : <ThumbsUp className="h-4 w-4" aria-hidden="true" />}
          {userHasVoted ? "Vote entfernen" : "Als User voten"}
        </Button>
      )}
      <Button
        data-testid={`guest-vote-${proposalId}`}
        disabled={!!guestVoting || isPast || !activeGuest}
        onClick={onGuestVote}
        variant={guestHasVoted ? "secondary" : "outline"}
        className={cn("min-h-11 gap-2", guestHasVoted && "border-primary text-primary", !activeGuest && "opacity-50")}
        aria-pressed={guestHasVoted}
      >
        {guestVoting === proposalId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Vote className="h-4 w-4" aria-hidden="true" />}
        {guestHasVoted ? "Gast-Stimme entfernen" : activeGuest ? "Als Gast voten" : "Gastmodus nötig"}
      </Button>
      {!currentUserId && !activeGuest && <p className="self-center text-xs text-muted-foreground">Logge dich ein oder registriere dich als Gast, um abstimmen zu können.</p>}
    </>
  );
}
