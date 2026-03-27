import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/logger", () => ({
  default: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import {
  decodeHtmlEntities,
  parseXMLValue,
  parseXMLAttribute,
  parseXMLAttributeValue,
  parseAllXMLAttributeValues,
  parseBGGSearchResponse,
  parseBGGCollectionResponse,
} from "@/lib/bgg-xml";

describe("bgg-xml", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // decodeHtmlEntities
  // ---------------------------------------------------------------------------
  describe("decodeHtmlEntities", () => {
    it("returns null for null input", () => {
      expect(decodeHtmlEntities(null)).toBeNull();
    });

    it("returns null for undefined input", () => {
      expect(decodeHtmlEntities(undefined)).toBeNull();
    });

    it("decodes &amp; to &", () => {
      expect(decodeHtmlEntities("A &amp; B")).toBe("A & B");
    });

    it("decodes &lt; to <", () => {
      expect(decodeHtmlEntities("1 &lt; 2")).toBe("1 < 2");
    });

    it("decodes &gt; to >", () => {
      expect(decodeHtmlEntities("2 &gt; 1")).toBe("2 > 1");
    });

    it("decodes &quot; to double-quote", () => {
      expect(decodeHtmlEntities("&quot;hello&quot;")).toBe('"hello"');
    });

    it("decodes &#39; to single-quote", () => {
      expect(decodeHtmlEntities("it&#39;s")).toBe("it's");
    });

    it("decodes &#10; to newline", () => {
      expect(decodeHtmlEntities("line1&#10;line2")).toBe("line1\nline2");
    });

    it("decodes &nbsp; to space", () => {
      expect(decodeHtmlEntities("a&nbsp;b")).toBe("a b");
    });

    it("returns plain text unchanged", () => {
      expect(decodeHtmlEntities("Hello World")).toBe("Hello World");
    });
  });

  // ---------------------------------------------------------------------------
  // parseXMLValue
  // ---------------------------------------------------------------------------
  describe("parseXMLValue", () => {
    it("extracts text from a simple tag", () => {
      expect(parseXMLValue("<name>Catan</name>", "name")).toBe("Catan");
    });

    it("returns null when tag is missing", () => {
      expect(parseXMLValue("<other>value</other>", "name")).toBeNull();
    });

    it("extracts text from a tag with attributes", () => {
      expect(parseXMLValue('<name type="primary">Catan</name>', "name")).toBe("Catan");
    });
  });

  // ---------------------------------------------------------------------------
  // parseXMLAttribute
  // ---------------------------------------------------------------------------
  describe("parseXMLAttribute", () => {
    it("extracts an id attribute", () => {
      expect(parseXMLAttribute('<item type="boardgame" id="123">', "item", "id")).toBe("123");
    });

    it("returns null when the attribute is missing", () => {
      expect(parseXMLAttribute('<item type="boardgame">', "item", "id")).toBeNull();
    });

    it("returns null when the tag is missing", () => {
      expect(parseXMLAttribute("<other/>", "item", "id")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // parseXMLAttributeValue
  // ---------------------------------------------------------------------------
  describe("parseXMLAttributeValue", () => {
    it("extracts the value attribute", () => {
      expect(parseXMLAttributeValue('<yearpublished value="2020"/>', "yearpublished")).toBe("2020");
    });

    it("returns null when value attribute is missing", () => {
      expect(parseXMLAttributeValue("<yearpublished/>", "yearpublished")).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // parseAllXMLAttributeValues
  // ---------------------------------------------------------------------------
  describe("parseAllXMLAttributeValues", () => {
    it("extracts multiple values", () => {
      const xml = '<link value="Strategy"/><link value="Family"/>';
      expect(parseAllXMLAttributeValues(xml, "link")).toEqual(["Strategy", "Family"]);
    });

    it("filters by type attribute", () => {
      const xml = '<link type="boardgamecategory" value="Strategy"/><link type="boardgamemechanic" value="Dice Rolling"/>';
      expect(parseAllXMLAttributeValues(xml, "link", "boardgamecategory")).toEqual(["Strategy"]);
    });

    it("returns empty array when no matches", () => {
      expect(parseAllXMLAttributeValues("<nope/>", "link")).toEqual([]);
    });

    it("decodes HTML entities in values", () => {
      const xml = '<link value="Rock &amp; Roll"/>';
      expect(parseAllXMLAttributeValues(xml, "link")).toEqual(["Rock & Roll"]);
    });
  });

  // ---------------------------------------------------------------------------
  // parseBGGSearchResponse
  // ---------------------------------------------------------------------------
  describe("parseBGGSearchResponse", () => {
    const wrapItems = (inner: string) => `<items>${inner}</items>`;

    const makeItem = (
      id: string,
      name: string,
      opts?: { year?: string; nameType?: string }
    ) => {
      const nameType = opts?.nameType ?? "primary";
      const yearTag = opts?.year
        ? `<yearpublished value="${opts.year}"/>`
        : "";
      return `<item type="boardgame" id="${id}"><name type="${nameType}" value="${name}"/>${yearTag}</item>`;
    };

    it("parses a single game", () => {
      const xml = wrapItems(makeItem("123", "Catan", { year: "1995" }));
      const results = parseBGGSearchResponse(xml);
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({ bggId: "123", name: "Catan", yearPublished: 1995 });
    });

    it("parses multiple games", () => {
      const xml = wrapItems(
        makeItem("1", "Catan", { year: "1995" }) + makeItem("2", "Wingspan", { year: "2019" })
      );
      const results = parseBGGSearchResponse(xml);
      expect(results).toHaveLength(2);
    });

    it("returns empty array for empty response", () => {
      expect(parseBGGSearchResponse(wrapItems(""))).toEqual([]);
    });

    it("sets yearPublished to null when missing", () => {
      const xml = wrapItems(makeItem("1", "Catan"));
      const results = parseBGGSearchResponse(xml);
      expect(results[0].yearPublished).toBeNull();
    });

    it("skips items without a primary name", () => {
      const xml = wrapItems(makeItem("1", "Alt Name", { nameType: "alternate" }));
      expect(parseBGGSearchResponse(xml)).toHaveLength(0);
    });

    it("limits results to 20", () => {
      const items = Array.from({ length: 25 }, (_, i) =>
        makeItem(String(i), `Game ${i}`, { year: "2020" })
      ).join("");
      const results = parseBGGSearchResponse(wrapItems(items));
      expect(results).toHaveLength(20);
    });

    it("decodes HTML entities in game names", () => {
      const xml = wrapItems(makeItem("1", "Rock &amp; Roll", { year: "2020" }));
      const results = parseBGGSearchResponse(xml);
      expect(results[0].name).toBe("Rock & Roll");
    });
  });

  // ---------------------------------------------------------------------------
  // parseBGGCollectionResponse
  // ---------------------------------------------------------------------------
  describe("parseBGGCollectionResponse", () => {
    const makeCollectionItem = (opts?: {
      bggId?: string;
      name?: string;
      year?: string;
      thumbnail?: string;
      image?: string;
      minPlayers?: string;
      maxPlayers?: string;
      playTime?: string;
      rating?: string;
      numPlays?: string;
    }) => {
      const o = {
        bggId: "100",
        name: "Catan",
        year: "1995",
        thumbnail: "https://example.com/thumb.jpg",
        image: "https://example.com/image.jpg",
        minPlayers: "2",
        maxPlayers: "4",
        playTime: "90",
        rating: "7.5",
        numPlays: "3",
        ...opts,
      };

      const parts = [
        o.name ? `<name sortindex="1">${o.name}</name>` : "",
        o.year ? `<yearpublished>${o.year}</yearpublished>` : "",
        o.thumbnail ? `<thumbnail>${o.thumbnail}</thumbnail>` : "",
        o.image ? `<image>${o.image}</image>` : "",
        o.minPlayers ? `<minplayers>${o.minPlayers}</minplayers>` : "",
        o.maxPlayers ? `<maxplayers>${o.maxPlayers}</maxplayers>` : "",
        o.playTime ? `<playingtime>${o.playTime}</playingtime>` : "",
        o.rating ? `<rating value="${o.rating}"/>` : "",
        o.numPlays ? `<numplays>${o.numPlays}</numplays>` : "",
      ];

      return `<item objectid="${o.bggId}">${parts.join("")}</item>`;
    };

    it("parses a full collection item with all fields", () => {
      const xml = makeCollectionItem();
      const results = parseBGGCollectionResponse(xml);

      expect(results).toHaveLength(1);
      expect(results[0]).toEqual({
        bggId: "100",
        name: "Catan",
        yearPublished: 1995,
        thumbnailUrl: "https://example.com/thumb.jpg",
        imageUrl: "https://example.com/image.jpg",
        minPlayers: 2,
        maxPlayers: 4,
        playTimeMinutes: 90,
        rating: 7.5,
        numPlays: 3,
      });
    });

    it("handles missing optional fields gracefully", () => {
      const xml = makeCollectionItem({
        year: "",
        thumbnail: "",
        image: "",
        minPlayers: "",
        maxPlayers: "",
        playTime: "",
        rating: "",
        numPlays: "",
      });
      const results = parseBGGCollectionResponse(xml);
      expect(results).toHaveLength(1);
      expect(results[0].yearPublished).toBeNull();
      expect(results[0].thumbnailUrl).toBeNull();
      expect(results[0].imageUrl).toBeNull();
      expect(results[0].minPlayers).toBeNull();
      expect(results[0].maxPlayers).toBeNull();
      expect(results[0].playTimeMinutes).toBeNull();
      expect(results[0].rating).toBeNull();
      expect(results[0].numPlays).toBe(0);
    });

    it("returns empty array for empty XML", () => {
      expect(parseBGGCollectionResponse("<items></items>")).toEqual([]);
    });

    it("skips items without a name", () => {
      const xml = makeCollectionItem({ name: "" });
      expect(parseBGGCollectionResponse(xml)).toHaveLength(0);
    });

    it("rounds rating to one decimal place", () => {
      const xml = makeCollectionItem({ rating: "7.456" });
      const results = parseBGGCollectionResponse(xml);
      expect(results[0].rating).toBe(7.5);
    });

    it("returns null rating for N/A value", () => {
      const xml = makeCollectionItem({ rating: "N/A" });
      const results = parseBGGCollectionResponse(xml);
      expect(results[0].rating).toBeNull();
    });
  });
});
