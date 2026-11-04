import { describe, expect, it } from "vitest";
import { parseGameListQuery } from "@/lib/game-list-query";

describe("parseGameListQuery", () => {
  it("uses bounded defaults and parses a complete URL filter state", () => {
    expect(parseGameListQuery(new URLSearchParams("page=2&q=Catan&tag=strategy&players=4&complexity=3&sort=newest"))).toEqual({
      page: 2,
      limit: 24,
      search: "Catan",
      tagId: "strategy",
      players: 4,
      minComplexity: 3,
      sort: "newest",
    });
  });

  it("falls back safely for malformed page, player, complexity and sort values", () => {
    expect(parseGameListQuery(new URLSearchParams("page=-2&players=100&complexity=9&sort=ownerId&limit=1000"))).toMatchObject({
      page: 1,
      limit: 100,
      players: null,
      minComplexity: null,
      sort: "name_asc",
    });
  });

  it("bounds search input and ignores repeated query values", () => {
    const query = new URLSearchParams("q=first&q=second&tag=tag");
    expect(parseGameListQuery(query).search).toBe("first");
    expect(parseGameListQuery(new URLSearchParams(`q=${"x".repeat(500)}`)).search).toHaveLength(100);
  });
});
