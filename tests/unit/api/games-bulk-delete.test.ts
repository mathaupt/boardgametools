import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({
  requireAuth: vi.fn(async () => ({ userId: "owner-1" })),
  handleApiError: vi.fn((error: Error) => ({ body: { error: error.message }, status: 500 })),
}));
vi.mock("@/lib/services", () => ({
  GameService: { bulkDelete: vi.fn(), bulkDeleteAll: vi.fn() },
}));

import { GameService } from "@/lib/services";
import { DELETE } from "@/app/api/games/bulk-delete/route";
import { createMockRequest } from "./helpers";

describe("DELETE /api/games/bulk-delete", () => {
  beforeEach(() => vi.clearAllMocks());

  it("deletes all owned games server-side without requiring the current page IDs", async () => {
    vi.mocked(GameService.bulkDeleteAll).mockResolvedValue({ deleted: 30 } as never);
    const response = await (DELETE as Function)(createMockRequest("DELETE", "http://localhost/api/games/bulk-delete", { body: { all: true } }));

    expect(response).toEqual({ body: { deleted: 30 }, status: 200 });
    expect(GameService.bulkDeleteAll).toHaveBeenCalledWith("owner-1");
    expect(GameService.bulkDelete).not.toHaveBeenCalled();
  });
});
