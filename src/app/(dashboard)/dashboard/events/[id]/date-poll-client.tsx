"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DateProposal } from "./date-poll-types";
import { DateCreateForm } from "./date-poll-create-form";
import { DateVotingMatrix } from "./date-poll-voting-matrix";
import { PollClosedBanner, ResetPollDialog } from "./date-poll-reset-dialog";

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
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);

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
    setShowDeleteAllDialog(false);

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
                <span className="ml-2 text-success font-medium">
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
                  onClick={() => setShowDeleteAllDialog(true)}
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
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm border border-destructive/50">
            {error}
          </div>
        )}

        {pollClosed && finalDate && (
          <PollClosedBanner
            finalDate={finalDate}
            isCreator={isCreator}
            isPast={isPast}
            resetting={resetting}
            onResetClick={() => setShowResetDialog(true)}
          />
        )}

        {!pollClosed && (
          <>
            {/* Create Form */}
            {showCreateForm && (
              <DateCreateForm
                startDate={startDate}
                endDate={endDate}
                selectedWeekdays={selectedWeekdays}
                loading={loading}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                onToggleWeekday={toggleWeekday}
                onSubmit={handleCreateProposals}
              />
            )}

            {/* Voting Matrix */}
            {proposals.length > 0 && (
              <DateVotingMatrix
                proposals={proposals}
                allUsers={allUsers}
                allGuests={allGuests}
                userId={userId}
                isPast={isPast}
                selectedDate={selectedDate}
                votingLoading={votingLoading}
                selectingDate={selectingDate}
                isCreator={isCreator}
                onVote={handleVote}
                onSelectDate={handleSelectDate}
                getUserVote={getUserVote}
              />
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

        <ResetPollDialog
          open={showResetDialog}
          onOpenChange={setShowResetDialog}
          resetting={resetting}
          onReset={handleResetPoll}
        />

        <AlertDialog open={showDeleteAllDialog} onOpenChange={setShowDeleteAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Alle Terminvorschläge löschen</AlertDialogTitle>
              <AlertDialogDescription>
                Alle Terminvorschläge und Abstimmungen werden gelöscht. Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAllProposals}>Löschen</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
