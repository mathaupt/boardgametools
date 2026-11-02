import { describe, expect, it } from "vitest";
import { filterSessionGames, type SessionGameOption } from "@/components/sessions/session-game-options";

const games: SessionGameOption[] = [
  { id: "muhle", name: "Mühle", imageUrl: null, minPlayers: 2, maxPlayers: 2 },
  { id: "azul", name: "Azul", imageUrl: null, minPlayers: 2, maxPlayers: 4 },
  { id: "strasse", name: "Straße", imageUrl: null, minPlayers: 2, maxPlayers: 5 },
  { id: "entity", name: "Catan &amp; Co.", imageUrl: null, minPlayers: 2, maxPlayers: 4 },
  { id: "duplicate", name: "Mühle", imageUrl: null, minPlayers: 2, maxPlayers: 3 },
];

describe("filterSessionGames", () => {
  it("finds umlauted names with ASCII input and ignores surrounding whitespace", () => {
    expect(filterSessionGames(games, " MUHLE ").map((game) => game.id)).toEqual(["muhle", "duplicate"]);
  });

  it("matches German sharp s as ss and reads HTML entities as displayed text", () => {
    expect(filterSessionGames(games, "strasse").map((game) => game.id)).toEqual(["strasse"]);
    expect(filterSessionGames(games, "catan & co").map((game) => game.id)).toEqual(["entity"]);
  });

  it("preserves the source order, duplicates, and input array", () => {
    expect(filterSessionGames(games, "")).toEqual(games);
    expect(filterSessionGames(games, "m").map((game) => game.id)).toEqual(["muhle", "duplicate"]);
    expect(games.map((game) => game.id)).toEqual(["muhle", "azul", "strasse", "entity", "duplicate"]);
  });

  it("returns no options for a query without a match", () => {
    expect(filterSessionGames(games, "unbekanntes spiel")).toEqual([]);
  });
});
