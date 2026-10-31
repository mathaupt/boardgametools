"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { evaluateEventState } from "@/lib/events/event-state";
import type { SerializedPublicEvent } from "@/lib/public-event";
import type { DateProposal, Proposal } from "./types";

export function usePublicEventLifecycle(token: string, event: SerializedPublicEvent) {
  const router = useRouter();
  const [eventState, setEventState] = useState(event.eventState);
  const [proposals, setProposals] = useState<Proposal[]>(event.proposals);
  const [dateProposals, setDateProposals] = useState<DateProposal[]>(event.dateProposals);

  const refreshEventState = useCallback(async () => {
    router.refresh();
    try {
      const response = await fetch(`/api/public/event/${token}`);
      if (!response.ok) return;
      const latest = await response.json() as SerializedPublicEvent;
      setEventState(latest.eventState);
      setProposals(latest.proposals);
      setDateProposals(latest.dateProposals);
    } catch {
      // The server still enforces the lifecycle if the refresh request fails.
    }
  }, [router, token]);

  useEffect(() => {
    setEventState(event.eventState);
    setProposals(event.proposals);
    setDateProposals(event.dateProposals);
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

  return { eventState, setEventState, proposals, setProposals, dateProposals, setDateProposals, refreshEventState };
}
