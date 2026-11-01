import { describe, expect, it } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PublicEventHeader } from "@/components/public-event/public-event-header";
import { serializePublicEvent } from "@/lib/public-event";

const event = (overrides: Record<string, unknown> = {}) => serializePublicEvent({
  id: "event-1",
  title: "Spieleabend",
  description: null,
  eventDate: new Date("2026-11-10T18:00:00.000Z"),
  location: "Berlin",
  status: "closed",
  shareToken: "token",
  isPublic: true,
  selectedDate: new Date("2026-11-01T00:00:00.000Z"),
  createdBy: { id: "owner", name: "Alex" },
  invites: [],
  selectedGame: null,
  winningProposal: { id: "winner", bggId: "13", bggName: "Catan", bggImageUrl: null, bggMinPlayers: 3, bggMaxPlayers: 4, bggPlayTimeMinutes: 60, gameId: null },
  proposals: [],
  guestParticipants: [],
  dateProposals: [],
  ...overrides,
} as never, null, new Date("2026-10-31T12:00:00.000Z"));

describe("PublicEventHeader", () => {
  it("shows closed state, selected date and stored BGG-only winner", () => {
    render(<PublicEventHeader event={event()} />);

    expect(screen.getByText("Abstimmung geschlossen")).toBeTruthy();
    expect(screen.getByText(/1\. November 2026/)).toBeTruthy();
    expect(screen.getByText(/Uhrzeit noch offen/)).toBeTruthy();
    expect(screen.getByText(/Ausgewähltes Spiel: Catan/)).toBeTruthy();
  });

  it("does not invent a game result when a closed event has no selected game", () => {
    render(<PublicEventHeader event={event({ winningProposal: null })} />);

    expect(screen.getByText("Abstimmung geschlossen; kein Spiel festgelegt.")).toBeTruthy();
  });

  it("keeps long descriptions collapsed until requested", () => {
    render(<PublicEventHeader event={event({ description: "Eine ausführliche Beschreibung. ".repeat(20) })} />);
    const description = screen.getByText(/Eine ausführliche Beschreibung/);
    expect(description).toHaveClass("line-clamp-3");
    const toggle = screen.getByRole("button", { name: "Beschreibung anzeigen" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "Beschreibung verbergen" })).toHaveAttribute("aria-expanded", "true");
  });
});
