import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AchievementDashboard } from "@/app/(dashboard)/dashboard/achievements/achievement-dashboard";
import type { BadgeProgress } from "@/lib/gamification/badges";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const badges: BadgeProgress[] = [
  { id: "first-session", title: "Erste Spielrunde", description: "Eine Session festgehalten.", unlockCondition: "Dokumentiere 1 Session als Ersteller.", altText: "Abzeichen: Erste Spielrunde", target: 1, progress: 1, earned: true, icon: "spark", metric: "createdSessions" },
  { id: "sessions-10", title: "Zehn gemeinsame Runden", description: "Zehn Sessions dokumentieren.", unlockCondition: "Dokumentiere 10 Sessions als Ersteller.", altText: "Abzeichen: Zehn gemeinsame Runden", target: 10, progress: 4, earned: false, icon: "table", metric: "createdSessions" },
];

describe("AchievementDashboard", () => {
  it("shows earned and next badges with accessible artwork and honest progress", () => {
    render(<AchievementDashboard overview={{
      stats: { createdSessions: 4, distinctGamesPlayed: 2, ownedGamesPlayed: 0, completedSeries: 0 },
      badges,
      discovery: { neverPlayed: [], longUnplayed: [] },
    }} />);

    expect(screen.getByRole("heading", { name: "Abzeichen" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Freigeschaltet" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Noch nicht freigeschaltet" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Abzeichen: Erste Spielrunde" })).toBeInTheDocument();
    expect(screen.getByText("Erste Spielrunde")).toBeInTheDocument();
    expect(screen.getByText("Dokumentiere 1 Session als Ersteller.")).toBeInTheDocument();
    expect(screen.getByText("Dokumentiere 10 Sessions als Ersteller.")).toBeInTheDocument();
    expect(screen.getByText("Freigeschaltet", { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText("4 von 10 Sessions")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Fortschritt: Zehn gemeinsame Runden" })).toBeInTheDocument();
    expect(screen.queryByRole("progressbar", { name: "Fortschritt: Erste Spielrunde" })).not.toBeInTheDocument();
  });

  it("shows the relevant unit for game milestones", () => {
    render(<AchievementDashboard overview={{
      stats: { createdSessions: 4, distinctGamesPlayed: 2, ownedGamesPlayed: 0, completedSeries: 0 },
      badges: [{ id: "games-5", title: "Fünf Spiele entdeckt", description: "Verschiedene Spiele mitspielen.", unlockCondition: "Spiele fünf verschiedene Spiele selbst mit.", altText: "Abzeichen: Fünf Spiele entdeckt", target: 5, progress: 2, earned: false, icon: "compass", metric: "distinctGamesPlayed" }],
      discovery: { neverPlayed: [], longUnplayed: [] },
    }} />);
    expect(screen.getByText("2 von 5 verschiedenen Spielen")).toBeInTheDocument();
  });

  it("renders an honest zero progress state with a singular unit for a target of one", () => {
    render(<AchievementDashboard overview={{
      stats: { createdSessions: 0, distinctGamesPlayed: 0, ownedGamesPlayed: 0, completedSeries: 0 },
      badges: [{ ...badges[1], target: 1, progress: 0 }],
      discovery: { neverPlayed: [], longUnplayed: [] },
    }} />);
    expect(screen.getByText("0 von 1 Session")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "Fortschritt: Zehn gemeinsame Runden" })).toHaveAttribute("aria-valuenow", "0");
    expect(screen.getByRole("progressbar", { name: "Fortschritt: Zehn gemeinsame Runden" }).firstElementChild).toHaveStyle({ width: "0%" });
  });

  it("offers a direct first-session path when the user has no achievement data", () => {
    render(<AchievementDashboard overview={{
      stats: { createdSessions: 0, distinctGamesPlayed: 0, ownedGamesPlayed: 0, completedSeries: 0 },
      badges: badges.map((badge) => ({ ...badge, earned: false, progress: 0 })),
      discovery: { neverPlayed: [], longUnplayed: [] },
    }} />);

    expect(screen.getByText("Halte deine erste Spielrunde fest, dann beginnt deine Abzeichenreise." )).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Erste Session erfassen" })).toHaveAttribute("href", "/dashboard/sessions/new");
  });

  it("dismisses a discovery suggestion only after the owner endpoint confirms", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup();
    render(<AchievementDashboard overview={{
      stats: { createdSessions: 0, distinctGamesPlayed: 0, ownedGamesPlayed: 0, completedSeries: 0 },
      badges,
      discovery: { neverPlayed: [{ id: "azul", name: "Azul", imageUrl: null, lastPlayedAt: null }], longUnplayed: [] },
    }} />);

    await user.click(screen.getByRole("button", { name: "Aus Entdeckerbereich entfernen: Azul" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/achievements/discovery-dismissals", expect.objectContaining({ method: "POST" })));
    await waitFor(() => expect(screen.queryByText("Azul")).not.toBeInTheDocument());
  });
});
