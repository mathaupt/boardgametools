import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
import { PlayedSessionForm } from "@/app/(dashboard)/dashboard/events/[id]/played-session-form";
const participants = [{ id: "u1", name: "Alex", kind: "user" as const }, { id: "g1", name: "Mia", kind: "guest" as const }];
const props = { eventId: "e1", proposals: [{ id: "p1", gameName: "Catan" }], participants, defaultPlayedAt: "2026-11-04T18:00:00.000Z", onCancel: vi.fn(), onCreated: vi.fn() };
beforeEach(() => { vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe("PlayedSessionForm", () => {
  it("requires a participant, then saves users, guests and result details", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json({ id: "session-1" })); vi.stubGlobal("fetch", fetchMock);
    const user = userEvent.setup(); render(<PlayedSessionForm {...props} />);
    await user.click(screen.getAllByRole("checkbox", { name: /Alex/ })[0]);
    await user.click(screen.getAllByRole("checkbox", { name: /Mia/ })[0]);
    await user.click(screen.getByRole("button", { name: "Partie speichern" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wähle mindestens eine mitspielende Person aus");
    await user.click(screen.getAllByRole("checkbox", { name: /Alex/ })[0]);
    await user.click(screen.getAllByRole("checkbox", { name: /Mia/ })[0]);
    await user.type(screen.getByLabelText("Punkte für Alex"), "10");
    await user.type(screen.getByLabelText("Platz für Mia"), "2");
    await user.click(screen.getByRole("checkbox", { name: "Gewinner für Alex" }));
    await user.type(screen.getByLabelText("Dauer in Minuten"), "70");
    await user.type(screen.getByLabelText("Notizen"), "  Gute Partie  ");
    await user.click(screen.getByRole("button", { name: "Partie speichern" }));
    await waitFor(() => expect(props.onCreated).toHaveBeenCalledOnce());
    expect(mocks.refresh).toHaveBeenCalledOnce();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body).toMatchObject({ proposalId: "p1", durationMinutes: 70, notes: "Gute Partie", players: [{ userId: "u1", score: 10, isWinner: true }], guestPlayers: [{ guestId: "g1", placement: 2, isWinner: false }] });
  });

  it("allows no proposal selection when the list is empty and invokes cancel", async () => {
    const onCancel = vi.fn(); const user = userEvent.setup();
    render(<PlayedSessionForm {...props} proposals={[]} onCancel={onCancel} />);
    expect(screen.getByRole("button", { name: "Partie speichern" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Abbrechen" }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows server, malformed response and network errors without losing the form", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(Response.json({ error: "Keine Berechtigung" }, { status: 403 }))
      .mockResolvedValueOnce({ ok: false, json: async () => { throw new Error("bad JSON"); } })
      .mockRejectedValueOnce(new Error("offline"));
    vi.stubGlobal("fetch", fetchMock); const user = userEvent.setup(); render(<PlayedSessionForm {...props} />);
    await user.click(screen.getByRole("button", { name: "Partie speichern" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Keine Berechtigung");
    await user.click(screen.getByRole("button", { name: "Partie speichern" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Die Partie konnte nicht gespeichert werden.");
    await user.click(screen.getByRole("button", { name: "Partie speichern" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("offline");
  });
});
