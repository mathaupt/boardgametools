import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
vi.mock("next/link", () => ({ default: ({ href, children, ...props }: any) => <a href={href} {...props}>{children}</a> }));
vi.mock("next/image", () => ({ default: (props: any) => <img {...props} /> }));
vi.mock("@/components/dashboard/event-preview", () => ({ EventDate: () => <span>Eventdatum</span> }));
vi.mock("@/components/pending-invites", () => ({ PendingInvites: ({ invites }: any) => <div>{invites.length} offene Einladungen</div> }));
import { EventsOverview } from "@/components/dashboard/events-overview";
const event = (overrides: any = {}) => ({ id: "e1", title: "Spieleabend", description: null, eventDate: "2026-11-10T18:00:00.000Z", location: null, selectedGame: null, winningProposal: null, _count: { invites: 2, proposals: 4 }, proposals: [], ...overrides });

describe("EventsOverview", () => {
  it("zeigt den Erstellungszustand und die Zahl offener Einladungen", () => {
    render(<EventsOverview events={[]} invites={[{} as never]} />);
    expect(screen.getByRole("heading", { name: "Noch keine Events" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Erstes Event erstellen/ })).toHaveAttribute("href", "/dashboard/events/new");
    expect(screen.getByText("1 offene Einladungen")).toBeInTheDocument();
  });

  it("zeigt Eventdetails, Gewinner und höchstens drei Vorschläge mit Bild- oder Fallbackdarstellung", () => {
    render(<EventsOverview events={[event({
      description: "Bring ein Spiel mit", location: "Vereinsraum", selectedGame: { name: "Catan" },
      winningProposal: { bggName: "Fallback" },
      proposals: [
        { id: "p1", bggName: null, bggImageUrl: null, game: { name: "Azul", imageUrl: "https://img.test/azul.jpg" }, _count: { votes: 5 } },
        { id: "p2", bggName: "Carcassonne", bggImageUrl: null, game: null, _count: { votes: 3 } },
        { id: "p3", bggName: null, bggImageUrl: null, game: null, _count: { votes: 2 } },
        { id: "p4", bggName: "Skipped", bggImageUrl: null, game: null, _count: { votes: 0 } },
      ],
    })]} invites={[]} />);
    expect(screen.getByRole("heading", { name: "Spieleabend" })).toBeInTheDocument();
    expect(screen.getByText("Vereinsraum")).toBeInTheDocument();
    expect(screen.getByText("Bring ein Spiel mit")).toBeInTheDocument();
    expect(screen.getByText("Catan")).toBeInTheDocument();
    expect(screen.getByAltText("Azul")).toHaveAttribute("src", "https://img.test/azul.jpg");
    expect(screen.getByText("Carcassonne")).toBeInTheDocument();
    expect(screen.getByText("Unbekannt")).toBeInTheDocument();
    expect(screen.getByText("+1 weitere")).toBeInTheDocument();
    expect(screen.queryByText("Skipped")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voting" })).toHaveAttribute("href", "/dashboard/events/e1/voting");
  });
});
