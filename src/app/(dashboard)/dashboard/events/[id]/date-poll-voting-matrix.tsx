"use client";

import { getDateOnlyKey, formatEventDate } from "@/lib/events/event-date";
import {
  collectDateParticipants,
  summarizeDateAvailability,
  type DateAvailabilityProposal,
  type DateAvailabilityParticipant,
  type KnownDateParticipant,
} from "@/lib/events/date-availability";

const answerText = (participant: DateAvailabilityParticipant | undefined) => {
  if (!participant || participant.state === "unanswered") return "Noch nicht beantwortet";
  if (participant.state === "unknown") return "Antwort unbekannt";
  return { yes: "Ja", maybe: "Vielleicht", no: "Nein" }[participant.answer ?? "no"];
};

export function DateVotingMatrix({
  proposals,
  selectedDate = null,
  knownParticipants = [],
}: {
  proposals: DateAvailabilityProposal[];
  selectedDate?: string | null;
  knownParticipants?: KnownDateParticipant[];
}) {
  const participants = collectDateParticipants(proposals, knownParticipants);
  const selectedKey = selectedDate ? getDateOnlyKey(selectedDate) : null;

  return (
    <div className="min-w-0 overflow-x-auto rounded-md border border-border">
      <table className="w-full border-collapse text-sm">
        <caption className="sr-only">Teilnehmerantworten nach Termin</caption>
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th scope="col" className="min-w-44 p-3 text-left font-semibold text-foreground">Termin</th>
            {participants.map((participant) => (
              <th key={participant.key} scope="col" className="min-w-32 p-3 text-left font-semibold text-foreground">
                {participant.displayName}{participant.kind === "guest" ? " (Gast)" : ""}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proposals.map((proposal) => {
            const summary = summarizeDateAvailability(proposal, participants, null);
            const answers = new Map(summary.participants.map((participant) => [participant.key, participant]));
            const dateKey = getDateOnlyKey(proposal.date);
            const selected = selectedKey !== null && dateKey === selectedKey;
            return (
              <tr key={proposal.id} className="border-b border-border last:border-b-0">
                <th scope="row" className="p-3 text-left font-medium text-foreground">
                  {formatEventDate(proposal.date, "date")}
                  {selected && <span className="mt-1 block text-xs font-semibold text-foreground">Festgelegter Termin</span>}
                </th>
                {participants.map((participant) => (
                  <td key={participant.key} className="p-3 text-foreground">
                    {answerText(answers.get(participant.key))}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
