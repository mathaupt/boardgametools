import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  guestFindFirst: vi.fn(),
  proposalFindFirst: vi.fn(),
  proposalCreate: vi.fn(),
  auth: vi.fn(),
  fetchBGGGame: vi.fn(),
}));

vi.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));
vi.mock("@/lib/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/db", () => ({ default: { guestParticipant: { findFirst: mocks.guestFindFirst } } }));
vi.mock("@/lib/event-share", () => ({ resolveEventIdFromToken: vi.fn(async () => "event-1") }));
vi.mock("@/lib/validation", () => ({ validateString: vi.fn(() => null), firstError: vi.fn(() => null) }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: mocks.fetchBGGGame }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })) }));
vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } },
  handleApiError: (error: Error & { statusCode?: number }) => ({ status: error.statusCode ?? 500, body: { error: error.message } }),
}));
vi.mock("@/lib/services/event-mutation.service", () => ({
  withEventMutation: vi.fn(async (_scope: unknown, _action: unknown, write: (context: unknown) => unknown) => write({
    eventId: "event-1",
    tx: {
      guestParticipant: { findFirst: mocks.guestFindFirst },
      gameProposal: { findFirst: mocks.proposalFindFirst, create: mocks.proposalCreate },
    },
  })),
}));

import { auth } from "@/lib/auth";
import { fetchBGGGame } from "@/lib/bgg";
import { withEventMutation } from "@/lib/services/event-mutation.service";
import { POST } from "@/app/api/public/event/[token]/propose-bgg/route";

describe("POST public BGG proposal validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(null as never);
    vi.mocked(fetchBGGGame).mockResolvedValue({ name: "Catan", imageUrl: null, minPlayers: 3, maxPlayers: 4, playTimeMinutes: 60 } as never);
    mocks.proposalFindFirst.mockResolvedValue(null);
    mocks.proposalCreate.mockResolvedValue({
      id: "proposal-1", bggId: "13", bggName: "Catan", bggImageUrl: null,
      bggMinPlayers: 3, bggMaxPlayers: 4, bggPlayTimeMinutes: 60,
      proposedBy: { id: "user-1", name: "Anna" }, guest: null,
      _count: { votes: 0, guestVotes: 0 }, game: null,
    });
  });

  it("uses the session as the sole proposal author despite a legacy guest id", async () => {
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-1", name: "Anna" }, expires: "" } as never);
    const request = new Request("http://localhost/api/public/event/token/propose-bgg", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bggId: "13", guestId: "old-guest-id" }),
    });
    await (POST as Function)(request, { params: Promise.resolve({ token: "token" }) });

    expect(mocks.guestFindFirst).not.toHaveBeenCalled();
    expect(withEventMutation).toHaveBeenCalledWith(
      { kind: "public", token: "token", userId: "user-1", guestId: undefined },
      "proposeGame",
      expect.any(Function),
    );
    expect(mocks.proposalCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ proposedById: "user-1", guestId: null }),
    }));
  });

  it("requires a guest or an authenticated account", async () => {
    const request = new Request("http://localhost/api/public/event/token/propose-bgg", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bggId: "13" }),
    });
    const response = await (POST as Function)(request, { params: Promise.resolve({ token: "token" }) });
    expect(response.status).toBe(401);
    expect(fetchBGGGame).not.toHaveBeenCalled();
  });

  it.each(["13&query=collection", "not-a-number", "1234567890123"])("rejects unsafe BGG id %s before upstream access", async (bggId) => {
    const request = new Request("http://localhost/api/public/event/token/propose-bgg", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bggId, guestId: "guest-1" }),
    });
    const response = await (POST as Function)(request, { params: Promise.resolve({ token: "token" }) });
    expect(response.status).toBe(400);
    expect(fetchBGGGame).not.toHaveBeenCalled();
  });
});
