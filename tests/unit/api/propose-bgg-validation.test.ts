import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) },
}));
vi.mock("@/lib/auth", () => ({ auth: vi.fn(async () => null) }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/db", () => ({ default: { guestParticipant: { findFirst: vi.fn() } } }));
vi.mock("@/lib/event-share", () => ({ resolveEventIdFromToken: vi.fn(async () => "event-1") }));
vi.mock("@/lib/validation", () => ({ validateString: vi.fn(() => null), firstError: vi.fn(() => null) }));
vi.mock("@/lib/bgg", () => ({ fetchBGGGame: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })) }));
vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error { constructor(public statusCode: number, message: string) { super(message); } },
  handleApiError: (error: Error & { statusCode?: number }) => ({ status: error.statusCode ?? 500, body: { error: error.message } }),
}));
vi.mock("@/lib/services/event-mutation.service", () => ({ withEventMutation: vi.fn() }));

import { fetchBGGGame } from "@/lib/bgg";
import { POST } from "@/app/api/public/event/[token]/propose-bgg/route";

describe("POST public BGG proposal validation", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(["13&query=collection", "not-a-number", "1234567890123"])("rejects unsafe BGG id %s before upstream access", async (bggId) => {
    const request = new Request("http://localhost/api/public/event/token/propose-bgg", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bggId, guestId: "guest-1" }),
    });
    const response = await (POST as Function)(request, { params: Promise.resolve({ token: "token" }) });
    expect(response.status).toBe(400);
    expect(fetchBGGGame).not.toHaveBeenCalled();
  });
});
