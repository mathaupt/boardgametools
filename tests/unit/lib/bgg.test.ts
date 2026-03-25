import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const originalEnv = { ...process.env };
const originalFetch = global.fetch;

async function loadBGGLib() {
  vi.resetModules();
  return import("@/lib/bgg");
}

describe("BGG API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    global.fetch = originalFetch;
  });

  describe("searchBGGGames", () => {
    it("includes BGG_AUTH_TOKEN in headers when available", async () => {
      process.env.BGG_AUTH_TOKEN = "test-token-123";

      // Mock fetch to track headers
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items></items>`),
      });

      const { searchBGGGames } = await loadBGGLib();

      await searchBGGGames("catan");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("search?query=catan&type=boardgame"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-token-123",
            "Accept": "application/xml",
            "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
          }),
        })
      );
    });

    it("works without BGG_AUTH_TOKEN", async () => {
      delete process.env.BGG_AUTH_TOKEN;

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items></items>`),
      });

      const { searchBGGGames } = await loadBGGLib();

      await searchBGGGames("catan");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept": "application/xml",
            "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
          }),
        })
      );

      // Ensure no Authorization header
      const call = mockFetch.mock.calls[0];
      expect(call[1].headers).not.toHaveProperty("Authorization");
    });

    it("handles rate limiting with token", async () => {
      process.env.BGG_AUTH_TOKEN = "test-token-123";

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const setTimeoutSpy = vi
        .spyOn(global, "setTimeout")
        .mockImplementation(((cb: (...args: any[]) => void) => {
          cb();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as any);

      // First call returns 202 (processing)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 202,
        text: () => Promise.resolve(""),
      });

      // Retry returns success
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items></items>`),
      });

      const { searchBGGGames } = await loadBGGLib();

      await searchBGGGames("catan");

      // Both calls should include the token
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token-123");
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer test-token-123");

      setTimeoutSpy.mockRestore();
    });
  });

  describe("fetchBGGGame", () => {
    it("includes BGG_AUTH_TOKEN in headers when available", async () => {
      process.env.BGG_AUTH_TOKEN = "test-token-123";

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items><item type="boardgame" id="13"><name type="primary" value="Catan"/></item></items>`),
      });

      const { fetchBGGGame } = await loadBGGLib();

      await fetchBGGGame("13");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("thing?id=13&stats=1"),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-token-123",
            "Accept": "application/xml",
          }),
        })
      );
    });

    it("works without BGG_AUTH_TOKEN", async () => {
      delete process.env.BGG_AUTH_TOKEN;

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items><item type="boardgame" id="13"><name type="primary" value="Catan"/></item></items>`),
      });

      const { fetchBGGGame } = await loadBGGLib();

      await fetchBGGGame("13");

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Accept": "application/xml",
          }),
        })
      );

      // Ensure no Authorization header
      const call = mockFetch.mock.calls[0];
      expect(call[1].headers).not.toHaveProperty("Authorization");
    });

    it("returns null on API error", async () => {
      process.env.BGG_AUTH_TOKEN = "test-token-123";

      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      const { fetchBGGGame } = await loadBGGLib();

      const result = await fetchBGGGame("999");

      expect(result).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            "Authorization": "Bearer test-token-123",
          }),
        })
      );
    });

    it("parses valid BGG XML into BGGGameData", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const xml = `<items><item type="boardgame" id="13">
        <name type="primary" value="Catan"/>
        <description>Trade &amp; build settlements on an island.</description>
        <yearpublished value="1995"/>
        <minplayers value="3"/>
        <maxplayers value="4"/>
        <playingtime value="90"/>
        <minplaytime value="60"/>
        <maxplaytime value="120"/>
        <image>https://example.com/catan.jpg</image>
        <thumbnail>https://example.com/catan_thumb.jpg</thumbnail>
        <statistics><ratings>
          <average value="7.2"/>
          <usersrated value="100000"/>
          <averageweight value="2.3"/>
        </ratings></statistics>
        <link type="boardgamecategory" value="Strategy"/>
        <link type="boardgamemechanic" value="Dice Rolling"/>
        <link type="boardgamedesigner" value="Klaus Teuber"/>
        <link type="boardgamepublisher" value="KOSMOS"/>
      </item></items>`;

      mockFetch.mockResolvedValueOnce({ ok: true, text: () => Promise.resolve(xml) });

      const { fetchBGGGame } = await loadBGGLib();
      const result = await fetchBGGGame("13");

      expect(result).not.toBeNull();
      expect(result!.bggId).toBe("13");
      expect(result!.name).toBe("Catan");
      expect(result!.description).toContain("Trade & build settlements");
      expect(result!.yearPublished).toBe(1995);
      expect(result!.minPlayers).toBe(3);
      expect(result!.maxPlayers).toBe(4);
      expect(result!.playTimeMinutes).toBe(90);
      expect(result!.minPlayTime).toBe(60);
      expect(result!.maxPlayTime).toBe(120);
      expect(result!.complexity).toBe(2.3);
      expect(result!.imageUrl).toBe("https://example.com/catan.jpg");
      expect(result!.thumbnailUrl).toBe("https://example.com/catan_thumb.jpg");
      expect(result!.rating).toBe(7.2);
      expect(result!.numRatings).toBe(100000);
      expect(result!.categories).toContain("Strategy");
      expect(result!.mechanics).toContain("Dice Rolling");
      expect(result!.designers).toContain("Klaus Teuber");
      expect(result!.publishers).toContain("KOSMOS");
    });

    it("returns null when no items found", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items total="0"></items>`),
      });
      const { fetchBGGGame } = await loadBGGLib();
      expect(await fetchBGGGame("99999")).toBeNull();
    });

    it("returns null when no primary name", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(`<items><item type="boardgame" id="1"><name type="alternate" value="Alt"/></item></items>`),
      });
      const { fetchBGGGame } = await loadBGGLib();
      expect(await fetchBGGGame("1")).toBeNull();
    });

    it("returns null on fetch exception", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockRejectedValueOnce(new Error("Network error"));
      const { fetchBGGGame } = await loadBGGLib();
      expect(await fetchBGGGame("13")).toBeNull();
    });
  });

  describe("fetchBGGCollection", () => {
    it("parses valid collection XML", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const xml = `<items totalitems="1">
        <item objecttype="thing" objectid="13" subtype="boardgame">
          <name sortindex="1">Catan</name>
          <yearpublished>1995</yearpublished>
          <thumbnail>https://example.com/thumb.jpg</thumbnail>
          <image>https://example.com/img.jpg</image>
          <stats minplayers="3" maxplayers="4" playingtime="90">
            <rating value="8.5"/>
          </stats>
          <numplays>5</numplays>
        </item>
      </items>`;

      mockFetch.mockResolvedValueOnce({ ok: true, status: 200, text: () => Promise.resolve(xml) });
      const { fetchBGGCollection } = await loadBGGLib();
      const result = await fetchBGGCollection("testuser");

      expect(result).toHaveLength(1);
      expect(result[0].bggId).toBe("13");
      expect(result[0].name).toBe("Catan");
      expect(result[0].yearPublished).toBe(1995);
      expect(result[0].numPlays).toBe(5);
      expect(result[0].rating).toBe(8.5);
    });

    it("throws on error response", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

      const { fetchBGGCollection } = await loadBGGLib();
      await expect(fetchBGGCollection("testuser")).rejects.toThrow("BGG API returned 500");
    });

    it("throws on BGG error in XML", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(`<errors><error><message>Invalid username</message></error></errors>`),
      });

      const { fetchBGGCollection } = await loadBGGLib();
      await expect(fetchBGGCollection("baduser")).rejects.toThrow("Invalid username");
    });

    it("retries on 202 and succeeds", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const setTimeoutSpy = vi
        .spyOn(global, "setTimeout")
        .mockImplementation(((cb: (...args: any[]) => void) => {
          cb();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as any);

      // First call 202, second call success
      mockFetch.mockResolvedValueOnce({ ok: false, status: 202 });
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        text: () => Promise.resolve(`<items totalitems="0"></items>`),
      });

      const { fetchBGGCollection } = await loadBGGLib();
      const result = await fetchBGGCollection("testuser");
      expect(result).toHaveLength(0);
      expect(mockFetch).toHaveBeenCalledTimes(2);

      setTimeoutSpy.mockRestore();
    });

    it("throws after 3 retries of 202", async () => {
      delete process.env.BGG_AUTH_TOKEN;
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const setTimeoutSpy = vi
        .spyOn(global, "setTimeout")
        .mockImplementation(((cb: (...args: any[]) => void) => {
          cb();
          return 0 as unknown as ReturnType<typeof setTimeout>;
        }) as any);

      mockFetch.mockResolvedValue({ ok: false, status: 202 });

      const { fetchBGGCollection } = await loadBGGLib();
      await expect(fetchBGGCollection("testuser")).rejects.toThrow("timed out");
      expect(mockFetch).toHaveBeenCalledTimes(3);

      setTimeoutSpy.mockRestore();
    });
  });
});
