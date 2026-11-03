import { describe, expect, it, vi } from "vitest";
import { addSeriesGamesSequentially, getSeriesGameSelectionKey } from "@/lib/series/bulk-add-entries";

describe("addSeriesGamesSequentially", () => {
  it("verwendet stabile und eindeutige Auswahl-IDs", () => {
    expect(getSeriesGameSelectionKey({ gameId: "a" })).toBe("game:a");
    expect(getSeriesGameSelectionKey({ bggId: "13" })).toBe("bgg:13");
  });

  it("verarbeitet alle Einträge seriell und behält Einzelergebnisse", async () => {
    const items = [
      { key: "game:a", input: { gameId: "a" } },
      { key: "game:b", input: { gameId: "b" } },
      { key: "bgg:13", input: { bggId: "13" } },
    ];
    const callOrder: string[] = [];
    const request = vi.fn(async (input: { gameId?: string; bggId?: string }) => {
      const key = input.gameId ? `game:${input.gameId}` : `bgg:${input.bggId}`;
      callOrder.push(key);
      if (key === "game:b") return new Response(JSON.stringify({ error: "Dieses Spiel ist bereits in dieser Reihe." }), { status: 409 });
      if (key === "bgg:13") return new Response(JSON.stringify({ error: "BoardGameGeek ist nicht erreichbar." }), { status: 503 });
      return new Response("{}", { status: 201 });
    });

    const results = await addSeriesGamesSequentially(items, request);

    expect(callOrder).toEqual(["game:a", "game:b", "bgg:13"]);
    expect(results).toEqual([
      { key: "game:a", status: "added" },
      { key: "game:b", status: "already_present" },
      { key: "bgg:13", status: "failed", message: "Das Spiel konnte nicht hinzugefügt werden. Bitte versuche es erneut." },
    ]);
  });

  it("setzt nach einem Netzwerkfehler mit den folgenden Spielen fort", async () => {
    const items = [
      { key: "game:a", input: { gameId: "a" } },
      { key: "game:b", input: { gameId: "b" } },
    ];
    const request = vi.fn()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response("{}", { status: 201 }));

    const results = await addSeriesGamesSequentially(items, request);

    expect(request).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      { key: "game:a", status: "failed", message: "Verbindungsfehler. Bitte versuche es erneut." },
      { key: "game:b", status: "added" },
    ]);
  });
});
