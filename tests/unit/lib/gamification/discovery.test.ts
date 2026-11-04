import { describe, expect, it } from "vitest";
import { buildCollectionDiscovery, type DiscoveryGame } from "@/lib/gamification/discovery";

const today = new Date("2026-11-04T12:00:00.000Z");
const game = (id: string, lastPlayedAt: Date | null): DiscoveryGame => ({ id, name: id, imageUrl: null, lastPlayedAt });

describe("buildCollectionDiscovery", () => {
  it("separates never played games from games last played at least a year ago", () => {
    const result = buildCollectionDiscovery([
      game("never", null),
      game("old", new Date("2025-11-04T11:59:59.999Z")),
      game("recent", new Date("2025-11-04T12:00:00.001Z")),
    ], [], today);

    expect(result.neverPlayed.map(({ id }) => id)).toEqual(["never"]);
    expect(result.longUnplayed.map(({ id }) => id)).toEqual(["old"]);
  });

  it("does not show dismissed suggestions or duplicate a never played game in the long-unplayed list", () => {
    const result = buildCollectionDiscovery([
      game("never", null),
      game("old", new Date("2024-01-01T00:00:00.000Z")),
    ], ["never"], today);

    expect(result.neverPlayed).toEqual([]);
    expect(result.longUnplayed.map(({ id }) => id)).toEqual(["old"]);
  });

  it("returns each category in a stable title order", () => {
    const result = buildCollectionDiscovery([
      { ...game("z", null), name: "Zug um Zug" },
      { ...game("a", null), name: "Azul" },
      { ...game("b", new Date("2020-01-01T00:00:00.000Z")), name: "Brass" },
      { ...game("c", new Date("2020-01-02T00:00:00.000Z")), name: "Cascadia" },
    ], [], today);

    expect(result.neverPlayed.map(({ id }) => id)).toEqual(["a", "z"]);
    expect(result.longUnplayed.map(({ id }) => id)).toEqual(["b", "c"]);
  });
});
