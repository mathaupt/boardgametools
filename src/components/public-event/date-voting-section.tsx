"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { formatEventDate, getDateOnlyKey } from "@/lib/events/event-date";
import {
  collectDateParticipants,
  summarizeDateAvailability,
  type Availability,
  type KnownDateParticipant,
} from "@/lib/events/date-availability";
import { DateProposalItem } from "@/components/event-voting/date-proposal-item";
import type { DateProposal, StoredGuestState } from "./types";

interface DateVotingSectionProps {
  eventId: string;
  token: string;
  currentUserId: string | null;
  activeGuest: StoredGuestState | null;
  knownGuests?: Array<{ id: string; nickname: string }>;
  canVote: boolean;
  blockedReason?: string | null;
  selectedDate: string | null;
  initialDateProposals: DateProposal[];
  onStateConflict?: () => void | Promise<void>;
}

export function DateVotingSection({
  eventId,
  token,
  currentUserId,
  activeGuest,
  knownGuests = [],
  canVote,
  blockedReason,
  selectedDate,
  initialDateProposals,
  onStateConflict,
}: DateVotingSectionProps) {
  const [dateProposals, setDateProposals] = useState<DateProposal[]>(initialDateProposals);
  const [busyProposalIds, setBusyProposalIds] = useState<Set<string>>(new Set());
  const [voteErrors, setVoteErrors] = useState<Record<string, string>>({});
  const requests = useRef(new Map<string, number>());
  const sequence = useRef(0);
  const activeParticipantKey = currentUserId
    ? `user:${currentUserId}`
    : activeGuest
      ? `guest:${activeGuest.id}`
      : null;
  const activeParticipantKeyRef = useRef(activeParticipantKey);

  useEffect(() => {
    activeParticipantKeyRef.current = activeParticipantKey;
  }, [activeParticipantKey]);
  useEffect(() => setDateProposals(initialDateProposals), [initialDateProposals]);

  const participants = useMemo(
    () => collectDateParticipants(dateProposals, knownGuests.map((guest): KnownDateParticipant => ({
      id: guest.id,
      displayName: guest.nickname,
      kind: "guest",
    }))),
    [dateProposals, knownGuests],
  );
  const summaries = useMemo(() => new Map(
    dateProposals.map((proposal) => [
      proposal.id,
      summarizeDateAvailability(proposal, participants, activeParticipantKey),
    ]),
  ), [dateProposals, participants, activeParticipantKey]);
  const selectedKey = selectedDate ? getDateOnlyKey(selectedDate) : null;

  const handleDateVote = useCallback(async (
    dateProposalId: string,
    availability: Availability,
  ) => {
    if (!canVote || !activeParticipantKey || requests.current.has(dateProposalId)) return;
    const summary = summaries.get(dateProposalId);
    if (summary?.myAvailability === availability) return;

    const requestId = ++sequence.current;
    const requestParticipantKey = activeParticipantKey;
    requests.current.set(dateProposalId, requestId);
    setBusyProposalIds((current) => new Set(current).add(dateProposalId));
    setVoteErrors((current) => ({ ...current, [dateProposalId]: "" }));

    try {
      const isUser = requestParticipantKey.startsWith("user:");
      const response = await fetch(
        isUser
          ? `/api/events/${eventId}/date-proposals/vote`
          : `/api/public/event/${token}/date-vote`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(isUser
            ? { dateProposalId, availability }
            : { guestId: activeGuest?.id, votes: [{ dateProposalId, availability }] }),
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        if (response.status === 409) await onStateConflict?.();
        if (response.status === 409) {
          throw new Error("Der Planungsstand hat sich geändert. Deine Änderung wurde nicht gespeichert.");
        }
        throw new Error(data?.error ?? "Bitte versuche es erneut.");
      }

      if (activeParticipantKeyRef.current !== requestParticipantKey) return;
      setDateProposals((current) => current.map((proposal) => {
        if (proposal.id !== dateProposalId) return proposal;
        if (isUser) {
          const userId = requestParticipantKey.slice("user:".length);
          const voteIndex = proposal.votes.findIndex((vote) => vote.user.id === userId);
          if (voteIndex >= 0) {
            const votes = [...proposal.votes];
            votes[voteIndex] = { ...votes[voteIndex], availability };
            return { ...proposal, votes };
          }
          return {
            ...proposal,
            votes: [...proposal.votes, {
              id: `saved-${requestId}`,
              availability,
              user: { id: userId, name: "Du" },
            }],
          };
        }

        const guestId = requestParticipantKey.slice("guest:".length);
        const voteIndex = proposal.guestVotes.findIndex((vote) => vote.guest.id === guestId);
        if (voteIndex >= 0) {
          const guestVotes = [...proposal.guestVotes];
          guestVotes[voteIndex] = { ...guestVotes[voteIndex], availability };
          return { ...proposal, guestVotes };
        }
        return {
          ...proposal,
          guestVotes: [...proposal.guestVotes, {
            id: `saved-${requestId}`,
            availability,
            guest: { id: guestId, nickname: activeGuest?.nickname ?? "Gast" },
          }],
        };
      }));
    } catch (error) {
      if (activeParticipantKeyRef.current === requestParticipantKey) {
        const message = error instanceof Error ? error.message : "Bitte versuche es erneut.";
        setVoteErrors((current) => ({
          ...current,
          [dateProposalId]: `Deine Antwort konnte nicht gespeichert werden: ${message} Wähle eine Antwort erneut, um es noch einmal zu versuchen.`,
        }));
      }
    } finally {
      if (requests.current.get(dateProposalId) === requestId) {
        requests.current.delete(dateProposalId);
        setBusyProposalIds((current) => {
          const next = new Set(current);
          next.delete(dateProposalId);
          return next;
        });
      }
    }
  }, [activeGuest, activeParticipantKey, canVote, eventId, onStateConflict, summaries, token]);

  if (dateProposals.length === 0) return null;

  return (
    <section data-testid="date-voting-section" aria-labelledby="public-date-voting-title">
      <Card className="border-border/60 bg-background/60 max-[320px]:p-2">
        <CardHeader className="max-[320px]:p-2">
          <CardTitle id="public-date-voting-title" className="flex min-w-0 flex-wrap items-center gap-2 text-lg text-foreground" as="h2">
            <Calendar className="h-5 w-5" aria-hidden="true" />
            <span className="[overflow-wrap:anywhere]">Terminabstimmung</span>
          </CardTitle>
          <CardDescription className="[overflow-wrap:anywhere]">
            Stimme ab, welche Termine für dich passen.
            {selectedDate && (
              <span className="mt-2 block font-medium text-foreground">
                Festgelegter Termin: {formatEventDate(selectedDate, "date")}
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="max-[320px]:p-2">
          <ul className="min-w-0 divide-y divide-border/70">
            {dateProposals.map((proposal) => {
              const summary = summaries.get(proposal.id);
              if (!summary) return null;
              const proposalDateKey = getDateOnlyKey(proposal.date);
              const isSelected = selectedKey !== null && proposalDateKey === selectedKey;
              return (
                <DateProposalItem
                  key={proposal.id}
                  proposal={proposal}
                  summary={summary}
                  canVote={canVote}
                  canSelect={false}
                  busy={busyProposalIds.has(proposal.id)}
                  selected={isSelected}
                  activeParticipant={activeParticipantKey !== null}
                  unavailableReason={blockedReason ?? null}
                  error={voteErrors[proposal.id] || null}
                  onVote={(availability) => handleDateVote(proposal.id, availability)}
                  onSelect={() => undefined}
                />
              );
            })}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
