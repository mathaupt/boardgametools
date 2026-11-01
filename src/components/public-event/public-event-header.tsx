"use client";

import { useState } from "react";
import { Calendar, MapPin, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SerializedPublicEvent } from "@/lib/public-event";
import { formatEventDate } from "@/lib/events/event-date";

export function PublicEventHeader({ event }: { event: SerializedPublicEvent }) {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const effectiveDate = event.eventState.effectiveDate
    ? new Date(event.eventState.effectiveDate)
    : new Date(event.eventDate);
  const gameName = event.selectedGame?.name ?? event.winningProposal?.bggName;
  const hasResult = event.status === "closed";

  return (
    <header className="rounded-2xl border border-border bg-card p-6 shadow-lg sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 max-w-3xl">
          <h1 className="[overflow-wrap:anywhere] text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {event.title}
          </h1>
          {event.description && (
            <>
              <p id="public-event-description" className={`mt-3 max-w-[70ch] text-base leading-7 text-muted-foreground [overflow-wrap:anywhere] ${descriptionExpanded ? "" : "line-clamp-3"}`}>
                {event.description}
              </p>
              {event.description.length > 220 && <button
                type="button"
                className="mt-1 inline-flex min-h-11 items-center font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={descriptionExpanded}
                aria-controls="public-event-description"
                onClick={() => setDescriptionExpanded((expanded) => !expanded)}
              >
                {descriptionExpanded ? "Beschreibung verbergen" : "Beschreibung anzeigen"}
              </button>}
            </>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2 lg:max-w-sm lg:justify-end">
          <Badge variant={event.eventState.phase === "open" || event.eventState.phase === "planning" ? "default" : "secondary"}>
            {event.eventState.label}
          </Badge>
          {event.eventState.phase === "past" && <Badge variant="outline">Termin vergangen</Badge>}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-5 text-sm text-muted-foreground">
        <div className="flex min-h-11 items-center gap-2 rounded-xl bg-muted px-3 py-2">
          <Calendar className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            {formatEventDate(effectiveDate, event.eventState.dateKind)}
            {event.eventState.dateKind === "date" && (
              <span className="ml-2 text-xs">Uhrzeit noch offen</span>
            )}
            {event.eventState.dateKind === "provisional" && (
              <span className="ml-2 text-xs">Vorläufig</span>
            )}
          </span>
        </div>
        {event.location && (
          <div className="flex min-h-11 items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{event.location}</span>
          </div>
        )}
        {gameName ? (
          <div className="flex min-h-11 items-center gap-2 rounded-xl bg-muted px-3 py-2">
            <Trophy className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{hasResult ? "Ausgewähltes Spiel:" : "Festgelegt:"} {gameName}</span>
          </div>
        ) : hasResult ? (
          <p className="flex min-h-11 items-center rounded-xl bg-muted px-3 py-2" role="status">
            Abstimmung geschlossen; kein Spiel festgelegt.
          </p>
        ) : null}
      </div>
    </header>
  );
}
