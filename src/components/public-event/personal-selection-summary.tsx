import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatEventDate } from "@/lib/events/event-date";
import type { PublicActor } from "@/lib/events/public-actor";
import type { SerializedPublicEvent } from "@/lib/public-event";

type Proposal = SerializedPublicEvent["proposals"][number];
type DateProposal = SerializedPublicEvent["dateProposals"][number];

function availabilityText(value: string) {
  if (value === "yes") return "Ja";
  if (value === "maybe") return "Vielleicht";
  return "Nein";
}

export function PersonalSelectionSummary({ actor, proposals, dateProposals, guestVotes }: {
  actor: PublicActor;
  proposals: Proposal[];
  dateProposals: DateProposal[];
  guestVotes: Set<string>;
}) {
  const selectedGames = actor.kind === "user"
    ? proposals.filter((proposal) => proposal.userHasVoted)
    : actor.kind === "guest"
      ? proposals.filter((proposal) => guestVotes.has(proposal.id))
      : [];
  const selectedDates = actor.kind === "user"
    ? dateProposals.flatMap((proposal) => {
        const vote = proposal.votes.find((item) => item.user.id === actor.userId);
        return vote ? [{ proposal, availability: vote.availability }] : [];
      })
    : actor.kind === "guest"
      ? dateProposals.flatMap((proposal) => {
          const vote = proposal.guestVotes.find((item) => item.guest.id === actor.guestId);
          return vote ? [{ proposal, availability: vote.availability }] : [];
        })
      : [];

  return (
    <section aria-labelledby="personal-selection-title">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle id="personal-selection-title" className="text-base" as="h2">Deine Auswahl</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {actor.kind === "loading" ? (
            <p className="text-muted-foreground" role="status">Deine Auswahl wird geladen …</p>
          ) : actor.kind === "observer" ? (
            <p className="text-muted-foreground">Melde dich an oder nimm als Gast teil, damit deine Auswahl hier erscheint. <a className="font-medium text-primary underline underline-offset-4" href="#event-participation">Teilnahme starten</a></p>
          ) : selectedGames.length === 0 && selectedDates.length === 0 ? (
            <p className="text-muted-foreground">Noch keine Auswahl gespeichert. <a className="font-medium text-primary underline underline-offset-4" href="#event-games">Spiele wählen</a>{dateProposals.length > 0 && <> oder <a className="font-medium text-primary underline underline-offset-4" href="#event-dates">Termine beantworten</a></>}.</p>
          ) : (
            <>
              {selectedGames.length > 0 && <div>
                <p className="font-medium">Spielstimmen</p>
                <ul className="mt-1 list-inside list-disc [overflow-wrap:anywhere]">{selectedGames.map((proposal) => <li key={proposal.id}>{proposal.game.name}</li>)}</ul>
                <a className="mt-1 inline-block min-h-11 py-3 font-medium text-primary underline underline-offset-4" href="#event-games">Spielauswahl bearbeiten</a>
              </div>}
              {selectedDates.length > 0 && <div>
                <p className="font-medium">Terminantworten</p>
                <ul className="mt-1 list-inside list-disc [overflow-wrap:anywhere]">{selectedDates.map(({ proposal, availability }) => <li key={proposal.id}>{formatEventDate(proposal.date, "date")} – {availabilityText(availability)}</li>)}</ul>
                <a className="mt-1 inline-block min-h-11 py-3 font-medium text-primary underline underline-offset-4" href="#event-dates">Terminantworten bearbeiten</a>
              </div>}
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
