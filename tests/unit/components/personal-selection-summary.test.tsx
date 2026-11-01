import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { PersonalSelectionSummary } from "@/components/public-event/personal-selection-summary";

const proposal = { id: "p1", createdAt: null, game: { id: "g1", name: "Catan", imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 60 }, proposedBy: null, totalVotes: 1, voteCounts: { registered: 1, guests: 0 }, userHasVoted: true };
const dateProposal = { id: "d1", date: "2026-12-01T18:00:00.000Z", votes: [{ id: "v1", availability: "yes", user: { id: "u1", name: "Anna" } }], guestVotes: [] };

describe("PersonalSelectionSummary", () => {
  it("summarizes only the active account's choices with edit links", () => {
    render(<PersonalSelectionSummary
      actor={{ kind: "user", userId: "u1", displayName: "Anna" }}
      proposals={[proposal]}
      dateProposals={[dateProposal]}
      guestVotes={new Set()}
    />);
    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.getAllByRole("list")[1]).toHaveTextContent("Ja");
    expect(screen.getByRole("link", { name: "Spielauswahl bearbeiten" })).toHaveAttribute("href", "#event-games");
    expect(screen.getByRole("link", { name: "Terminantworten bearbeiten" })).toHaveAttribute("href", "#event-dates");
  });

  it("does not show user choices for a guest and offers a participation link if there are none", () => {
    render(<PersonalSelectionSummary
      actor={{ kind: "guest", guestId: "g1", nickname: "Mia" }}
      proposals={[proposal]}
      dateProposals={[dateProposal]}
      guestVotes={new Set()}
    />);
    expect(screen.getByText(/Noch keine Auswahl gespeichert/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spiele wählen" })).toHaveAttribute("href", "#event-games");
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
  });
});
