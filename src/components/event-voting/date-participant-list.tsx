import type { DateAvailabilityParticipant } from "@/lib/events/date-availability";

const ANSWER_LABELS = {
  yes: "Ja",
  maybe: "Vielleicht",
  no: "Nein",
} as const;

function getAnswerLabel(participant: DateAvailabilityParticipant): string {
  if (participant.state === "unanswered") return "Noch nicht beantwortet";
  if (participant.state === "unknown") return "Antwort unbekannt";
  return ANSWER_LABELS[participant.answer ?? "no"];
}

export function DateParticipantList({
  participants,
}: {
  participants: DateAvailabilityParticipant[];
}) {
  if (participants.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Antworten.</p>;
  }

  return (
    <details className="group min-w-0">
      <summary className="flex min-h-11 min-w-0 flex-wrap cursor-pointer list-none items-center rounded-md px-2 text-sm font-medium text-foreground [overflow-wrap:anywhere] underline-offset-4 hover:bg-muted hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        Teilnehmerantworten ({participants.length})
      </summary>
      <ul className="mt-2 grid min-w-0 gap-2 sm:grid-cols-2">
        {participants.map((participant) => (
          <li
            key={participant.key}
            className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-muted/50 px-3 py-2 text-sm"
          >
            <span className="min-w-0 truncate text-foreground">
              {participant.displayName}
              {participant.kind === "guest" && (
                <span className="text-muted-foreground"> (Gast)</span>
              )}
            </span>
            <span className="min-w-0 break-words text-right font-medium text-foreground">
              {getAnswerLabel(participant)}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
