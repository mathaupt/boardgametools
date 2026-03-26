"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SerializedPublicEvent } from "@/lib/public-event";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Trophy,
  Vote,
  Gamepad2,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { GuestRegistrationPanel } from "./guest-registration-panel";
import { DateVotingSection } from "./date-voting-section";
import { CollectionGameProposer } from "./collection-game-proposer";
import { BggGameSearch } from "./bgg-game-search";
import type { Proposal, StoredGuestState } from "./types";

interface PublicEventClientProps {
  token: string;
  event: SerializedPublicEvent;
}

const STORAGE_PREFIX = "bgt-public-guest:";

export function PublicEventClient({ token, event }: PublicEventClientProps) {
  const { toast } = useToast();
  const [activeGuest, setActiveGuest] = useState<StoredGuestState | null>(null);
  const [guestVotes, setGuestVotes] = useState<Set<string>>(new Set());
  const [proposals, setProposals] = useState<Proposal[]>(event.proposals);
  const [userVoting, setUserVoting] = useState<string | null>(null);
  const [guestVoting, setGuestVoting] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}${token}`;
  const isPast = useMemo(() => {
    return new Date(event.eventDate) < new Date();
  }, [event.eventDate]);

  const proposedGameIds = useMemo(
    () => new Set(proposals.map((p) => p.game.id)),
    [proposals]
  );

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
    setProposals((prev) => [...prev, proposal].sort((a, b) => b.totalVotes - a.totalVotes));
  }, []);

  const updateProposalState = (
    proposalId: string,
    updater: (proposal: Proposal) => Proposal
  ) => {
    setProposals((prev) =>
      prev
        .map((proposal) => (proposal.id === proposalId ? updater(proposal) : proposal))
        .sort((a, b) => b.totalVotes - a.totalVotes)
    );
  };

  const handleUserVote = async (proposalId: string, shouldVote: boolean) => {
    if (!event.currentUserId || isPast) return;
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
    if (!activeGuest || isPast) {
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
      />

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Spielvorschläge</h2>
            <p className="text-sm text-muted-foreground">
              Stimme für deine Favoriten oder bring eigene Vorschläge ein.
            </p>
          </div>
          {isPast && (
            <Badge variant="secondary" className="bg-warning/20 text-warning">
              Event abgeschlossen
            </Badge>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {proposals.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/50">
              <CardContent className="py-10 text-center text-muted-foreground">
                Noch keine Spielvorschläge vorhanden. {event.currentUserId ? "Du kannst direkt eines hinzufügen." : "Nutze die BGG-Suche unten, um ein Spiel vorzuschlagen."}
              </CardContent>
            </Card>
          ) : (
            proposals.map((proposal, index) => {
              const userHasVoted = proposal.userHasVoted ?? false;
              const guestHasVoted = guestVotes.has(proposal.id);
              return (
                <Card key={proposal.id} className="border-border/60 bg-background/60">
                  <CardHeader>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                          {proposal.game.imageUrl ? (
                            <Image
                              src={proposal.game.imageUrl}
                              alt={proposal.game.name}
                              width={56}
                              height={56}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted/40 md:h-14 md:w-14">
                              <Gamepad2 className="h-5 w-5 text-muted-foreground md:h-6 md:w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-foreground">
                            {index < 3 && (
                              <Trophy
                                className={cn("mr-2 inline h-4 w-4", index === 0 && "text-warning", index === 1 && "text-muted-foreground", index === 2 && "text-warning")}
                              />
                            )}
                            {proposal.game.name}
                          </CardTitle>
                          <CardDescription>
                            Vorgeschlagen von {proposal.proposedBy?.name ?? "unbekannt"}
                          </CardDescription>
                          <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <span>
                              {proposal.game.minPlayers ?? "?"}-{proposal.game.maxPlayers ?? "?"} Spieler
                            </span>
                            {proposal.game.playTimeMinutes && <span>• {proposal.game.playTimeMinutes} Min.</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-foreground">{proposal.totalVotes}</p>
                          <p className="text-xs text-muted-foreground">Gesamt</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <div>👤 {proposal.voteCounts.registered} Nutzer</div>
                          <div>🎟️ {proposal.voteCounts.guests} Gäste</div>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex flex-wrap gap-3">
                        {event.currentUserId && (
                          <Button
                            data-testid={`user-vote-${proposal.id}`}
                            disabled={!!userVoting || isPast}
                            onClick={() => handleUserVote(proposal.id, !userHasVoted)}
                            variant={userHasVoted ? "outline" : "default"}
                            className={cn("gap-2", userHasVoted && "border-success text-success")}
                          >
                            {userVoting === proposal.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : userHasVoted ? (
                              <ThumbsDown className="h-4 w-4" />
                            ) : (
                              <ThumbsUp className="h-4 w-4" />
                            )}
                            {userHasVoted ? "Vote entfernen" : "Als User voten"}
                          </Button>
                        )}
                        <Button
                          data-testid={`guest-vote-${proposal.id}`}
                          disabled={!!guestVoting || isPast || !activeGuest}
                          onClick={() => handleGuestVote(proposal.id, !guestHasVoted)}
                          variant={guestHasVoted ? "secondary" : "outline"}
                          className={cn(
                            "gap-2",
                            guestHasVoted && "border-primary text-primary",
                            !activeGuest && "opacity-50"
                          )}
                        >
                          {guestVoting === proposal.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Vote className="h-4 w-4" />
                          )}
                          {guestHasVoted ? "Gast-Stimme entfernen" : activeGuest ? "Als Gast voten" : "Gastmodus nötig"}
                        </Button>
                      </div>
                      {!event.currentUserId && !activeGuest && (
                        <p className="text-xs text-muted-foreground">
                          Logge dich ein oder registriere dich als Gast, um abstimmen zu können.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </section>

      {/* Terminabstimmung */}
      <DateVotingSection
        eventId={event.id}
        token={token}
        currentUserId={event.currentUserId}
        activeGuest={activeGuest}
        isPast={isPast}
        selectedDate={event.selectedDate}
        initialDateProposals={event.dateProposals}
      />

      {event.currentUserId && (
        <CollectionGameProposer
          token={token}
          currentUserId={event.currentUserId}
          proposedGameIds={proposedGameIds}
          onProposalAdded={handleProposalAdded}
        />
      )}

      {/* BGG-Import: available to everyone (guests + logged-in) */}
      {!isPast && (
        <BggGameSearch
          token={token}
          activeGuestId={activeGuest?.id ?? null}
          currentUserId={event.currentUserId}
          onProposalAdded={handleProposalAdded}
        />
      )}
    </div>
  );
}
