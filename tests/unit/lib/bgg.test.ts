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
  });
});
