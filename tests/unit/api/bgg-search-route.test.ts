import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  searchBGGGames: vi.fn(),
}));

vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number; headers?: HeadersInit }) => ({ body, status: init?.status ?? 200, headers: init?.headers }) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.requireAuth }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: (request: unknown) => Promise<unknown>) => handler }));
vi.mock("@/lib/bgg", () => ({ BggSearchError: class BggSearchError extends Error { constructor(public readonly statusCode: number, message: string, public readonly retryAfterSeconds?: number) { super(message); this.name = "BggSearchError"; } }, searchBGGGames: mocks.searchBGGGames }));
vi.mock("@/lib/logger", () => ({ default: { error: vi.fn() } }));
vi.mock("@/lib/error-messages", () => ({ Errors: { QUERY_MIN_LENGTH: "Suchbegriff zu kurz", SEARCH_FAILED: "Suche fehlgeschlagen" } }));

import { GET } from "@/app/api/bgg/search/route";
import { BggSearchError } from "@/lib/bgg";

const request = (q: string) => ({ nextUrl: new URL(`http://localhost/api/bgg/search?q=${encodeURIComponent(q)}`) });

describe("GET /api/bgg/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "user-1" });
  });

  it("keeps a successful empty result as HTTP 200 with an empty array", async () => {
    mocks.searchBGGGames.mockResolvedValue([]);
    await expect((GET as Function)(request("unbekannt"))).resolves.toMatchObject({ status: 200, body: [] });
  });

  it("returns provider failures as errors instead of empty result arrays", async () => {
    mocks.searchBGGGames.mockRejectedValue(new BggSearchError(503, "BGG nicht erreichbar"));
    await expect((GET as Function)(request("Catan"))).resolves.toMatchObject({ status: 503, body: { error: "BGG nicht erreichbar" } });
  });

  it("returns a retry delay when BGG rate limits the search", async () => {
    mocks.searchBGGGames.mockRejectedValue(new BggSearchError(429, "Bitte später erneut versuchen", 10));
    await expect((GET as Function)(request("Catan"))).resolves.toMatchObject({ status: 429, headers: { "Retry-After": "10" } });
  });
});
