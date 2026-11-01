"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateEventState } from "@/lib/events/event-state";
import type { SerializedPublicEvent } from "@/lib/public-event";
import type { DateProposal, Proposal } from "./types";

export function usePublicEventLifecycle(token: string, event: SerializedPublicEvent) {
  const router = useRouter();
  const [eventState, setEventState] = useState(event.eventState);
  const [proposals, setProposals] = useState<Proposal[]>(event.proposals);
  const [dateProposals, setDateProposals] = useState<DateProposal[]>(event.dateProposals);
  const [guestParticipants, setGuestParticipants] = useState(event.guestParticipants);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const refreshSequence = useRef(0);

  const refreshEventState = useCallback(async () => {
    router.refresh();
    const sequence = ++refreshSequence.current;
    setRefreshError(null);
    try {
      const response = await fetch(`/api/public/event/${token}`);
      if (!response.ok) {
        if (sequence === refreshSequence.current) setRefreshError("Die Teilnehmendenliste konnte noch nicht aktualisiert werden.");
        return;
      }
      const latest = await response.json() as SerializedPublicEvent;
      if (sequence !== refreshSequence.current) return;
      setEventState(latest.eventState);
      setProposals(latest.proposals);
      setDateProposals(latest.dateProposals);
      setGuestParticipants(latest.guestParticipants);
    } catch {
      if (sequence === refreshSequence.current) setRefreshError("Die Teilnehmendenliste konnte noch nicht aktualisiert werden.");
    }
  }, [router, token]);

  useEffect(() => {
    setEventState(event.eventState);
    setProposals(event.proposals);
    setDateProposals(event.dateProposals);
    setGuestParticipants(event.guestParticipants);
  }, [event]);

  useEffect(() => {
    const refreshAtCurrentTime = () => setEventState(evaluateEventState({
      status: event.status,
      eventDate: event.eventDate,
      selectedDate: event.selectedDate,
      selectedGameId: event.selectedGame?.id ?? null,
      winningProposalId: event.winningProposal?.id ?? null,
      deletedAt: null,
    }, new Date()));
    const interval = window.setInterval(refreshAtCurrentTime, 15_000);
    window.addEventListener("focus", refreshAtCurrentTime);
    document.addEventListener("visibilitychange", refreshAtCurrentTime);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshAtCurrentTime);
      document.removeEventListener("visibilitychange", refreshAtCurrentTime);
    };
  }, [event]);

  return { eventState, setEventState, proposals, setProposals, dateProposals, setDateProposals, guestParticipants, setGuestParticipants, refreshError, refreshEventState };
}
