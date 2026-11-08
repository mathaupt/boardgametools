import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SessionFormClient, { type GameOption, type UserOption } from "@/app/(dashboard)/dashboard/sessions/new/session-form-client";

const { mockPush, mockToast } = vi.hoisted(() => ({ mockPush: vi.fn(), mockToast: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mockPush }) }));
vi.mock("@/components/ui/use-toast", () => ({ useToast: () => ({ toast: mockToast }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});

const games: GameOption[] = [
  { id: "game-azul", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 },
];
const users: UserOption[] = [];

async function chooseAzul(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Spiel *" }));
  await user.click(screen.getByRole("option", { name: "Azul, 2 bis 4 Spieler" }));
}

describe("SessionFormClient game selection", () => {
  it("prevents submitting until a game from the current collection is selected", async () => {
    const { container } = render(<SessionFormClient games={games} users={users} />);
    await act(async () => fireEvent.submit(container.querySelector("form")!));

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Bitte wähle ein Spiel aus deiner aktuellen Sammlung.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Spiel *" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Spiel *" })).toHaveFocus();
  });

  it("does not submit a selected game after it disappears from the available options", async () => {
    const user = userEvent.setup();
    const { container, rerender } = render(<SessionFormClient games={games} users={users} />);
    await chooseAzul(user);
    rerender(<SessionFormClient games={[]} users={users} />);
    await act(async () => fireEvent.submit(container.querySelector("form")!));

    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByText("Bitte wähle ein Spiel aus deiner aktuellen Sammlung.")).toBeInTheDocument();
  });

  it("sends only the selected game ID while preserving the existing session payload", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionFormClient games={games} users={users} />);
    await chooseAzul(user);
    await user.type(screen.getByLabelText("Dauer (Minuten)"), "90");
    await user.type(screen.getByLabelText("Notizen"), "Guter Abend");
    await act(async () => fireEvent.submit(container.querySelector("form")!));

    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    const [, request] = vi.mocked(fetch).mock.calls[0];
    const payload = JSON.parse(String(request?.body));
    expect(payload).toMatchObject({ gameId: "game-azul", durationMinutes: 90, notes: "Guter Abend" });
    expect(payload).not.toHaveProperty("gameSearchText");
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/dashboard/sessions"));
  });
});

describe("spoken session form integration", () => {
  it("keeps preview and applied draft editable without saving and submits via the existing route", async () => {
    const user = userEvent.setup(); const { container } = render(<SessionFormClient games={games} users={[{ id: "anna", name: "Anna", email: null }]} />);
    await user.type(screen.getByLabelText("Session beschreiben"), "Azul mit Anna, 90 Minuten");
    await user.click(screen.getByRole("button", { name: "Entwurf prüfen" }));
    expect(fetch).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Ins Formular übernehmen" }));
    expect(fetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Dauer (Minuten)")).toHaveValue(90);
    await user.clear(screen.getByLabelText("Dauer (Minuten)"));
    await user.type(screen.getByLabelText("Dauer (Minuten)"), "80");
    await act(async () => fireEvent.submit(container.querySelector("form")!));
    await waitFor(() => expect(fetch).toHaveBeenCalledOnce());
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0][1]?.body))).toMatchObject({ gameId: "game-azul", durationMinutes: 80, players: [{ userId: "anna", isWinner: false }] });
  });
});
