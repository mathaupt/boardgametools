"use client";

import { useEffect, useMemo, useState } from "react";
import { SerializedPublicEvent } from "@/lib/public-event";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Users,
  UserPlus,
  Loader2,
  Copy,
  Trophy,
  Vote,
  UserCircle,
  Gamepad2,
  ThumbsUp,
  ThumbsDown,
  Plus,
  Search,
  Calendar,
  Check,
  HelpCircle,
  X,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PublicEventClientProps {
  token: string;
  event: SerializedPublicEvent;
}

type Proposal = SerializedPublicEvent["proposals"][number];
type Guest = SerializedPublicEvent["guestParticipants"][number];

type DateProposal = SerializedPublicEvent["dateProposals"][number];

const STORAGE_PREFIX = "bgt-public-guest:";

interface StoredGuestState {
  id: string;
  nickname: string;
  votes?: string[];
}

export function PublicEventClient({ token, event }: PublicEventClientProps) {
  const { toast } = useToast();
  const [nickname, setNickname] = useState("");
  const [joining, setJoining] = useState(false);
  const [guestList, setGuestList] = useState<Guest[]>(event.guestParticipants);
  const [activeGuest, setActiveGuest] = useState<StoredGuestState | null>(null);
  const [guestVotes, setGuestVotes] = useState<Set<string>>(new Set());
  const [proposals, setProposals] = useState<Proposal[]>(event.proposals);
  const [userVoting, setUserVoting] = useState<string | null>(null);
  const [guestVoting, setGuestVoting] = useState<string | null>(null);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [gamesLoading, setGamesLoading] = useState(false);
  const [gameSearch, setGameSearch] = useState("");
  const [gamesError, setGamesError] = useState<string | null>(null);
  const [dateProposals, setDateProposals] = useState<DateProposal[]>(event.dateProposals);
  const [dateVotingLoading, setDateVotingLoading] = useState<string | null>(null);

  const storageKey = `${STORAGE_PREFIX}${token}`;
  const isPast = useMemo(() => {
    return new Date(event.eventDate) < new Date();
  }, [event.eventDate]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed: StoredGuestState = JSON.parse(raw);
      setActiveGuest(parsed);
      setGuestVotes(new Set(parsed.votes ?? []));
    } catch (error) {
      console.warn("Failed to parse stored guest state", error);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!event.currentUserId) return;
    const loadGames = async () => {
      setGamesLoading(true);
      setGamesError(null);
      try {
        const response = await fetch("/api/games", {
          headers: { "Content-Type": "application/json" },
        });
        if (!response.ok) {
          throw new Error("Konnte Sammlung nicht laden");
        }
        const data: GameSummary[] = await response.json();
        setGames(data);
      } catch (error) {
        console.error("Error loading games", error);
        setGamesError("Sammlung konnte nicht geladen werden");
      } finally {
        setGamesLoading(false);
      }
    };
    loadGames();
  }, [event.currentUserId]);

  const persistGuest = (guest: StoredGuestState, votes: Set<string>) => {
    if (typeof window === "undefined") return;
    const payload: StoredGuestState = {
      id: guest.id,
      nickname: guest.nickname,
      votes: Array.from(votes),
    };
    window.localStorage.setItem(storageKey, JSON.stringify(payload));
  };

  const handleGuestJoin = async () => {
    if (!nickname.trim()) {
      toast({ title: "Nickname fehlt", description: "Bitte einen Spitznamen eingeben.", variant: "destructive" });
      return;
    }
    setJoining(true);
    try {
      const response = await fetch(`/api/public/event/${token}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nickname: nickname.trim() }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Beitritt fehlgeschlagen");
      }
      const participant: Guest = await response.json();
      setGuestList((prev) => {
        const exists = prev.some((guest) => guest.id === participant.id);
        if (exists) {
          return prev.map((guest) => (guest.id === participant.id ? participant : guest));
        }
        return [...prev, participant].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      const stored: StoredGuestState = { id: participant.id, nickname: participant.nickname };
      setActiveGuest(stored);
      setGuestVotes(new Set());
      persistGuest(stored, new Set());
      setNickname("");
      toast({ title: "Willkommen!", description: "Du bist jetzt für das Event registriert." });
    } catch (error) {
      console.error("Guest join error", error);
      toast({
        title: "Beitritt fehlgeschlagen",
        description: error instanceof Error ? error.message : "Versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  };

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

  const availableGames = useMemo(() => {
    if (!event.currentUserId) return [];
    const proposedIds = new Set(proposals.map((proposal) => proposal.game.id));
    return games.filter((game) => !proposedIds.has(game.id));
  }, [event.currentUserId, games, proposals]);

  const filteredGames = useMemo(() => {
    if (!gameSearch.trim()) return availableGames;
    return availableGames.filter((game) =>
      game.name.toLowerCase().includes(gameSearch.trim().toLowerCase())
    );
  }, [availableGames, gameSearch]);

  const handleProposeGame = async (gameId: string) => {
    setGamesLoading(true);
    try {
      const response = await fetch(`/api/public/event/${token}/propose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "Vorschlag fehlgeschlagen");
      }
      const proposal: Proposal = await response.json();
      setProposals((prev) => [...prev, proposal].sort((a, b) => b.totalVotes - a.totalVotes));
      toast({ title: "Spiel vorgeschlagen", description: "Danke für deinen Beitrag!" });
    } catch (error) {
      console.error("Propose error", error);
      toast({
        title: "Fehler beim Vorschlag",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setGamesLoading(false);
    }
  };

  const handleDateVote = async (dateProposalId: string, availability: string) => {
    setDateVotingLoading(dateProposalId);
    try {
      if (event.currentUserId) {
        // Logged-in user votes via authenticated API
        const res = await fetch(`/api/events/${event.id}/date-proposals/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dateProposalId, availability }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Vote fehlgeschlagen");
        }
      } else if (activeGuest) {
        // Guest votes via public API
        const res = await fetch(`/api/public/event/${token}/date-vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            guestId: activeGuest.id,
            votes: [{ dateProposalId, availability }],
          }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error ?? "Gast-Vote fehlgeschlagen");
        }
      }

      // Optimistic local update
      setDateProposals((prev) =>
        prev.map((dp) => {
          if (dp.id !== dateProposalId) return dp;
          if (event.currentUserId) {
            const existing = dp.votes.findIndex((v) => v.user.id === event.currentUserId);
            const newVotes = [...dp.votes];
            if (existing >= 0) {
              newVotes[existing] = { ...newVotes[existing], availability };
            } else {
              newVotes.push({
                id: "temp-" + Date.now(),
                availability,
                user: { id: event.currentUserId!, name: "Du", email: "" },
              });
            }
            return { ...dp, votes: newVotes };
          } else if (activeGuest) {
            const existing = dp.guestVotes.findIndex((v) => v.guest.id === activeGuest.id);
            const newGuestVotes = [...dp.guestVotes];
            if (existing >= 0) {
              newGuestVotes[existing] = { ...newGuestVotes[existing], availability };
            } else {
              newGuestVotes.push({
                id: "temp-" + Date.now(),
                availability,
                guest: { id: activeGuest.id, nickname: activeGuest.nickname },
              });
            }
            return { ...dp, guestVotes: newGuestVotes };
          }
          return dp;
        })
      );
    } catch (error) {
      console.error("Date vote error", error);
      toast({
        title: "Termin-Vote fehlgeschlagen",
        description: error instanceof Error ? error.message : "Bitte versuche es erneut.",
        variant: "destructive",
      });
    } finally {
      setDateVotingLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <UserPlus className="h-5 w-5" />
              Als Gast teilnehmen
            </CardTitle>
            <CardDescription>
              Nickname eingeben, um abstimmen zu können
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeGuest ? (
              <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm">
                <p className="font-semibold text-emerald-200">Willkommen zurück, {activeGuest.nickname}!</p>
                <p className="text-emerald-100/80">
                  Du kannst jetzt als Gast abstimmen. Deine Stimme wird unter deinem Nickname gezählt.
                </p>
              </div>
            ) : (
              <>
                <label htmlFor="guest-nickname" className="text-sm font-medium text-muted-foreground">
                  Spitzname
                </label>
                <Input
                  id="guest-nickname"
                  data-testid="guest-nickname-input"
                  placeholder="z.B. W0rkerPlacementPro"
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  disabled={joining}
                  className="bg-background/80"
                />
                <Button
                  data-testid="guest-join-button"
                  onClick={handleGuestJoin}
                  disabled={joining || nickname.trim().length < 2}
                  className="w-full"
                >
                  {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {joining ? "Beitritt läuft..." : "Als Gast registrieren"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Gästeliste ({guestList.length})
            </CardTitle>
            <CardDescription>
              Alle öffentlichen Teilnehmer:innen
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {guestList.length === 0 ? (
              <p className="text-sm text-muted-foreground">Noch keine Gäste registriert.</p>
            ) : (
              guestList.map((guest) => (
                <div
                  key={guest.id}
                  className={cn(
                    "flex items-center justify-between rounded-lg border border-border/60 bg-background/60 px-3 py-2",
                    activeGuest?.id === guest.id && "border-emerald-400/60 bg-emerald-500/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="rounded-full bg-muted p-2 text-muted-foreground">
                      <UserCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{guest.nickname}</p>
                      <p className="text-xs text-muted-foreground">
                        Beigetreten am {new Date(guest.createdAt).toLocaleDateString("de-DE")}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {guest.votesCount} Votes
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white">Spielvorschläge</h2>
            <p className="text-sm text-muted-foreground">
              Stimme für deine Favoriten oder bring eigene Vorschläge ein.
            </p>
          </div>
          {isPast && (
            <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-200">
              Event abgeschlossen
            </Badge>
          )}
        </div>
        <div className="mt-4 space-y-4">
          {proposals.length === 0 ? (
            <Card className="border-dashed border-border/60 bg-background/50">
              <CardContent className="py-10 text-center text-muted-foreground">
                Noch keine Spielvorschläge vorhanden. {event.currentUserId ? "Du kannst direkt eines hinzufügen." : "Registriere dich als Gast oder logge dich ein, um Vorschläge zu machen."}
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
                        <div className="hidden md:block">
                          {proposal.game.imageUrl ? (
                            <img
                              src={proposal.game.imageUrl}
                              alt={proposal.game.name}
                              className="h-14 w-14 rounded-lg object-cover"
                              onError={(event) => {
                                event.currentTarget.src = "/placeholder-game.png";
                              }}
                            />
                          ) : (
                            <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-muted/40">
                              <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white">
                            {index < 3 && (
                              <Trophy
                                className={cn("mr-2 inline h-4 w-4", index === 0 && "text-yellow-400", index === 1 && "text-slate-300", index === 2 && "text-amber-600")}
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
                          <p className="text-2xl font-bold text-white">{proposal.totalVotes}</p>
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
                            className={cn("gap-2", userHasVoted && "border-emerald-500 text-emerald-300")}
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
                            guestHasVoted && "border-indigo-400 text-indigo-100",
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
      {dateProposals.length > 0 && (
        <section>
          <Card className="border-border/60 bg-background/60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <Calendar className="h-5 w-5" />
                Terminabstimmung
              </CardTitle>
              <CardDescription>
                Stimme ab, welche Termine für dich passen.
                {event.selectedDate && (
                  <span className="ml-2 text-green-400 font-medium">
                    Gewählter Termin: {new Date(event.selectedDate).toLocaleDateString("de-DE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left p-2 min-w-[140px] text-slate-300">Datum</th>
                      <th className="text-center p-2 min-w-[60px] text-slate-300">Zusagen</th>
                      {(activeGuest || event.currentUserId) && !isPast && (
                        <th className="text-center p-2 min-w-[180px] text-slate-300">Deine Stimme</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {dateProposals.map((dp) => {
                      const d = new Date(dp.date);
                      const yesCount = [...dp.votes, ...dp.guestVotes].filter(
                        (v) => v.availability === "yes"
                      ).length;
                      const maybeCount = [...dp.votes, ...dp.guestVotes].filter(
                        (v) => v.availability === "maybe"
                      ).length;
                      const isSelected =
                        event.selectedDate &&
                        new Date(event.selectedDate).toDateString() === d.toDateString();

                      // Find current guest or user vote
                      let myAvailability: string | null = null;
                      if (event.currentUserId) {
                        const uv = dp.votes.find((v) => v.user.id === event.currentUserId);
                        myAvailability = uv?.availability ?? null;
                      } else if (activeGuest) {
                        const gv = dp.guestVotes.find((v) => v.guest.id === activeGuest.id);
                        myAvailability = gv?.availability ?? null;
                      }

                      return (
                        <tr
                          key={dp.id}
                          className={cn(
                            "border-b border-white/5 hover:bg-white/5",
                            isSelected && "bg-green-900/20"
                          )}
                        >
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {isSelected && <Crown className="h-4 w-4 text-green-400" />}
                              <div>
                                <div className="font-medium text-white">
                                  {d.toLocaleDateString("de-DE", {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  })}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {d.toLocaleDateString("de-DE", { year: "numeric" })}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-2">
                            <div className="flex items-center justify-center gap-1">
                              <Badge variant="secondary" className="text-xs bg-green-900/40 text-green-300">
                                {yesCount}
                              </Badge>
                              {maybeCount > 0 && (
                                <Badge variant="secondary" className="text-xs bg-yellow-900/40 text-yellow-300">
                                  {maybeCount}
                                </Badge>
                              )}
                            </div>
                          </td>
                          {(activeGuest || event.currentUserId) && !isPast && (
                            <td className="text-center p-2">
                              {dateVotingLoading === dp.id ? (
                                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                              ) : (
                                <div className="flex items-center justify-center gap-1">
                                  {(["yes", "maybe", "no"] as const).map((avail) => {
                                    const icon =
                                      avail === "yes" ? <Check className="h-4 w-4 text-green-400" /> :
                                      avail === "maybe" ? <HelpCircle className="h-4 w-4 text-yellow-400" /> :
                                      <X className="h-4 w-4 text-red-400" />;
                                    const colors =
                                      avail === "yes" ? "border-green-500 bg-green-900/40" :
                                      avail === "maybe" ? "border-yellow-500 bg-yellow-900/40" :
                                      "border-red-500 bg-red-900/40";
                                    const isActive = myAvailability === avail;
                                    return (
                                      <button
                                        key={avail}
                                        onClick={() => handleDateVote(dp.id, avail)}
                                        className={cn(
                                          "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                                          isActive ? colors : "border-white/20 hover:border-white/40"
                                        )}
                                        title={
                                          avail === "yes" ? "Ja, passt" :
                                          avail === "maybe" ? "Vielleicht" :
                                          "Nein, geht nicht"
                                        }
                                        aria-label={
                                          avail === "yes" ? "Ja, passt" :
                                          avail === "maybe" ? "Vielleicht" :
                                          "Nein, geht nicht"
                                        }
                                      >
                                        {icon}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      {event.currentUserId && (
        <section>
          <Card className="border-border/60 bg-background/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Plus className="h-5 w-5" />
                Weiteres Spiel vorschlagen
              </CardTitle>
              <CardDescription>
                Wähle ein Spiel aus deiner Sammlung aus, um es der Abstimmung hinzuzufügen.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <Input
                  placeholder="Spiel suchen ..."
                  value={gameSearch}
                  onChange={(event) => setGameSearch(event.target.value)}
                  className="bg-background"
                />
                <Button
                  variant="outline"
                  onClick={() => setGameSearch("")}
                  title="Suche zurücksetzen"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Reset
                </Button>
              </div>
              {gamesError && <p className="text-sm text-destructive">{gamesError}</p>}
              <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                {gamesLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sammlung wird geladen...
                  </div>
                ) : filteredGames.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    {availableGames.length === 0
                      ? "Alle Spiele deiner Sammlung sind bereits im Voting."
                      : "Keine Spiele gefunden."}
                  </p>
                ) : (
                  filteredGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-3 py-2"
                    >
                      <div>
                        <p className="font-medium text-sm text-white">{game.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {game.minPlayers ?? "?"}-{game.maxPlayers ?? "?"} Spieler
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={gamesLoading}
                        onClick={() => handleProposeGame(game.id)}
                        data-testid={`propose-${game.id}`}
                      >
                        Vorschlagen
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </section>
      )}
    </div>
  );
}

interface GameSummary {
  id: string;
  name: string;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  complexity?: number | null;
  imageUrl?: string | null;
}
