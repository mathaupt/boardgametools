import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inviteFind: vi.fn(),
  inviteUpdate: vi.fn(),
  decrypt: vi.fn(),
  sendResponse: vi.fn(),
  invalidate: vi.fn(),
  rateLimit: vi.fn(),
  rateLimitResponse: vi.fn(() => Response.json({ error: "limited" }, { status: 429 })),
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/db", () => ({ default: { eventInvite: { findUnique: mocks.inviteFind, update: mocks.inviteUpdate } } }));
vi.mock("@/lib/crypto", () => ({ decryptId: mocks.decrypt }));
vi.mock("@/lib/mailer", () => ({ sendInviteResponseEmail: mocks.sendResponse }));
vi.mock("@/lib/cache", () => ({ invalidateTag: mocks.invalidate }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: vi.fn(async () => "https://example.test") }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rateLimit, rateLimitResponse: mocks.rateLimitResponse }));

import { GET, POST } from "@/app/api/public/invite/[token]/respond/route";

const context = { params: Promise.resolve({ token: "safe-token" }) };
const request = (method: string, body?: unknown, headers: Record<string, string> = {}) => new Request("http://localhost/api/public/invite/safe-token/respond", {
  method,
  headers: { "x-forwarded-for": "192.0.2.1", ...(body === undefined ? {} : { "content-type": "application/json" }), ...headers },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
}) as never;

const invite = (overrides: Record<string, unknown> = {}) => ({
  id: "invite-1", status: "pending", email: "guest@example.test", userId: null, respondedAt: null,
  event: {
    id: "event-1", title: "Spielabend", description: null, eventDate: new Date("2026-12-01"),
    location: "Berlin", status: "planning", createdById: "creator", createdBy: { email: "creator@example.test", name: "Host" },
    _count: { invites: 2 },
    proposals: [{ game: null, bggName: "Catan", bggImageUrl: "https://img.test/catan.jpg", bggMinPlayers: 3, bggMaxPlayers: 4, _count: { votes: 2, guestVotes: 1 } }],
  },
  ...overrides,
});

describe("public invite routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.decrypt.mockReturnValue("invite-1");
    mocks.rateLimit.mockReturnValue({ allowed: true, retryAfterMs: 0 });
    mocks.inviteFind.mockResolvedValue(invite());
    mocks.inviteUpdate.mockResolvedValue({ status: "accepted" });
    mocks.sendResponse.mockResolvedValue(undefined);
  });

  it("rejects malformed tokens and missing invite records", async () => {
    mocks.decrypt.mockImplementationOnce(() => { throw new Error("bad token"); });
    expect((await GET(request("GET"), context)).status).toBe(400);
    mocks.inviteFind.mockResolvedValue(null);
    expect((await GET(request("GET"), context)).status).toBe(404);
  });

  it("returns only the public invite view and falls back to BGG proposal data", async () => {
    const response = await GET(request("GET"), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      id: "invite-1", status: "pending", email: "guest@example.test", respondedAt: null,
      event: {
        title: "Spielabend", description: null, eventDate: "2026-12-01T00:00:00.000Z", location: "Berlin", status: "planning",
        organizer: "Host", inviteCount: 2,
        proposals: [{ gameName: "Catan", imageUrl: "https://img.test/catan.jpg", minPlayers: 3, maxPlayers: 4, totalVotes: 3 }],
      },
    });
  });

  it("rejects rate-limited, malformed, and invalid responses before database access", async () => {
    mocks.rateLimit.mockReturnValueOnce({ allowed: false, retryAfterMs: 1000 });
    expect((await POST(request("POST", { status: "accepted" }), context)).status).toBe(429);

    mocks.decrypt.mockImplementationOnce(() => { throw new Error("bad token"); });
    expect((await POST(request("POST", { status: "accepted" }), context)).status).toBe(400);
    expect((await POST(request("POST", { status: "accepted", name: "x".repeat(101) }), context)).status).toBe(400);
    expect((await POST(request("POST", { status: "unknown" }), context)).status).toBe(400);
    expect(mocks.inviteFind).not.toHaveBeenCalled();
  });

  it("rejects missing and already answered invitations", async () => {
    mocks.inviteFind.mockResolvedValueOnce(null);
    expect((await POST(request("POST", { status: "accepted" }), context)).status).toBe(404);
    mocks.inviteFind.mockResolvedValueOnce(invite({ status: "declined" }));
    const response = await POST(request("POST", { status: "accepted" }), context);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ currentStatus: "declined" });
    expect(mocks.inviteUpdate).not.toHaveBeenCalled();
  });

  it("updates a response, notifies the organizer, and invalidates only registered-user caches", async () => {
    mocks.inviteFind.mockResolvedValue(invite({ userId: "user-2" }));
    mocks.sendResponse.mockRejectedValue(new Error("mail offline"));
    const response = await POST(request("POST", { status: "accepted", name: "Ada" }), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ message: "Einladung angenommen!", status: "accepted" });
    expect(mocks.inviteUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { status: "accepted", respondedAt: expect.any(Date) } }));
    expect(mocks.sendResponse).toHaveBeenCalledWith(expect.objectContaining({ responderName: "Ada", eventUrl: "https://example.test/dashboard/events/event-1" }));
    expect(mocks.invalidate).toHaveBeenCalledTimes(3);
  });

  it("uses a guest fallback name and returns a generic error if persistence fails", async () => {
    mocks.inviteFind.mockResolvedValue(invite({ email: null }));
    mocks.inviteUpdate.mockRejectedValue(new Error("database details"));
    const response = await POST(request("POST", { status: "declined", name: "" }), context);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("database details");
    expect(mocks.sendResponse).not.toHaveBeenCalled();
  });
});
