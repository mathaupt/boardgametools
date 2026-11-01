import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ParticipantsSection } from "@/components/public-event/participants-section";
import { PublicEventSectionLinks } from "@/components/public-event/public-event-section-links";

describe("public event participation layout", () => {
  it("shows invited people and guests in one participant list", () => {
    render(<ParticipantsSection
      invites={[{ name: "Kim", status: "accepted" }]}
      guests={[{ id: "g1", nickname: "Alex", createdAt: "2026-11-01T10:00:00.000Z", votesCount: 3 }]}
      activeGuestId="g1"
    />);
    expect(screen.getByRole("heading", { name: "Teilnehmende (2)" })).toBeInTheDocument();
    expect(screen.getByText("Kim")).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText(/3 Stimmen/)).toBeInTheDocument();
  });

  it("links only to sections that exist", () => {
    render(<PublicEventSectionLinks hasGames hasDates={false} />);
    expect(screen.getByRole("link", { name: "Spiele wählen" })).toHaveAttribute("href", "#event-games");
    expect(screen.queryByRole("link", { name: "Termine beantworten" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Teilnehmende" })).toHaveAttribute("href", "#event-participants");
  });
});
