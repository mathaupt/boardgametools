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
  });
  it("shows the actual selected game without inventing a missing vote", () => {
    render(<DashboardOverview {...base} events={[{
      id: "night", title: "Freitagsrunde", eventDate: "2026-11-06T18:00:00Z", location: "Bei Anna",
      selectedGameName: "Azul", votingClosed: true, proposals: [],
    }]} />);
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spieleabend ansehen" })).toHaveAttribute("href", "/dashboard/events/night");
    expect(screen.queryByText("Deine Stimme fehlt noch.")).not.toBeInTheDocument();
  });
});
