"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Calendar,
  Check,
  HelpCircle,
  X,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DateProposal, StoredGuestState } from "./types";

interface DateVotingSectionProps {
  eventId: string;
  token: string;
  currentUserId: string | null;
  activeGuest: StoredGuestState | null;
  isPast: boolean;
  selectedDate: string | null;
  initialDateProposals: DateProposal[];
}

export function DateVotingSection({
  eventId,
  token,
  currentUserId,
  activeGuest,
  isPast,
  selectedDate,
  initialDateProposals,
}: DateVotingSectionProps) {
  const { toast } = useToast();
  const [dateProposals, setDateProposals] = useState<DateProposal[]>(initialDateProposals);
  const [dateVotingLoading, setDateVotingLoading] = useState<string | null>(null);

  const handleDateVote = async (dateProposalId: string, availability: string) => {
    setDateVotingLoading(dateProposalId);
    try {
      if (currentUserId) {
        // Logged-in user votes via authenticated API
        const res = await fetch(`/api/events/${eventId}/date-proposals/vote`, {
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
          if (currentUserId) {
            const existing = dp.votes.findIndex((v) => v.user.id === currentUserId);
            const newVotes = [...dp.votes];
            if (existing >= 0) {
              newVotes[existing] = { ...newVotes[existing], availability };
            } else {
              newVotes.push({
                id: "temp-" + Date.now(),
                availability,
                user: { id: currentUserId!, name: "Du", email: "" },
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

  if (dateProposals.length === 0) return null;

  return (
    <section data-testid="date-voting-section">
      <Card className="border-border/60 bg-background/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg text-foreground">
            <Calendar className="h-5 w-5" />
            Terminabstimmung
          </CardTitle>
          <CardDescription>
            Stimme ab, welche Termine für dich passen.
            {selectedDate && (
              <span className="ml-2 text-success font-medium">
                Gewählter Termin: {new Date(selectedDate).toLocaleDateString("de-DE", {
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
                <tr className="border-b border-border">
                  <th className="text-left p-2 min-w-[140px] text-muted-foreground">Datum</th>
                  <th className="text-center p-2 min-w-[60px] text-muted-foreground">Zusagen</th>
                  {(activeGuest || currentUserId) && !isPast && (
                    <th className="text-center p-2 min-w-[180px] text-muted-foreground">Deine Stimme</th>
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
                    selectedDate &&
                    new Date(selectedDate).toDateString() === d.toDateString();

                  // Find current guest or user vote
                  let myAvailability: string | null = null;
                  if (currentUserId) {
                    const uv = dp.votes.find((v) => v.user.id === currentUserId);
                    myAvailability = uv?.availability ?? null;
                  } else if (activeGuest) {
                    const gv = dp.guestVotes.find((v) => v.guest.id === activeGuest.id);
                    myAvailability = gv?.availability ?? null;
                  }

                  return (
                    <tr
                      key={dp.id}
                      data-testid={`date-row-${dp.id}`}
                      className={cn(
                        "border-b border-border/50 hover:bg-muted",
                        isSelected && "bg-success/20"
                      )}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {isSelected && <Crown className="h-4 w-4 text-success" />}
                          <div>
                            <div className="font-medium text-foreground">
                              {d.toLocaleDateString("de-DE", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {d.toLocaleDateString("de-DE", { year: "numeric" })}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Badge variant="secondary" className="text-xs bg-success/40 text-success">
                            {yesCount}
                          </Badge>
                          {maybeCount > 0 && (
                            <Badge variant="secondary" className="text-xs bg-warning/40 text-warning">
                              {maybeCount}
                            </Badge>
                          )}
                        </div>
                      </td>
                      {(activeGuest || currentUserId) && !isPast && (
                        <td className="text-center p-2">
                          {dateVotingLoading === dp.id ? (
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          ) : (
                            <div className="flex items-center justify-center gap-1">
                              {(["yes", "maybe", "no"] as const).map((avail) => {
                                const icon =
                                  avail === "yes" ? <Check className="h-4 w-4 text-success" /> :
                                  avail === "maybe" ? <HelpCircle className="h-4 w-4 text-warning" /> :
                                  <X className="h-4 w-4 text-destructive" />;
                                const colors =
                                  avail === "yes" ? "border-success bg-success/40" :
                                  avail === "maybe" ? "border-warning bg-warning/40" :
                                  "border-destructive bg-destructive/40";
                                const isActive = myAvailability === avail;
                                return (
                                  <button
                                    key={avail}
                                    data-testid={`date-vote-${avail}-${dp.id}`}
                                    onClick={() => handleDateVote(dp.id, avail)}
                                    className={cn(
                                      "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors",
                                      isActive ? colors : "border-border hover:border-border/80"
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
  );
}
