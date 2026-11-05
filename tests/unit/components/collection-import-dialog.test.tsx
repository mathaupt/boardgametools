import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
const mocks = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn(), fetch: vi.fn(), imported: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: mocks.push, refresh: mocks.refresh }) }));
vi.mock("next/image", () => ({ default: (props: { src: string; alt: string }) => <img {...props} /> }));
import { CollectionImportDialog } from "@/app/(dashboard)/dashboard/games/import/collection-import-dialog";

const games = [
  { bggId: "13", name: "Catan", yearPublished: 1995, thumbnailUrl: "https://example.test/catan.jpg", minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60, rating: 7.2, numPlays: 2 },
  { bggId: "42", name: "Azul", yearPublished: null, thumbnailUrl: null, minPlayers: null, maxPlayers: null, playTimeMinutes: null, rating: null, numPlays: 0 },
  { bggId: "99", name: "Owned", yearPublished: 2020, thumbnailUrl: null, minPlayers: 1, maxPlayers: 2, playTimeMinutes: 30, rating: 6, numPlays: 1 },
];
async function openAndLoad(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /Gesamte Sammlung importieren/ }));
  await user.type(screen.getByRole("textbox", { name: "BGG-Benutzername" }), "  player name  ");
  await user.click(screen.getByRole("button", { name: "Laden" }));
}
beforeEach(() => { mocks.fetch.mockReset(); mocks.push.mockReset(); mocks.refresh.mockReset(); mocks.imported.mockReset(); vi.stubGlobal("fetch", mocks.fetch); });

describe("CollectionImportDialog", () => {
  it("lädt die Sammlung, markiert nur neue Spiele und kann die Auswahl umschalten", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ collection: games }));
    const user = userEvent.setup();
    render(<CollectionImportDialog existingBggIds={new Set(["99"])} onImported={mocks.imported} />);
    await openAndLoad(user);
    expect(mocks.fetch).toHaveBeenCalledWith("/api/bgg/collection?username=player%20name");
    expect(await screen.findByText("Catan")).toBeInTheDocument();
    expect(screen.getByText("2 / 3 ausgewählt")).toBeInTheDocument();
    expect(screen.getByText("(bereits importiert)")).toBeInTheDocument();
    expect(screen.getByAltText("Catan")).toHaveAttribute("src", "https://example.test/catan.jpg");
    await user.click(screen.getByRole("button", { name: "Alle abwählen" }));
    expect(screen.getByText("0 / 3 ausgewählt")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Alle auswählen" }));
    expect(screen.getByText("2 / 3 ausgewählt")).toBeInTheDocument();
  });

  it("zeigt Server- und Verbindungsfehler und erlaubt einen erneuten Abruf", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ error: "BGG nicht erreichbar" }, { status: 503 }));
    mocks.fetch.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<CollectionImportDialog existingBggIds={new Set()} onImported={mocks.imported} />);
    await openAndLoad(user);
    expect(await screen.findByText("BGG nicht erreichbar")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Laden" }));
    expect(await screen.findByText("Verbindungsfehler – bitte erneut versuchen")).toBeInTheDocument();
  });

  it("fasst erfolgreiche, doppelte, fehlgeschlagene Imports zusammen und navigiert zur Sammlung", async () => {
    mocks.fetch.mockResolvedValueOnce(Response.json({ collection: games }));
    mocks.fetch.mockResolvedValueOnce(Response.json({}));
    mocks.fetch.mockResolvedValueOnce(Response.json({}, { status: 409 }));
    mocks.fetch.mockRejectedValueOnce(new Error("offline"));
    const user = userEvent.setup();
    render(<CollectionImportDialog existingBggIds={new Set(["99"])} onImported={mocks.imported} />);
    await openAndLoad(user);
    await user.click(screen.getByRole("button", { name: "2 Spiele importieren" }));
    expect(await screen.findByText(/1 Spiel importiert, 1 bereits vorhanden \/ übersprungen/)).toBeInTheDocument();
    expect(mocks.imported).toHaveBeenCalledWith(["13", "42"]);
    await user.click(screen.getByRole("button", { name: "Zur Spielesammlung" }));
    expect(mocks.push).toHaveBeenCalledWith("/dashboard/games");
    expect(mocks.refresh).toHaveBeenCalledOnce();
  });

  it("zeigt Lade- und leere Auswahlsituationen ohne Importaktion", async () => {
    mocks.fetch.mockResolvedValue(Response.json({ collection: games }));
    const user = userEvent.setup();
    render(<CollectionImportDialog existingBggIds={new Set(["13", "42", "99"])} onImported={mocks.imported} />);
    await openAndLoad(user);
    await waitFor(() => expect(screen.getByText("0 / 3 ausgewählt")).toBeInTheDocument());
    expect(screen.getByRole("button", { name: "0 Spiele importieren" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Schließen" }));
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
  });
});
