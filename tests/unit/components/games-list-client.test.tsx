import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const { push, refresh } = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, refresh }) }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    <a href={href} {...props}>{children}</a>,
}));
vi.mock("@/app/(dashboard)/dashboard/games/collection-game-card", () => ({ CollectionGameCard: ({ game }: { game: { name: string } }) => <span>{game.name}</span> }));
vi.mock("@/app/(dashboard)/dashboard/games/collection-filters", () => ({
  CollectionFilters: ({ searchText, setSearchText, playerCount, setPlayerCount, sortOption, setSortOption, setMinComplexity, setActiveTag }: any) => (
    <div>
      <label>Suche<input aria-label="Spiele suchen" value={searchText} onChange={(e) => setSearchText(e.target.value)} /></label>
      <select aria-label="Spielerzahl" value={playerCount} onChange={(e) => setPlayerCount(e.target.value)}>
        <option value="all">Alle</option><option value="2">2</option>
      </select>
      <select aria-label="Sortierung" value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
        <option value="name_asc">Name aufsteigend</option><option value="name_desc">Name absteigend</option>
        <option value="complexity_asc">Komplexität aufsteigend</option><option value="complexity_desc">Komplexität absteigend</option>
        <option value="players_asc">Spieler aufsteigend</option><option value="players_desc">Spieler absteigend</option><option value="newest">Neueste</option>
      </select>
      <button onClick={() => setMinComplexity(3)}>Komplexität filtern</button>
      <button onClick={() => setActiveTag("strategy")}>Strategie</button>
    </div>
  ),
}));
vi.mock("@/components/barcode-scanner", () => ({
  BarcodeScanner: ({ open, onGameSelected, onLocalGameFound }: { open: boolean; onGameSelected: (id: string, ean: string) => void; onLocalGameFound: (id: string) => void }) => open ? <div>
    <button onClick={() => onGameSelected("bgg-1", "ean-1")}>BGG-Treffer auswählen</button>
    <button onClick={() => onLocalGameFound("local-1")}>Sammlungstreffer auswählen</button>
  </div> : null,
}));

import GamesListClient, { type GameItem } from "@/app/(dashboard)/dashboard/games/games-list-client";

function game(overrides: Partial<GameItem> = {}): GameItem {
  return {
    id: "catan", name: "Catan", description: null, imageUrl: null, minPlayers: 3, maxPlayers: 4,
    playTimeMinutes: 60, complexity: 2, bggId: null, createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z", _count: { sessions: 0 }, ...overrides,
  };
}

describe("GamesListClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
  });

  it("shows the empty collection state and add-game link", () => {
    render(<GamesListClient games={[]} />);
    expect(screen.getByText("Du hast noch keine Spiele in deiner Sammlung.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spiel hinzufügen" })).toHaveAttribute("href", "/dashboard/games/new");
    expect(screen.queryByLabelText("Spiele suchen")).not.toBeInTheDocument();
  });

  it("filters by search, player count, complexity, and tag and reports no matches", async () => {
    const user = userEvent.setup();
    render(<GamesListClient games={[
      game({ id: "catan", name: "Catan", tags: [{ tag: { id: "strategy", name: "Strategie" } }] }),
      game({ id: "azul", name: "Azul", minPlayers: 2, maxPlayers: 4, complexity: 3, tags: [{ tag: { id: "strategy", name: "Strategie" } }] }),
    ]} />);

    await user.type(screen.getByLabelText("Spiele suchen"), "azul");
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
    await user.clear(screen.getByLabelText("Spiele suchen"));
    await user.selectOptions(screen.getByLabelText("Spielerzahl"), "2");
    expect(screen.getByText("Azul")).toBeInTheDocument();
    expect(screen.queryByText("Catan")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Komplexität filtern" }));
    await user.click(screen.getByRole("button", { name: "Strategie" }));
    await user.type(screen.getByLabelText("Spiele suchen"), "nicht vorhanden");
    expect(screen.getByText("Keine Spiele gefunden für diesen Filter.")).toBeInTheDocument();
  });

  it("sorts by name, complexity, player count, and newest date", async () => {
    const user = userEvent.setup();
    const { rerender } = render(<GamesListClient games={[
      game({ id: "low", name: "Azul", complexity: 1, minPlayers: 2, maxPlayers: 4, createdAt: "2025-01-01T00:00:00Z" }),
      game({ id: "high", name: "Catan", complexity: 3, minPlayers: 4, maxPlayers: 6, createdAt: "2026-01-01T00:00:00Z" }),
    ]} />);
    const cards = () => screen.getAllByRole("link").filter((link) => {
      const href = link.getAttribute("href") ?? "";
      return href.startsWith("/dashboard/games/") && !["/dashboard/games/import", "/dashboard/games/new"].includes(href);
    });
    const order = () => cards().map((card) => card.textContent);

    expect(order()).toEqual(["Azul", "Catan"]);
    await user.selectOptions(screen.getByLabelText("Sortierung"), "name_desc");
    expect(order()).toEqual(["Catan", "Azul"]);
    await user.selectOptions(screen.getByLabelText("Sortierung"), "complexity_desc");
    expect(order()).toEqual(["Catan", "Azul"]);
    await user.selectOptions(screen.getByLabelText("Sortierung"), "players_asc");
    expect(order()).toEqual(["Azul", "Catan"]);
    await user.selectOptions(screen.getByLabelText("Sortierung"), "players_desc");
    expect(order()).toEqual(["Catan", "Azul"]);
    await user.selectOptions(screen.getByLabelText("Sortierung"), "newest");
    expect(order()).toEqual(["Catan", "Azul"]);
  });

  it("deletes a selected game after confirmation and refreshes the route", async () => {
    const user = userEvent.setup();
    render(<GamesListClient games={[game()]} />);
    await user.click(screen.getByTestId("game-delete-catan"));
    expect(screen.getByText(/wirklich aus deiner Sammlung entfernen/)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Entfernen" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/games/catan", { method: "DELETE" }));
    await waitFor(() => expect(screen.queryByText("Catan")).not.toBeInTheDocument());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("keeps a game when deletion fails and still closes the dialog", async () => {
    vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);
    const user = userEvent.setup();
    render(<GamesListClient games={[game()]} />);
    await user.click(screen.getByTestId("game-delete-catan"));
    await user.click(screen.getByRole("button", { name: "Entfernen" }));

    expect(await screen.findByText("Catan")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });

  it("bulk deletes the collection using its game ids", async () => {
    const user = userEvent.setup();
    render(<GamesListClient games={[game(), game({ id: "azul", name: "Azul" })]} />);
    await user.click(screen.getByTestId("games-delete-all"));
    await user.click(screen.getByRole("button", { name: "Alle 2 entfernen" }));

    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/games/bulk-delete", expect.objectContaining({
      method: "DELETE",
      body: JSON.stringify({ ids: ["catan", "azul"] }),
    })));
    await waitFor(() => expect(screen.getByText("Du hast noch keine Spiele in deiner Sammlung.")).toBeInTheDocument());
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("imports a scanned BGG game and navigates to a scanned local game", async () => {
    const user = userEvent.setup();
    render(<GamesListClient games={[game()]} />);
    await user.click(screen.getByRole("button", { name: /Barcode scannen/ }));
    await user.click(screen.getByRole("button", { name: "BGG-Treffer auswählen" }));
    await waitFor(() => expect(fetch).toHaveBeenCalledWith("/api/games/import-bgg", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ bggId: "bgg-1", ean: "ean-1" }),
    })));
    expect(refresh).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: /Barcode scannen/ }));
    await user.click(screen.getByRole("button", { name: "Sammlungstreffer auswählen" }));
    expect(push).toHaveBeenCalledWith("/dashboard/games/local-1");
  });
});
