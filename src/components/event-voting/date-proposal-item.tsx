"use client";

import { Button } from "@/components/ui/button";
import { DateAvailabilityGroup } from "@/components/event-voting/date-availability-group";
import { DateParticipantList } from "@/components/event-voting/date-participant-list";
import type {
  Availability,
  DateAvailabilityProposal,
  DateAvailabilitySummary,
} from "@/lib/events/date-availability";
import { Crown, LoaderCircle } from "lucide-react";

function formatDateLabel(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Datum nicht verfügbar";
  return new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export interface DateProposalItemProps {
  proposal: DateAvailabilityProposal;
  summary: DateAvailabilitySummary;
  canVote: boolean;
  canSelect: boolean;
  busy: boolean;
  selecting?: boolean;
  selected: boolean;
  activeParticipant: boolean;
  unavailableReason: string | null;
  error?: string | null;
  onVote: (value: Availability) => void;
  onSelect: () => void;
}

export function DateProposalItem({
  proposal,
  summary,
  canVote,
  canSelect,
  busy,
  selecting = false,
  selected,
  activeParticipant,
  unavailableReason,
  error,
  onVote,
  onSelect,
}: DateProposalItemProps) {
  const dateLabel = formatDateLabel(proposal.date);
  const myAnswer = summary.myAnswerUnknown
    ? "Antwort unbekannt"
    : summary.myAvailability
      ? { yes: "Ja", maybe: "Vielleicht", no: "Nein" }[summary.myAvailability]
      : "Noch nicht beantwortet";

  return (
    <li data-testid={`date-row-${proposal.id}`} className="min-w-0 border-b border-border/70 py-5 last:border-b-0">
      <article className="min-w-0 space-y-4">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="[overflow-wrap:anywhere] text-base font-semibold text-foreground">{dateLabel}</h3>
            {selected && (
              <p className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-success/10 px-2 py-1 text-sm font-semibold text-foreground">
                <Crown className="h-4 w-4" aria-hidden="true" />
                Festgelegter Termin
              </p>
            )}
          </div>
          {canSelect && (
            <Button
              type="button"
              variant={selected ? "secondary" : "outline"}
              className="min-h-11 whitespace-normal"
              onClick={onSelect}
              disabled={selecting}
              aria-label={`${dateLabel} als Termin festlegen`}
            >
              {selecting ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Crown className="h-4 w-4" aria-hidden="true" />}
              {selecting ? "Wird festgelegt …" : "Termin festlegen"}
            </Button>
          )}
        </div>

        <dl className="grid min-w-0 grid-cols-1 gap-x-4 gap-y-2 text-sm min-[375px]:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0"><dt className="sr-only">Ja</dt><dd className="[overflow-wrap:anywhere]"><span className="font-semibold">Ja:</span> {summary.counts.yes}</dd></div>
          <div className="min-w-0"><dt className="sr-only">Vielleicht</dt><dd className="[overflow-wrap:anywhere]"><span className="font-semibold">Vielleicht:</span> {summary.counts.maybe}</dd></div>
          <div className="min-w-0"><dt className="sr-only">Nein</dt><dd className="[overflow-wrap:anywhere]"><span className="font-semibold">Nein:</span> {summary.counts.no}</dd></div>
          <div className="min-w-0"><dt className="sr-only">Noch nicht beantwortet</dt><dd className="[overflow-wrap:anywhere]"><span className="font-semibold">Noch nicht beantwortet:</span> {summary.counts.unanswered}</dd></div>
          {summary.counts.unknown > 0 && (
            <div className="min-w-0"><dt className="sr-only">Antwort unbekannt</dt><dd className="[overflow-wrap:anywhere]"><span className="font-semibold">Unbekannt:</span> {summary.counts.unknown}</dd></div>
          )}
        </dl>

        {activeParticipant && canVote ? (
          <div className="space-y-2">
            <p className="[overflow-wrap:anywhere] text-sm font-medium text-foreground">Deine Antwort: {myAnswer}</p>
            <DateAvailabilityGroup
              idPrefix="date-availability"
              dateProposalId={proposal.id}
              dateLabel={dateLabel}
              value={summary.myAvailability}
              disabled={false}
              busy={busy}
              onChange={onVote}
            />
            <p className="min-h-5 text-sm text-muted-foreground" role="status" aria-live="polite">
              {busy ? "Antwort wird gespeichert …" : ""}
            </p>
            {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground" role="status">
            {unavailableReason ?? (activeParticipant ? "Für diesen Termin ist keine Antwort mehr möglich." : "Melde dich an oder tritt als Gast bei, um zu antworten.")}
          </p>
        )}

        <DateParticipantList participants={summary.participants} />
      </article>
    </li>
  );
}
