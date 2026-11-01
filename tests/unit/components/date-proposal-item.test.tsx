import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { collectDateParticipants, summarizeDateAvailability } from "@/lib/events/date-availability";
import { DateProposalItem } from "@/components/event-voting/date-proposal-item";

const proposal = {
  id: "date-1",
  date: "2026-11-06T00:00:00.000Z",
  votes: [{ id: "vote-1", availability: "yes", user: { id: "user-1", name: "Ada Lovelace" } }],
  guestVotes: [{ id: "guest-vote-1", availability: "unknown-value", guest: { id: "guest-1", nickname: "Kai" } }],
};

function renderItem(overrides: Partial<Parameters<typeof DateProposalItem>[0]> = {}) {
  const participants = collectDateParticipants([proposal]);
  return render(
    <DateProposalItem
      proposal={proposal}
      summary={summarizeDateAvailability(proposal, participants, "user:user-1")}
      canVote={true}
      canSelect={false}
      busy={false}
      selected={false}
      activeParticipant={true}
      unavailableReason={null}
      onVote={vi.fn()}
      onSelect={vi.fn()}
      {...overrides}
    />,
  );
}

describe("DateProposalItem", () => {
  it("shows full date, named counts, saved answer, and participant response text", async () => {
    const user = userEvent.setup();
    renderItem();

    expect(screen.getByRole("heading", { name: /Freitag, 6\. November 2026/i })).toBeInTheDocument();
    expect(screen.getByText("Ja:").parentElement).toHaveTextContent("Ja: 1");
    expect(screen.getByText("Vielleicht:").parentElement).toHaveTextContent("Vielleicht: 0");
    expect(screen.getByText("Nein:").parentElement).toHaveTextContent("Nein: 0");
    expect(screen.getByText("Noch nicht beantwortet:").parentElement).toHaveTextContent("Noch nicht beantwortet: 0");
    expect(screen.getByText("Deine Antwort: Ja")).toBeInTheDocument();
    const participantDetails = screen.getByText("Teilnehmerantworten (2)").closest("details");
    expect(participantDetails).not.toBeNull();
    await user.click(within(participantDetails as HTMLElement).getByText("Teilnehmerantworten (2)"));
    expect(within(participantDetails as HTMLElement).getByText("Antwort unbekannt")).toBeInTheDocument();
  });

  it("shows the chosen date and a readable reason when voting is unavailable", () => {
    renderItem({
      canVote: false,
      selected: true,
      unavailableReason: "Die Abstimmung ist geschlossen.",
    });

    expect(screen.getByText("Festgelegter Termin")).toBeInTheDocument();
    expect(screen.getByText("Die Abstimmung ist geschlossen.")).toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Freitag/ })).not.toBeInTheDocument();
  });

  it("exposes creator selection with a date-specific accessible name", () => {
    renderItem({ canSelect: true });

    expect(screen.getByRole("button", { name: "Freitag, 6. November 2026 als Termin festlegen" })).toBeInTheDocument();
  });
});
