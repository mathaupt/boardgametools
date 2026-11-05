import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, toast } = vi.hoisted(() => ({ push: vi.fn(), toast: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast }) }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ value, onValueChange, children }: any) => <select value={value} onChange={(e) => onValueChange(e.target.value)}>{children}</select>,
  SelectTrigger: ({ children }: any) => <>{children}</>,
  SelectValue: ({ placeholder }: any) => <option value="">{placeholder}</option>,
  SelectContent: ({ children }: any) => <>{children}</>,
  SelectItem: ({ value, children }: any) => <option value={value}>{children}</option>,
}));

import SessionEditClient from "@/app/(dashboard)/dashboard/sessions/[id]/edit/session-edit-client";

const session = {
  id: "session-1", gameId: "game-1", gameNameSnapshot: null, gameBggIdSnapshot: null, gameImageUrlSnapshot: null, gameMinPlayersSnapshot: null, gameMaxPlayersSnapshot: null, gamePlayTimeMinutesSnapshot: null, gameComplexitySnapshot: null, playedAt: "2026-10-01T12:00:00.000Z", durationMinutes: 60, notes: "Notiz",
  guestPlayers: [],
  players: [
    { userId: "user-1", score: 10, isWinner: true, placement: 1 },
    { userId: "user-2", score: 0, isWinner: false, placement: 2 },
  ],
};
const games = [{ id: "game-1", name: "Catan", minPlayers: 3, maxPlayers: 4 }, { id: "game-2", name: "Azul", minPlayers: 2, maxPlayers: 4 }];
const users = [{ id: "user-1", name: "Mara", email: "mara@example.com" }, { id: "user-2", name: "Alex", email: "alex@example.com" }];

describe("SessionEditClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("edits a snapshot-only session and preserves named guest results", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<SessionEditClient session={{
      ...session, gameId: null, gameNameSnapshot: "BGG-Abenteuer", players: [],
      guestPlayers: [{ id: "guest-player-1", name: "Max", score: 8, isWinner: true, placement: 1 }],
    }} games={games} users={users} />);

    expect(screen.getByText(/BGG-Abenteuer/)).toBeInTheDocument();
    expect(screen.getByLabelText("Gastname 1")).toHaveValue("Max");
    await user.click(screen.getByRole("button", { name: "Änderungen speichern" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/sessions/session-1", expect.objectContaining({
      method: "PUT",
      body: expect.stringContaining('"guestPlayers":[{"name":"Max","score":8,"isWinner":true,"placement":1}]'),
    })));
  });

  it("renders the session and lets the user update game and date", async () => {
    const user = userEvent.setup();
    render(<SessionEditClient session={session} games={games} users={users} />);
    expect(screen.getByLabelText("Gespielt am *")).toHaveValue("2026-10-01");
    expect(screen.getByLabelText("Dauer (Min)")).toHaveValue(60);
    expect(screen.getByLabelText("Notizen")).toHaveValue("Notiz");
    await user.selectOptions(screen.getAllByRole("combobox")[0], "game-2");
    await user.clear(screen.getByLabelText("Gespielt am *"));
    await user.type(screen.getByLabelText("Gespielt am *"), "2026-10-12");
    expect(screen.getAllByRole("combobox")[0]).toHaveValue("game-2");
    expect(screen.getByLabelText("Gespielt am *")).toHaveValue("2026-10-12");
  });

  it("adds and removes players and keeps exactly one winner", async () => {
    const user = userEvent.setup();
    render(<SessionEditClient session={session} games={games} users={users} />);
    const winnerChecks = screen.getAllByLabelText("Gewinner");
    expect(winnerChecks[0]).toBeChecked();
    await user.click(winnerChecks[1]);
    expect(winnerChecks[0]).not.toBeChecked();
    expect(winnerChecks[1]).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Spieler hinzufügen" }));
    expect(screen.getAllByText("Spieler *")).toHaveLength(3);
    await user.click(screen.getAllByRole("button", { name: "Spieler entfernen" })[0]);
    expect(screen.getAllByText("Spieler *")).toHaveLength(2);
  });

  it("saves normalized session and player data and navigates to the detail view", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<SessionEditClient session={session} games={games} users={users} />);
    await user.clear(screen.getByLabelText("Dauer (Min)"));
    await user.type(screen.getByLabelText("Dauer (Min)"), "75");
    await user.click(screen.getByRole("button", { name: "Änderungen speichern" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/sessions/session-1", expect.objectContaining({
      method: "PUT",
      body: JSON.stringify({
        gameId: "game-1", playedAt: "2026-10-01", durationMinutes: 75, notes: "Notiz",
        players: [
          { userId: "user-1", score: 10, isWinner: true, placement: 1 },
          { userId: "user-2", score: null, isWinner: false, placement: 2 },
        ],
        guestPlayers: [],
      }),
    })));
    expect(push).toHaveBeenCalledWith("/dashboard/sessions/session-1");
  });

  it("shows the API error and keeps the form available for correction", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => ({ error: "Spiel ist nicht verfügbar" }) } as Response);
    render(<SessionEditClient session={session} games={games} users={users} />);
    await user.click(screen.getByRole("button", { name: "Änderungen speichern" }));

    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "Spiel ist nicht verfügbar", variant: "destructive" })));
    expect(screen.getByRole("button", { name: "Änderungen speichern" })).toBeEnabled();
    expect(push).not.toHaveBeenCalled();
  });

  it("navigates back when editing is cancelled", async () => {
    const user = userEvent.setup();
    render(<SessionEditClient session={session} games={games} users={users} />);
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(push).toHaveBeenCalledWith("/dashboard/sessions/session-1");
  });

  it("adds, edits and removes a guest while saving a snapshot-only session", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: true } as Response);
    render(<SessionEditClient session={{ ...session, gameId: null, gameNameSnapshot: null, durationMinutes: null, notes: null, players: [], guestPlayers: [] }} games={[]} users={[]} />);
    expect(screen.getByText(/Unbekanntes Spiel/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Gastspieler hinzufügen" }));
    await user.type(screen.getByLabelText("Gastname 1"), "  Mia  ");
    await user.clear(screen.getByLabelText("Platz").closest("div")!.querySelector("input")!);
    await user.type(screen.getByLabelText("Platz").closest("div")!.querySelector("input")!, "1");
    await user.click(screen.getByRole("checkbox", { name: "Gewinner" }));
    await user.click(screen.getByRole("button", { name: "Änderungen speichern" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/sessions/session-1", expect.objectContaining({
      body: JSON.stringify({ playedAt: "2026-10-01", durationMinutes: null, notes: "", players: [], guestPlayers: [{ name: "Mia", score: null, isWinner: true, placement: 1 }] }),
    })));
    expect(push).toHaveBeenCalledWith("/dashboard/sessions/session-1");
  });

  it("uses a safe fallback when the failed save has no readable JSON body", async () => {
    const user = userEvent.setup();
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false, json: async () => { throw new Error("invalid JSON"); } } as unknown as Response);
    render(<SessionEditClient session={session} games={games} users={users} />);
    await user.click(screen.getByRole("button", { name: "Änderungen speichern" }));
    await waitFor(() => expect(toast).toHaveBeenCalledWith(expect.objectContaining({ description: "invalid JSON", variant: "destructive" })));
    expect(push).not.toHaveBeenCalled();
  });
});
