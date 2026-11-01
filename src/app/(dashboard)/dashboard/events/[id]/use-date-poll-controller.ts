"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Availability } from "@/lib/events/date-availability";
import type { DateProposal } from "./date-poll-types";

export interface DatePollControllerOptions {
  eventId: string;
  userId: string | null;
  isCreator: boolean;
  canVoteDate: boolean;
  canManageDates: boolean;
  canSelectDate: boolean;
  canResetDates: boolean;
  initialProposals: DateProposal[];
  selectedDate: string | null;
}

export function useDatePollController(options: DatePollControllerOptions) {
  const router = useRouter();
  const { eventId, userId, isCreator, canVoteDate, canManageDates, canSelectDate, canResetDates } = options;
  const [proposals, setProposals] = useState(options.initialProposals);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [pollClosed, setPollClosed] = useState(Boolean(options.selectedDate));
  const [finalDate, setFinalDate] = useState<string | null>(options.selectedDate);
  const [resetting, setResetting] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [showDeleteAllDialog, setShowDeleteAllDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([]);
  const [busyProposalIds, setBusyProposalIds] = useState<Set<string>>(new Set());
  const [selectingDateId, setSelectingDateId] = useState<string | null>(null);
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({});
  const activeUserId = useRef(userId);
  const requests = useRef(new Map<string, number>());
  const sequence = useRef(0);

  useEffect(() => {
    activeUserId.current = userId;
  }, [userId]);
  useEffect(() => setProposals(options.initialProposals), [options.initialProposals]);
  useEffect(() => {
    setPollClosed(Boolean(options.selectedDate));
    setFinalDate(options.selectedDate);
  }, [options.selectedDate]);

  const reportStateConflict = useCallback(() => {
    setError("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
    router.refresh();
  }, [router]);

  const refreshProposals = useCallback(async () => {
    const response = await fetch(`/api/events/${eventId}/date-proposals`);
    if (response.ok) setProposals(await response.json());
  }, [eventId]);

  const createProposals = useCallback(async () => {
    if (!canManageDates || pollClosed) return;
    if (!startDate || !endDate) {
      setError("Bitte Start- und Enddatum angeben.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/date-proposals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startDate, endDate, ...(selectedWeekdays.length ? { weekdays: selectedWeekdays } : {}) }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409) reportStateConflict();
        else setError(data?.error ?? "Terminvorschläge konnten nicht erstellt werden.");
        return;
      }
      setProposals(data);
      setShowCreateForm(false);
      setStartDate("");
      setEndDate("");
      setSelectedWeekdays([]);
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [canManageDates, endDate, eventId, pollClosed, reportStateConflict, selectedWeekdays, startDate]);

  const deleteAllProposals = useCallback(async () => {
    if (!canManageDates || pollClosed) return;
    setShowDeleteAllDialog(false);
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/date-proposals`, { method: "DELETE" });
      if (response.ok) setProposals([]);
      else if (response.status === 409) reportStateConflict();
      else setError("Terminvorschläge konnten nicht gelöscht werden.");
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }, [canManageDates, eventId, pollClosed, reportStateConflict]);

  const vote = useCallback(async (dateProposalId: string, availability: Availability) => {
    if (!canVoteDate || pollClosed || !userId || requests.current.has(dateProposalId)) return;
    const sequenceId = ++sequence.current;
    const actorId = userId;
    requests.current.set(dateProposalId, sequenceId);
    setBusyProposalIds((current) => new Set(current).add(dateProposalId));
    setVoteErrors((current) => ({ ...current, [dateProposalId]: "" }));
    try {
      const response = await fetch(`/api/events/${eventId}/date-proposals/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateProposalId, availability }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) reportStateConflict();
        throw new Error(response.status === 409
          ? "Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert."
          : data?.error ?? "Bitte versuche es erneut.");
      }
      if (activeUserId.current !== actorId) return;
      setProposals((current) => current.map((proposal) => {
        if (proposal.id !== dateProposalId) return proposal;
        const index = proposal.votes.findIndex((entry) => entry.user.id === actorId);
        if (index < 0) {
          return { ...proposal, votes: [...proposal.votes, {
            id: `saved-${sequenceId}`,
            availability,
            user: { id: actorId, name: "Du", email: "" },
          }] };
        }
        const votes = [...proposal.votes];
        votes[index] = { ...votes[index], availability };
        return { ...proposal, votes };
      }));
    } catch (voteError) {
      if (activeUserId.current === actorId) {
        const message = voteError instanceof Error ? voteError.message : "Bitte versuche es erneut.";
        setVoteErrors((current) => ({
          ...current,
          [dateProposalId]: `Deine Antwort konnte nicht gespeichert werden: ${message} Wähle eine Antwort erneut, um es noch einmal zu versuchen.`,
        }));
      }
    } finally {
      if (requests.current.get(dateProposalId) === sequenceId) {
        requests.current.delete(dateProposalId);
        setBusyProposalIds((current) => {
          const next = new Set(current);
          next.delete(dateProposalId);
          return next;
        });
      }
    }
  }, [canVoteDate, eventId, pollClosed, reportStateConflict, userId]);

  const selectDate = useCallback(async (dateProposalId: string) => {
    if (!isCreator || !canSelectDate || pollClosed) return;
    setSelectingDateId(dateProposalId);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/date-proposals/select`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateProposalId }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409) reportStateConflict();
        else setError(data?.error ?? "Der Termin konnte nicht festgelegt werden.");
        return;
      }
      if (data?.selectedDate) {
        setFinalDate(data.selectedDate);
        setPollClosed(true);
      }
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setSelectingDateId(null);
    }
  }, [canSelectDate, eventId, isCreator, pollClosed, reportStateConflict, router]);

  const resetPoll = useCallback(async () => {
    if (!isCreator || !canResetDates) return;
    setResetting(true);
    setError(null);
    try {
      const response = await fetch(`/api/events/${eventId}/date-proposals/reset`, { method: "POST" });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) reportStateConflict();
        else setError(data?.error ?? "Die Terminabstimmung konnte nicht zurückgesetzt werden.");
        return;
      }
      setPollClosed(false);
      setFinalDate(null);
      setProposals([]);
      setShowCreateForm(false);
      await refreshProposals();
      router.refresh();
    } catch {
      setError("Netzwerkfehler. Bitte versuche es erneut.");
    } finally {
      setResetting(false);
      setShowResetDialog(false);
    }
  }, [canResetDates, eventId, isCreator, refreshProposals, reportStateConflict, router]);

  const toggleWeekday = useCallback((day: number) => {
    setSelectedWeekdays((current) => current.includes(day)
      ? current.filter((value) => value !== day)
      : [...current, day]);
  }, []);

  return {
    proposals, loading, error, setError, showCreateForm, setShowCreateForm,
    pollClosed, finalDate, resetting, showResetDialog, setShowResetDialog,
    showDeleteAllDialog, setShowDeleteAllDialog, startDate, setStartDate,
    endDate, setEndDate, selectedWeekdays, toggleWeekday, busyProposalIds,
    selectingDateId, voteErrors, createProposals, deleteAllProposals, vote,
    selectDate, resetPoll,
  };
}
