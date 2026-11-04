import { describe, expect, it } from "vitest";
import { getSeriesEntryIdentity, hasSeriesEntryIdentity } from "@/lib/series/entry-identity";

describe("Serieneintragsidentität", () => {
  it("unterscheidet Sammlungsbezug und temporäre BGG-Identität", () => {
    expect(getSeriesEntryIdentity({ gameId: "game-1", bggId: "42" })).toBe("collection:game-1");
    expect(getSeriesEntryIdentity({ gameId: null, bggId: "42" })).toBe("bgg:42");
  });

  it("erkennt dieselbe BGG-Version auch nach zwischenzeitlichem Sammlungsimport als Duplikat", () => {
    const existing = [{ gameId: null, bggId: "42" }];
    expect(hasSeriesEntryIdentity(existing, { gameId: "game-2", bggId: "42" })).toBe(true);
  });
});
