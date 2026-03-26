import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body, status: init?.status ?? 200,
    })),
  },
}));

vi.mock("@/lib/api-logger", () => ({ withApiLogging: vi.fn((handler: unknown) => handler) }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/event-share", () => ({ findPublicEventByToken: vi.fn() }));

vi.mock("@/lib/public-event", () => ({
  buildPublicEventInclude: vi.fn(() => ({ createdBy: true })),
  serializePublicEvent: vi.fn((event: { id: string; title: string }, userId: string | null) => ({
    id: event.id, title: event.title, currentUserId: userId,
  })),
}));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
  rateLimitResponse: vi.fn(() => ({ body: { error: "Too many" }, status: 429 })),
}));

vi.mock("@/lib/error-messages", () => ({
  Errors: { EVENT_NOT_FOUND: "Event nicht gefunden" },
}));

import { auth } from "@/lib/auth";
import { findPublicEventByToken } from "@/lib/event-share";
import { serializePublicEvent } from "@/lib/public-event";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { GET } from "@/app/api/public/event/[token]/route";
import { createMockRequest, createRouteContext, parseResponse } from "./helpers";

describe("API /api/public/event/[token]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(auth).mockResolvedValue(null as never);
  });

  it("returns event data for valid token", async () => {
    const event = { id: "event-1", title: "Game Night" };
    vi.mocked(findPublicEventByToken).mockResolvedValue(event as never);

    const req = createMockRequest("GET", "http://localhost:3000/api/public/event/abc123");
    const ctx = createRouteContext({ token: "abc123" });
    const res = await (GET as Function)(req, ctx);
    const { status, body } = parseResponse(res);

    expect(status).toBe(200);
    expect(body).toEqual({ id: "event-1", title: "Game Night", currentUserId: null });
    expect(serializePublicEvent).toHaveBeenCalledWith(event, null);
  });

  it("returns 404 when event not found", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue(null as never);

    const req = createMockRequest("GET", "http://localhost:3000/api/public/event/invalid");
    const ctx = createRouteContext({ token: "invalid" });
    const res = await (GET as Function)(req, ctx);
    const { status } = parseResponse(res);

    expect(status).toBe(404);
    expect(serializePublicEvent).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfterMs: 60000 });

    const req = createMockRequest("GET", "http://localhost:3000/api/public/event/abc123");
    const ctx = createRouteContext({ token: "abc123" });
    await (GET as Function)(req, ctx);

    expect(rateLimitResponse).toHaveBeenCalledWith(60000);
    expect(findPublicEventByToken).not.toHaveBeenCalled();
  });

  it("passes authenticated user id", async () => {
    vi.mocked(findPublicEventByToken).mockResolvedValue({ id: "e1", title: "Test" } as never);
    vi.mocked(auth).mockResolvedValue({ user: { id: "user-42" }, expires: "" } as never);

    const req = createMockRequest("GET", "http://localhost:3000/api/public/event/abc123");
    const ctx = createRouteContext({ token: "abc123" });
    await (GET as Function)(req, ctx);

    expect(serializePublicEvent).toHaveBeenCalledWith(expect.anything(), "user-42");
  });
});
