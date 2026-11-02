import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import { SessionGamePicker } from "@/components/sessions/session-game-picker";
import type { SessionGameOption } from "@/components/sessions/session-game-options";

expect.extend(toHaveNoViolations);
afterEach(cleanup);

const games: SessionGameOption[] = [
  { id: "azul", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 },
  { id: "muhle", name: "Mühle", imageUrl: null, minPlayers: 2, maxPlayers: 2 },
  { id: "strasse", name: "Straße", imageUrl: null, minPlayers: 2, maxPlayers: 5 },
];

describe("SessionGamePicker", () => {
  it("opens with the search focused and filters the available games", async () => {
    const user = userEvent.setup();
    render(<SessionGamePicker games={games} value="" onValueChange={vi.fn()} id="gameId" />);

    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    const search = screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" });
    expect(search).toHaveFocus();
    await user.type(search, "muhle");

    expect(screen.getByRole("option", { name: "Mühle, 2 bis 2 Spieler" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Azul, 2 bis 4 Spieler" })).not.toBeInTheDocument();
  });

  it("selects a clicked option and returns its ID exactly once", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const { rerender } = render(<SessionGamePicker games={games} value="" onValueChange={onValueChange} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.click(screen.getByRole("option", { name: "Azul, 2 bis 4 Spieler" }));

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("azul");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    rerender(<SessionGamePicker games={games} value="azul" onValueChange={onValueChange} id="gameId" />);
    expect(screen.getByRole("button", { name: "Azul" })).toBeInTheDocument();
  });

  it("selects the active result with arrow keys and Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SessionGamePicker games={games} value="" onValueChange={onValueChange} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.keyboard("{ArrowDown}{Enter}");

    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("muhle");
  });

  it("closes on Escape without changing the selected value and restores focus", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SessionGamePicker games={games} value="azul" onValueChange={onValueChange} id="gameId" />);
    const trigger = screen.getByRole("button", { name: "Azul" });
    await user.click(trigger);
    await user.type(screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" }), "muhle");
    await user.keyboard("{Escape}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("lets Tab leave the search and advance to the next form field", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <SessionGamePicker games={games} value="" onValueChange={vi.fn()} id="gameId" />
        <input aria-label="Nächstes Feld" />
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.tab();

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Nächstes Feld" })).toHaveFocus());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps the clear-search action in the tab order before leaving the picker", async () => {
    const user = userEvent.setup();
    render(
      <form>
        <SessionGamePicker games={games} value="" onValueChange={vi.fn()} id="gameId" />
        <input aria-label="Nächstes Feld" />
      </form>
    );
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.type(screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" }), "azul");
    await user.tab();
    expect(screen.getByRole("button", { name: "Suche leeren" })).toHaveFocus();
    await user.tab();

    await waitFor(() => expect(screen.getByRole("textbox", { name: "Nächstes Feld" })).toHaveFocus());
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("offers a clear-search action when there are no results", async () => {
    const user = userEvent.setup();
    render(<SessionGamePicker games={games} value="" onValueChange={vi.fn()} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.type(screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" }), "nicht vorhanden");

    expect(screen.getByText("Keine passenden Spiele gefunden.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suche leeren" }));
    expect(screen.getAllByRole("option")).toHaveLength(games.length);
  });

  it("shows an empty collection message and creation link", async () => {
    const user = userEvent.setup();
    render(<SessionGamePicker games={[]} value="" onValueChange={vi.fn()} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));

    expect(screen.getByText("Noch keine Spiele in deiner Sammlung.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Spiel zur Sammlung hinzufügen" })).toHaveAttribute("href", "/dashboard/games/new");
  });

  it("keeps options accessible and the selected value named", async () => {
    const user = userEvent.setup();
    const { container } = render(<SessionGamePicker games={games} value="azul" onValueChange={vi.fn()} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Azul" }));
    const listbox = await screen.findByRole("listbox", { name: "Spiele in deiner Sammlung" });

    expect(within(listbox).getAllByRole("option")).toHaveLength(games.length);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("does not select anything for an empty result set on Enter", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SessionGamePicker games={games} value="" onValueChange={onValueChange} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.type(screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" }), "nicht vorhanden");
    await user.keyboard("{Enter}");

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox", { name: "Spiele in deiner Sammlung" })).toBeInTheDocument();
  });

  it("does not select a result when Enter confirms an active IME composition", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(<SessionGamePicker games={games} value="" onValueChange={onValueChange} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    const search = screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" });
    fireEvent.compositionStart(search);
    fireEvent.keyDown(search, { key: "Enter", isComposing: true });

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("listbox", { name: "Spiele in deiner Sammlung" })).toBeInTheDocument();
  });

  it("keeps all matching options available for a large local collection", async () => {
    const user = userEvent.setup();
    const manyGames = Array.from({ length: 1_000 }, (_, index) => ({
      id: `game-${index}`,
      name: index === 999 ? "Zielspiel" : `Brettspiel ${index}`,
      imageUrl: null,
      minPlayers: 1,
      maxPlayers: 4,
    }));
    render(<SessionGamePicker games={manyGames} value="" onValueChange={vi.fn()} id="gameId" />);
    await user.click(screen.getByRole("button", { name: "Spiel auswählen…" }));
    await user.type(screen.getByRole("combobox", { name: "Spiele in deiner Sammlung suchen" }), "zielspiel");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: "Zielspiel, 1 bis 4 Spieler" })).toBeInTheDocument();
  });
});
