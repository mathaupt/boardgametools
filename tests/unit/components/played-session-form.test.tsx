import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));
const formLoaders = import.meta.glob("../../../src/app/(dashboard)/dashboard/events/[id]/played-session-form.tsx");

describe("PlayedSessionForm game sources", () => {
  it("searches the private collection and submits only the selected game ID", async () => {
    const loader = Object.values(formLoaders)[0];
    expect(loader).toBeDefined();
    if (!loader) return;
    const featureModule = await loader() as { PlayedSessionForm: React.ComponentType<any> };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: [{ id: "game-1", name: "Catan", ownerId: "owner" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ session: { id: "session-1" } }) });
    vi.stubGlobal("fetch", fetchMock);
    render(<featureModule.PlayedSessionForm eventId="event-1" proposals={[]} participants={[{ id: "owner", name: "Anna", kind: "user" }]} defaultPlayedAt="2026-11-04T18:00:00.000Z" onCancel={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Sammlung durchsuchen" }), { target: { value: "catan" } });
    fireEvent.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByRole("option", { name: "Catan" })).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: "Suchergebnis auswählen" }), { target: { value: "game-1" } });
    fireEvent.submit(screen.getByRole("form", { name: "Gespielte Partie erfassen" }));
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/games?page=1&limit=8&q=catan");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).source).toEqual({ type: "collection", collectionGameId: "game-1" });
    vi.unstubAllGlobals();
  });

  it("requires two characters for BGG search and explains an empty result", async () => {
    const loader = Object.values(formLoaders)[0];
    if (!loader) return;
    const featureModule = await loader() as { PlayedSessionForm: React.ComponentType<any> };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => [] });
    vi.stubGlobal("fetch", fetchMock);
    render(<featureModule.PlayedSessionForm eventId="event-1" proposals={[]} participants={[{ id: "owner", name: "Anna", kind: "user" }]} defaultPlayedAt="2026-11-04T18:00:00.000Z" onCancel={vi.fn()} onCreated={vi.fn()} />);
    fireEvent.change(screen.getByRole("combobox", { name: "Spielquelle" }), { target: { value: "bgg" } });
    fireEvent.change(screen.getByRole("textbox", { name: "BoardGameGeek durchsuchen" }), { target: { value: "c" } });
    expect(screen.getByRole("button", { name: "Suchen" })).toBeDisabled();
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "BoardGameGeek durchsuchen" }), { target: { value: "cz" } });
    fireEvent.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Keine Spiele gefunden");
    expect(fetchMock).toHaveBeenCalledWith("/api/bgg/search?q=cz");
    vi.unstubAllGlobals();
  });
});
