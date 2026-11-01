"use client";

import { Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PublicActor } from "@/lib/events/public-actor";

interface PublicProposalVoteActionsProps {
  proposalId: string;
  actor: PublicActor;
  hasVoted: boolean;
  busy: boolean;
  canVote?: boolean;
  isPast?: boolean;
  onToggle: () => void;
}

export function PublicProposalVoteActions({
  proposalId,
  actor,
  hasVoted,
  busy,
  canVote,
  isPast,
  onToggle,
}: PublicProposalVoteActionsProps) {
  const votingEnabled = canVote ?? !isPast;

  if (actor.kind === "loading") {
    return <p className="text-sm text-muted-foreground" role="status">Teilnahme wird geladen …</p>;
  }

  if (actor.kind === "observer") {
    return <p className="self-center text-xs text-muted-foreground">Melde dich an oder nimm als Gast teil, um abzustimmen.</p>;
  }

  return (
    <Button
      data-testid={`${actor.kind}-vote-${proposalId}`}
      disabled={busy || !votingEnabled}
      onClick={onToggle}
      variant={hasVoted ? "outline" : "default"}
      className={cn("min-h-11 gap-2", hasVoted && "border-success text-success")}
      aria-pressed={hasVoted}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : hasVoted ? <ThumbsDown className="h-4 w-4" aria-hidden="true" /> : <ThumbsUp className="h-4 w-4" aria-hidden="true" />}
      {hasVoted ? "Stimme entfernen" : "Stimme abgeben"}
    </Button>
  );
}
