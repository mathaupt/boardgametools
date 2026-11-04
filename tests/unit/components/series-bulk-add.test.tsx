import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AddGameDialog } from "@/app/(dashboard)/dashboard/series/[id]/add-game-dialog";

vi.mock("@/components/barcode-scanner", () => ({ BarcodeScanner: () => null }));

const games = [
  { id: "game-catan", name: "Catan", imageUrl: null, minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60, bggId: "13" },
  { id: "game-azul", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4, playTimeMinutes: 45, bggId: "230802" },
];

const fetchMock = vi.fn();
const onOpenChange = vi.fn();
const onGamesAdded = vi.fn();

function renderDialog() {
  return render(
    <AddGameDialog
      open
      onOpenChange={onOpenChange}
      seriesId="series-1"
      existingGameIds={[]}
      onGamesAdded={onGamesAdded}
    />,
  );
}

describe("AddGameDialog multi-selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      return Response.json({ error: "Unexpected request" }, { status: 500 });
    });
  });

  it("allows choosing several collection games before submitting", async () => {
    const user = userEvent.setup();
    renderDialog();

    const catan = await screen.findByRole("checkbox", { name: "Catan auswählen" });
    const azul = screen.getByRole("checkbox", { name: "Azul auswählen" });
    await user.click(catan);
    await user.click(azul);

    expect(catan).toBeChecked();
    expect(azul).toBeChecked();
    expect(screen.getByRole("button", { name: "2 Spiele hinzufügen" })).toBeEnabled();
  });

  it("does not make the selection button available before choosing a game", async () => {
    renderDialog();

    await screen.findByRole("checkbox", { name: "Catan auswählen" });
    expect(screen.getByRole("button", { name: "Ausgewählte Spiele hinzufügen" })).toBeDisabled();
  });

  it("submits selected games one at a time and keeps the dialog open with results", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      return Response.json({}, { status: 201 });
    });
    renderDialog();
    await user.click(await screen.findByRole("checkbox", { name: "Catan auswählen" }));
    await user.click(screen.getByRole("checkbox", { name: "Azul auswählen" }));
    await user.click(screen.getByRole("button", { name: "2 Spiele hinzufügen" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls.slice(1).map((call) => call[1]?.body)).toEqual([
      JSON.stringify({ gameId: "game-catan" }),
      JSON.stringify({ gameId: "game-azul" }),
    ]);
    expect(await screen.findByText("Catan: Hinzugefügt")).toBeInTheDocument();
    expect(onGamesAdded).toHaveBeenCalledWith([{ gameId: "game-catan" }, { gameId: "game-azul" }], false);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("allows multiple BGG selections and reuses a collection match", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      if (url.startsWith("/api/bgg/search")) return Response.json([
        { bggId: "13", name: "Catan", yearPublished: 1995 },
        { bggId: "999", name: "New Game", yearPublished: 2024 },
      ]);
      if (url === "/api/games/bgg-presence") return Response.json({ matches: { "13": { id: "game-catan", name: "Catan" }, "999": null } });
      return Response.json({}, { status: 201 });
    });
    renderDialog();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    await user.type(screen.getByRole("textbox", { name: "Spiel auf BGG suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.click(await screen.findByRole("checkbox", { name: "Catan auswählen" }));
    await user.click(screen.getByRole("checkbox", { name: "New Game auswählen" }));
    await user.click(screen.getByRole("tab", { name: "Aus Sammlung" }));
    await user.type(screen.getByRole("textbox", { name: "Spiel suchen" }), "Azul");
    expect(screen.getByText("2 von 20 Spielen ausgewählt")).toBeInTheDocument();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    await user.click(screen.getByRole("button", { name: "2 Spiele hinzufügen" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(5));
    expect(fetchMock.mock.calls.slice(3).map((call) => call[1]?.body)).toEqual([
      JSON.stringify({ gameId: "game-catan" }),
      JSON.stringify({ bggId: "999" }),
    ]);
  });

  it("adds an unmatched BGG game to the series without importing it into the collection", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      if (url.startsWith("/api/bgg/search")) return Response.json([{ bggId: "999", name: "New Game", yearPublished: 2024 }]);
      if (url === "/api/games/bgg-presence") return Response.json({ matches: { "999": null } });
      return Response.json({}, { status: 201 });
    });
    renderDialog();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    await user.type(screen.getByRole("textbox", { name: "Spiel auf BGG suchen" }), "New Game");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await screen.findByRole("checkbox", { name: "New Game auswählen" });
    await user.click(screen.getByRole("radio", { name: "Nur in diese Reihe" }));
    await user.selectOptions(screen.getByRole("combobox", { name: "Optionale Herkunft" }), "BORROWED");
    await user.click(screen.getByRole("button", { name: "Nur zur Reihe hinzufügen" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith("/api/series/series-1/entries", expect.objectContaining({ body: JSON.stringify({ kind: "temporary", bggId: "999", reason: "BORROWED" }) })));
    expect(fetchMock).not.toHaveBeenCalledWith("/api/games", expect.objectContaining({ method: "POST" }));
  });

  it("shows a no-results message only after a successful empty BGG search", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      if (url.startsWith("/api/bgg/search")) return Response.json([]);
      return Response.json({ matches: {} });
    });
    renderDialog();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    await user.type(screen.getByRole("textbox", { name: "Spiel auf BGG suchen" }), "Unbekannt");
    expect(screen.queryByText(/Keine passenden Spiele gefunden/)).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByText(/Keine passenden Spiele gefunden/)).toBeInTheDocument();
  });

  it("shows provider failures separately from an empty BGG result", async () => {
    const user = userEvent.setup();
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      if (url.startsWith("/api/bgg/search")) return Response.json({ error: "BGG nicht erreichbar" }, { status: 503 });
      return Response.json({ matches: {} });
    });
    renderDialog();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    await user.type(screen.getByRole("textbox", { name: "Spiel auf BGG suchen" }), "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("BoardGameGeek ist gerade nicht erreichbar");
    expect(screen.queryByText(/Keine passenden Spiele gefunden/)).not.toBeInTheDocument();
  });

  it("ignores a stale response after the search term changes", async () => {
    const user = userEvent.setup();
    let resolveOldSearch: ((response: Response) => void) | undefined;
    fetchMock.mockImplementation((url: string) => {
      if (url === "/api/games") return Promise.resolve(Response.json(games));
      if (url.includes("q=Catan")) return new Promise<Response>((resolve) => { resolveOldSearch = resolve; });
      if (url.includes("q=Azul")) return Promise.resolve(Response.json([{ bggId: "230802", name: "Azul", yearPublished: 2017 }]));
      if (url === "/api/games/bgg-presence") return Promise.resolve(Response.json({ matches: {} }));
      return Promise.resolve(Response.json({ error: "Unexpected request" }, { status: 500 }));
    });
    renderDialog();
    await user.click(screen.getByRole("tab", { name: "BGG Import" }));
    const search = screen.getByRole("textbox", { name: "Spiel auf BGG suchen" });
    await user.type(search, "Catan");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    await user.clear(search);
    await user.type(search, "Azul");
    await user.click(screen.getByRole("button", { name: "Suchen" }));
    expect(await screen.findByRole("checkbox", { name: "Azul auswählen" })).toBeInTheDocument();
    resolveOldSearch?.(Response.json([{ bggId: "13", name: "Catan", yearPublished: 1995 }]));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Azul auswählen" })).toBeInTheDocument());
    expect(screen.queryByRole("checkbox", { name: "Catan auswählen" })).not.toBeInTheDocument();
  });

  it("limits a batch to twenty selected games", async () => {
    const user = userEvent.setup();
    const manyGames = Array.from({ length: 21 }, (_, index) => ({
      id: `game-${index}`,
      name: `Spiel ${index + 1}`,
      imageUrl: null,
      minPlayers: 1,
      maxPlayers: 4,
      playTimeMinutes: 30,
      bggId: null,
    }));
    fetchMock.mockImplementation(async () => Response.json(manyGames));
    renderDialog();
    for (let index = 1; index <= 20; index += 1) {
      await user.click(await screen.findByRole("checkbox", { name: `Spiel ${index} auswählen` }));
    }
    expect(screen.getByText("20 von 20 Spielen ausgewählt")).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Spiel 21 auswählen" })).toBeDisabled();
  });

  it("retries only failed games after a partial result", async () => {
    const user = userEvent.setup();
    let entryCalls = 0;
    fetchMock.mockImplementation(async (url: string) => {
      if (url === "/api/games") return Response.json(games);
      entryCalls += 1;
      if (entryCalls === 2) return Response.json({ error: "server detail" }, { status: 500 });
      return Response.json({}, { status: 201 });
    });
    renderDialog();
    await user.click(await screen.findByRole("checkbox", { name: "Catan auswählen" }));
    await user.click(screen.getByRole("checkbox", { name: "Azul auswählen" }));
    await user.click(screen.getByRole("button", { name: "2 Spiele hinzufügen" }));
    await screen.findByText("Catan: Hinzugefügt");
    await screen.findByText("Azul: Das Spiel konnte nicht hinzugefügt werden. Bitte versuche es erneut.");

    await user.click(screen.getByRole("button", { name: "Fehlgeschlagene erneut versuchen" }));
    await screen.findByText("Azul: Hinzugefügt");
    expect(entryCalls).toBe(3);
    expect(fetchMock.mock.calls.filter((call) => call[0] === "/api/series/series-1/entries").map((call) => call[1]?.body)).toEqual([
      JSON.stringify({ gameId: "game-catan" }),
      JSON.stringify({ gameId: "game-azul" }),
      JSON.stringify({ gameId: "game-azul" }),
    ]);
  });
});
