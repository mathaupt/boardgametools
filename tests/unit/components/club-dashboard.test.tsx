import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";

afterEach(cleanup);
const base = { name: "Alex", counts: { games: 0, sessions: 0, groups: 0, events: 0 }, recentSessions: [], invites: [], events: [] };
describe("Club dashboard", () => {
  it("provides working creation paths when there are no events or sessions", () => {
    render(<DashboardOverview {...base} />);
    expect(screen.getByRole("link", { name: "Ersten Spieleabend planen" })).toHaveAttribute("href", "/dashboard/events/new");
    expect(screen.getByRole("link", { name: "Erste Partie erfassen" })).toHaveAttribute("href", "/dashboard/sessions/new");
    expect(screen.getByText("Aktuell keine offenen Einladungen.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "0 Spieleabende" })).toHaveAttribute("href", "/dashboard/events");
  });
  it("opens with the primary heading without an eyebrow label", () => {
    render(<DashboardOverview {...base} />);
    expect(screen.getByRole("heading", { level: 1, name: "Der nächste Spieleabend wartet." })).toBeInTheDocument();
    expect(screen.queryByText("Deine Spielrunde")).not.toBeInTheDocument();
  });
  it("prioritizes answering pending invitations from the dashboard heading", () => {
    render(<DashboardOverview {...base} invites={[{
      id: "invite", eventId: "night", status: "pending",
      event: { id: "night", title: "Freitagsrunde", eventDate: "2026-11-20T18:00:00Z", location: null, createdBy: { name: "Alex" } },
    }]} />);
    expect(screen.getByRole("link", { name: "Einladungen beantworten" })).toHaveAttribute("href", "#dashboard-invites");
    expect(screen.getByRole("region", { name: "Offene Einladungen" })).toHaveAttribute("id", "dashboard-invites");
  });
  it("offers event planning in the dashboard heading when there are no invitations", () => {
    render(<DashboardOverview {...base} />);
    expect(screen.getByRole("link", { name: "Spieleabend planen" })).toHaveAttribute("href", "/dashboard/events/new");
  });
  it("shows the actual selected game without inventing a missing vote", () => {
    render(<DashboardOverview {...base} events={[{
      id: "night", title: "Freitagsrunde", eventDate: "2026-11-06T18:00:00Z", location: "Bei Anna",
      selectedGameName: "Azul", votingClosed: true,
      proposals: [{ id: "proposal", name: "Cascadia", minutes: 30, imageUrl: null, totalVotes: 2 }],
    }]} />);
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spieleabend ansehen" })).toHaveAttribute("href", "/dashboard/events/night");
    expect(screen.queryByText("Deine Stimme fehlt noch.")).not.toBeInTheDocument();
    expect(screen.queryByText("Top 3 nach Stimmen")).not.toBeInTheDocument();
  });

  it("shows ranked leading proposals with vote totals and cover fallbacks", () => {
    const { container } = render(<DashboardOverview {...base} events={[{
      id: "night", title: "Freitagsrunde", eventDate: "2026-11-06T18:00:00Z", location: "Bei Anna",
      selectedGameName: null, votingClosed: false,
      proposals: [
        { id: "first", name: "Azul", minutes: 45, imageUrl: "https://images.example/azul.jpg", totalVotes: 3 },
        { id: "second", name: "Cascadia mit einem bewusst langen Namen", minutes: null, imageUrl: null, totalVotes: 1 },
      ],
    }]} />);

    expect(screen.getByText("Top 3 nach Stimmen")).toBeInTheDocument();
    expect(screen.getByText("1 Stimme")).toBeInTheDocument();
    expect(screen.getByText("3 Stimmen · 45 Min.")).toBeInTheDocument();
    expect(screen.getByText("Cascadia mit einem bewusst langen Namen")).toBeInTheDocument();
    expect(container.querySelector("img")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-dice-6")).toBeInTheDocument();
  });

  it("keeps the leading proposal visible when voting is closed but no game is selected", () => {
    render(<DashboardOverview {...base} events={[{
      id: "night", title: "Freitagsrunde", eventDate: "2026-11-06T18:00:00Z", location: null,
      selectedGameName: null, votingClosed: true,
      proposals: [{ id: "winner", name: "Azul", minutes: null, imageUrl: null, totalVotes: 4 }],
    }]} />);

    expect(screen.getByText("Abstimmung beendet")).toBeInTheDocument();
    expect(screen.getByText("Top 3 nach Stimmen")).toBeInTheDocument();
    expect(screen.getByText("Azul")).toBeInTheDocument();
  });
});
