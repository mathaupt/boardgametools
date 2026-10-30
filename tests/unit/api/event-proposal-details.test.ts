import { beforeEach, describe, expect, it, vi } from "vitest";

const { loggedRoute } = vi.hoisted(() => ({ loggedRoute: vi.fn((handler: unknown) => handler) }));
vi.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      body,
      status: init?.status ?? 200,
      headers: new Headers(init?.headers),
    }),
  },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: loggedRoute }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimitAsync: vi.fn().mockResolvedValue({ allowed: true, retryAfterMs: 0 }),
  rateLimitResponse: vi.fn(() => ({ status: 429, headers: new Headers() })),
}));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: vi.fn().mockResolvedValue({ userId: "user-1" }),
  handleApiError: vi.fn((error: Error & { statusCode?: number }) => ({
    status: error.statusCode ?? 500,
    body: { error: error.message },
    headers: new Headers(),
  })),
}));
vi.mock("@/lib/services/event-proposal.service", () => ({
  EventProposalService: { getGameDetail: vi.fn() },
}));

import { EventProposalService } from "@/lib/services/event-proposal.service";
import { checkRateLimitAsync } from "@/lib/rate-limit";
import { GET as privateGet } from "@/app/api/events/[id]/proposals/[proposalId]/game/route";
import { GET as publicGet } from "@/app/api/public/event/[token]/proposals/[proposalId]/game/route";
import { createMockRequest, createRouteContext } from "./helpers";

const detail = { proposalId: "proposal-1", name: "Azul", description: null };

describe("event proposal game detail routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimitAsync).mockResolvedValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(EventProposalService.getGameDetail).mockResolvedValue(detail as never);
  });

  it("requires a session and marks private detail as non-cacheable", async () => {
    const response = await (privateGet as Function)(
      createMockRequest("GET", "http://localhost/api/events/event-1/proposals/proposal-1/game"),
      createRouteContext({ id: "event-1", proposalId: "proposal-1" }),
    );

    expect(EventProposalService.getGameDetail).toHaveBeenCalledWith(
      { kind: "private", eventId: "event-1", userId: "user-1" }, "proposal-1",
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });

  it("uses a token-scoped public request and a separate rate-limit prefix", async () => {
    const response = await (publicGet as Function)(
      createMockRequest("GET", "http://localhost/api/public/event/share-token/proposals/proposal-1/game"),
      createRouteContext({ token: "share-token", proposalId: "proposal-1" }),
    );

    expect(EventProposalService.getGameDetail).toHaveBeenCalledWith(
      { kind: "public", token: "share-token" }, "proposal-1",
    );
    expect(checkRateLimitAsync).toHaveBeenCalledWith("public-event-proposal-detail:127.0.0.1", 60, 60_000);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
  });
});
