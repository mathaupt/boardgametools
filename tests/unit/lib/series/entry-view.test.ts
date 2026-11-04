import { describe, expect, it } from "vitest";
import { toSeriesEntryView } from "@/lib/series/entry-view";

describe("Serieneintragsansicht", () => {
  it("baut temporäre Spielansichten aus dem Snapshot ohne Game-Relation", () => {
    const view = toSeriesEntryView({
      id: "entry-1",
      gameId: null,
      gameName: "Catan",
      gameDescription: "Beschreibung",
      gameImageUrl: "https://example.test/catan.jpg",
      minPlayers: 3,
      maxPlayers: 4,
      gamePlayTimeMinutes: 60,
      complexity: 2,
      bggId: "13",
      game: null,
    });

    expect(view.game).toEqual({
      id: "temporary-entry-1",
      name: "Catan",
      description: "Beschreibung",
      imageUrl: "https://example.test/catan.jpg",
      minPlayers: 3,
      maxPlayers: 4,
      playTimeMinutes: 60,
      complexity: 2,
      bggId: "13",
    });
  });
});
