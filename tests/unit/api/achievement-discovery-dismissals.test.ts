import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ requireAuth: vi.fn(), dismiss: vi.fn(), apiError: vi.fn(), json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) }));
vi.mock("next/server", () => ({ NextResponse: { json: mocks.json } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.requireAuth, handleApiError: mocks.apiError }));
vi.mock("@/lib/services/achievement.service", () => ({ AchievementService: { dismissDiscoveryGame: mocks.dismiss } }));

import { POST } from "@/app/api/achievements/discovery-dismissals/route";

describe("POST /api/achievements/discovery-dismissals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAuth.mockResolvedValue({ userId: "owner-1" });
    mocks.dismiss.mockResolvedValue(undefined);
    mocks.apiError.mockImplementation((error: Error) => ({ body: { error: error.message }, status: 500 }));
  });

  it("dismisses a discovery item only for the authenticated owner", async () => {
    const request = new Request("http://localhost/api/achievements/discovery-dismissals", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: "game-1" }),
    });

    const result = await (POST as Function)(request);

    expect(mocks.dismiss).toHaveBeenCalledWith("owner-1", "game-1");
    expect(result).toEqual({ body: { success: true }, status: 200 });
  });

  it("rejects a missing or malformed game ID before calling the service", async () => {
    const request = new Request("http://localhost/api/achievements/discovery-dismissals", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: " " }),
    });

    const result = await (POST as Function)(request);

    expect(mocks.dismiss).not.toHaveBeenCalled();
    expect(result).toEqual({ body: { error: "Spiel-ID ist erforderlich." }, status: 400 });
  });
});
