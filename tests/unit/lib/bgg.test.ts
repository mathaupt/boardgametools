import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the module before importing
const mockSearchBGGGames = vi.fn();
const mockFetchBGGGame = vi.fn();

vi.mock("@/lib/bgg", () => ({
  searchBGGGames: mockSearchBGGGames,
  fetchBGGGame: mockFetchBGGGame,
}));

import { searchBGGGames, fetchBGGGame } from "@/lib/bgg";

// Mock environment variables
const originalEnv = process.env;

describe("BGG API", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
    // Clear require cache to reload env vars
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
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

      await searchBGGGames("catan");

      // Both calls should include the token
      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(mockFetch.mock.calls[0][1].headers.Authorization).toBe("Bearer test-token-123");
      expect(mockFetch.mock.calls[1][1].headers.Authorization).toBe("Bearer test-token-123");
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
