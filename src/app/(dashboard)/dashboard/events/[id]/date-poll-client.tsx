"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Calendar,
  Check,
  HelpCircle,
  X,
  Trash2,
  Crown,
  Loader2,
  RefreshCcw,
} from "lucide-react";

type DateVote = {
  id: string;
  availability: string;
  user: { id: string; name: string; email: string };
};

type GuestDateVote = {
  id: string;
  availability: string;
  guest: { id: string; nickname: string };
};

type DateProposal = {
  id: string;
  date: string;
  votes: DateVote[];
  guestVotes: GuestDateVote[];
};

const WEEKDAY_LABELS = [
  { value: 0, label: "So" },
  { value: 1, label: "Mo" },
  { value: 2, label: "Di" },
  { value: 3, label: "Mi" },
  { value: 4, label: "Do" },
  { value: 5, label: "Fr" },
  { value: 6, label: "Sa" },
];

function getAvailabilityIcon(availability: string) {
  switch (availability) {
    case "yes":
      return <Check className="h-4 w-4 text-green-600" />;
    case "maybe":
      return <HelpCircle className="h-4 w-4 text-yellow-600" />;
    case "no":
      return <X className="h-4 w-4 text-red-600" />;
    default:
      return null;
  }
}

function getAvailabilityColor(availability: string) {
  switch (availability) {
    case "yes":
      return "bg-green-100 text-green-800 border-green-300";
    case "maybe":
      return "bg-yellow-100 text-yellow-800 border-yellow-300";
    case "no":
      return "bg-red-100 text-red-800 border-red-300";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

function countAvailability(proposal: DateProposal) {
  const all = [
    ...proposal.votes.map((v) => v.availability),
    ...proposal.guestVotes.map((v) => v.availability),
  ];
  return {
    yes: all.filter((a) => a === "yes").length,
    maybe: all.filter((a) => a === "maybe").length,
    no: all.filter((a) => a === "no").length,
    total: all.length,
  };
}

export default function DatePollClient({
  eventId,
  userId,
  isCreator,
  isPast,
  initialProposals,
  selectedDate,
}: {
  eventId: string;
  userId: string | null;
  isCreator: boolean;
  isPast: boolean;
  initialProposals: DateProposal[];
  selectedDate: string | null;
}) {
  const router = useRouter();
  const [proposals, setProposals] = useState<DateProposal[]>(initialProposals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollClosed, setPollClosed] = useState(Boolean(selectedDate));
  const [finalDate, setFinalDate] = useState<string | null>(selectedDate);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Create form state
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);

  // Voting state
  const [votingLoading, setVotingLoading] = useState<string | null>(null);
  const [selectingDate, setSelectingDate] = useState<string | null>(null);

  useEffect(() => {
    setProposals(initialProposals);
  }, [initialProposals]);

  useEffect(() => {
    setPollClosed(Boolean(selectedDate));
    setFinalDate(selectedDate);
  }, [selectedDate]);

  const refreshProposals = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/date-proposals`);
      if (res.ok) {
        const data = await res.json();
        setProposals(data);
      }
    } catch {
      // ignore
    }
  }, [eventId]);

  const handleCreateProposals = async () => {
    if (pollClosed) return;
    if (!startDate || !endDate) {
      setError("Bitte Start- und Enddatum angeben");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const body: Record<string, unknown> = {
        startDate,
        endDate,
      };
      if (selectedWeekdays.length > 0) {
        body.weekdays = selectedWeekdays;
      }

      const res = await fetch(`/api/events/${eventId}/date-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Fehler beim Erstellen");
        return;
      }

      const data = await res.json();
      setProposals(data);
      setShowCreateForm(false);
      setStartDate("");
      setEndDate("");
      setSelectedWeekdays([]);
    } catch {
      setError("Netzwerkfehler");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllProposals = async () => {
    if (pollClosed) return;
    if (!confirm("Alle Terminvorschläge und Abstimmungen löschen?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/date-proposals`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProposals([]);
      }
    } catch {
      setError("Fehler beim Löschen");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (dateProposalId: string, availability: string) => {
    if (pollClosed) return;
    if (!userId) return;
    setVotingLoading(dateProposalId);

    try {
      const res = await fetch(`/api/events/${eventId}/date-proposals/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateProposalId, availability }),
      });

      if (res.ok) {
        await refreshProposals();
      }
    } catch {
      // ignore
    } finally {
      setVotingLoading(null);
    }
  };

  const handleSelectDate = async (dateProposalId: string) => {
    if (!isCreator) return;
    if (pollClosed) return;
    setSelectingDate(dateProposalId);

    try {
      const res = await fetch(`/api/events/${eventId}/date-proposals/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateProposalId }),
      });

      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.selectedDate) {
          setFinalDate(data.selectedDate);
          setPollClosed(true);
        }
        router.refresh();
      }
    } catch {
      setError("Fehler bei der Terminauswahl");
    } finally {
      setSelectingDate(null);
    }
  };

  const handleResetPoll = async () => {
    if (!isCreator) return;
    setResetting(true);
    setError(null);
    try {
      const res = await fetch(`/api/events/${eventId}/date-proposals/reset`, {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error ?? "Fehler beim Zurücksetzen");
        return;
      }
      setPollClosed(false);
      setFinalDate(null);
      setProposals([]);
      setShowCreateForm(false);
      await refreshProposals();
      router.refresh();
    } catch {
      setError("Fehler beim Zurücksetzen");
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  };

  const toggleWeekday = (day: number) => {
    setSelectedWeekdays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const getUserVote = (proposal: DateProposal): string | null => {
    if (!userId) return null;
    const vote = proposal.votes.find((v) => v.user.id === userId);
    return vote?.availability ?? null;
  };

  // Collect all unique participants for the matrix header
  const allUsers = new Map<string, string>();
  const allGuests = new Map<string, string>();
  proposals.forEach((p) => {
    p.votes.forEach((v) => allUsers.set(v.user.id, v.user.name));
    p.guestVotes.forEach((v) => allGuests.set(v.guest.id, v.guest.nickname));
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Terminabstimmung
            </CardTitle>
            <CardDescription>
              {proposals.length === 0
                ? "Noch keine Terminvorschläge erstellt"
                : `${proposals.length} Terminvorschläge`}
              {finalDate && (
                <span className="ml-2 text-green-700 font-medium">
                  — Termin gewählt: {new Date(finalDate).toLocaleDateString("de-DE", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </CardDescription>
          </div>
          {isCreator && !isPast && !pollClosed && (
            <div className="flex gap-2">
              {proposals.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteAllProposals}
                  disabled={loading}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Alle löschen
                </Button>
              )}
              <Button
                size="sm"
                onClick={() => setShowCreateForm(!showCreateForm)}
                disabled={loading}
              >
                <Calendar className="h-4 w-4 mr-1" />
                {showCreateForm ? "Abbrechen" : "Termine erstellen"}
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        {pollClosed && finalDate && (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-900">
              Die Terminabstimmung ist abgeschlossen. Der ausgewählte Termin ist
              <span className="font-semibold">
                {" "}
                {new Date(finalDate).toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
              .
            </div>
            {isCreator && !isPast && (
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(true)}
                disabled={resetting}
                data-testid="date-poll-reset"
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Neue Terminabstimmung starten
              </Button>
            )}
          </div>
        )}

        {!pollClosed && (
          <>
        {/* Create Form */}
        {showCreateForm && (
          <div className="p-4 border rounded-lg bg-muted/30 space-y-4">
            <h4 className="font-medium">Zeitraum & Wochentage wählen</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Von</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="endDate">Bis</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Nur bestimmte Wochentage (optional)</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {WEEKDAY_LABELS.map((day) => (
                  <label
                    key={day.value}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedWeekdays.includes(day.value)}
                      onChange={() => toggleWeekday(day.value)}
                    />
                    <span className="text-sm">{day.label}</span>
                  </label>
                ))}
              </div>
              {selectedWeekdays.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Keine Auswahl = alle Tage
                </p>
              )}
            </div>

            <Button
              onClick={handleCreateProposals}
              disabled={loading || !startDate || !endDate}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-2" />
              )}
              Termine erstellen
            </Button>
          </div>
        )}

        {/* Voting Matrix */}
        {proposals.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 min-w-[140px]">Datum</th>
                  {Array.from(allUsers).map(([id, name]) => (
                    <th key={id} className="text-center p-2 min-w-[80px]">
                      <span className="text-xs font-medium">{name}</span>
                    </th>
                  ))}
                  {Array.from(allGuests).map(([id, nickname]) => (
                    <th key={id} className="text-center p-2 min-w-[80px]">
                      <span className="text-xs font-medium text-muted-foreground">
                        {nickname} (Gast)
                      </span>
                    </th>
                  ))}
                  <th className="text-center p-2 min-w-[60px]">Summe</th>
                  {userId && !isPast && (
                    <th className="text-center p-2 min-w-[150px]">Deine Stimme</th>
                  )}
                  {isCreator && !isPast && (
                    <th className="text-center p-2 min-w-[80px]">Auswählen</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {proposals.map((proposal) => {
                  const d = new Date(proposal.date);
                  const counts = countAvailability(proposal);
                  const myVote = getUserVote(proposal);
                  const isSelected =
                    selectedDate &&
                    new Date(selectedDate).toDateString() === d.toDateString();

                  return (
                    <tr
                      key={proposal.id}
                      className={`border-b hover:bg-muted/30 ${
                        isSelected ? "bg-green-50" : ""
                      }`}
                    >
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          {isSelected && (
                            <Crown className="h-4 w-4 text-green-600" />
                          )}
                          <div>
                            <div className="font-medium">
                              {d.toLocaleDateString("de-DE", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {d.toLocaleDateString("de-DE", {
                                year: "numeric",
                              })}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* User votes */}
                      {Array.from(allUsers).map(([uid]) => {
                        const vote = proposal.votes.find(
                          (v) => v.user.id === uid
                        );
                        return (
                          <td key={uid} className="text-center p-2">
                            {vote ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${getAvailabilityColor(
                                  vote.availability
                                )}`}
                              >
                                {getAvailabilityIcon(vote.availability)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Guest votes */}
                      {Array.from(allGuests).map(([gid]) => {
                        const vote = proposal.guestVotes.find(
                          (v) => v.guest.id === gid
                        );
                        return (
                          <td key={gid} className="text-center p-2">
                            {vote ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-full border ${getAvailabilityColor(
                                  vote.availability
                                )}`}
                              >
                                {getAvailabilityIcon(vote.availability)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}

                      {/* Counts */}
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center gap-1">
                          <Badge
                            variant="secondary"
                            className="text-xs bg-green-100 text-green-800"
                          >
                            {counts.yes}
                          </Badge>
                          {counts.maybe > 0 && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-yellow-100 text-yellow-800"
                            >
                              {counts.maybe}
                            </Badge>
                          )}
                        </div>
                      </td>

                      {/* User voting buttons */}
                      {userId && !isPast && (
                        <td className="text-center p-2">
                          <div className="flex items-center justify-center gap-1">
                            {votingLoading === proposal.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <button
                                  onClick={() =>
                                    handleVote(proposal.id, "yes")
                                  }
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    myVote === "yes"
                                      ? "border-green-500 bg-green-100"
                                      : "border-gray-300 hover:border-green-400"
                                  }`}
                                  title="Ja, passt"
                                  aria-label="Ja, passt"
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleVote(proposal.id, "maybe")
                                  }
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    myVote === "maybe"
                                      ? "border-yellow-500 bg-yellow-100"
                                      : "border-gray-300 hover:border-yellow-400"
                                  }`}
                                  title="Vielleicht"
                                  aria-label="Vielleicht"
                                >
                                  <HelpCircle className="h-4 w-4 text-yellow-600" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleVote(proposal.id, "no")
                                  }
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${
                                    myVote === "no"
                                      ? "border-red-500 bg-red-100"
                                      : "border-gray-300 hover:border-red-400"
                                  }`}
                                  title="Nein, geht nicht"
                                  aria-label="Nein, geht nicht"
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      )}

                      {/* Select button for creator */}
                      {isCreator && !isPast && (
                        <td className="text-center p-2">
                          {isSelected ? (
                            <Badge className="bg-green-600">Gewählt</Badge>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSelectDate(proposal.id)}
                              disabled={selectingDate === proposal.id}
                            >
                              {selectingDate === proposal.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Crown className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {proposals.length === 0 && !showCreateForm && (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📅</div>
            <h3 className="font-semibold mb-2">Keine Terminvorschläge</h3>
            <p className="text-muted-foreground mb-4">
              {isCreator
                ? "Erstelle Terminvorschläge, damit die Teilnehmer abstimmen können."
                : "Der Organisator hat noch keine Terminvorschläge erstellt."}
            </p>
          </div>
        )}
          </>
        )}

        <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Abstimmung zurücksetzen?</DialogTitle>
              <DialogDescription>
                Dadurch werden alle Terminvorschläge und Stimmen gelöscht. Du kannst im
                Anschluss eine neue Abstimmung starten.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => setShowResetDialog(false)}
                disabled={resetting}
              >
                Abbrechen
              </Button>
              <Button
                variant="destructive"
                onClick={handleResetPoll}
                disabled={resetting}
              >
                {resetting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCcw className="h-4 w-4 mr-2" />
                )}
                Abstimmung zurücksetzen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
