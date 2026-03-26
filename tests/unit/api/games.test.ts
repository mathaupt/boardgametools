import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: {
    json: vi.fn(
      (body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
      })
    ),
  },
}));

vi.mock("@/lib/api-logger", () => ({
  withApiLogging: vi.fn((handler: unknown) => handler),
}));

vi.mock("@/lib/require-auth", () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
      this.name = "ApiError";
    }
  }
  return {
    requireAuth: vi.fn(),
    handleApiError: vi.fn((err: unknown) => ({
      body: { error: (err as Error)?.message || "Internal server error" },
      status: (err as { statusCode?: number })?.statusCode || 500,
    })),
    ApiError,
  };
});

vi.mock("@/lib/services", () => ({
  GameService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/error-messages", () => ({
  Errors: {
    INTERNAL_SERVER_ERROR: "Interner Serverfehler",
  },
}));

import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";
import { GET, POST } from "@/app/api/games/route";
import { createMockRequest, parseResponse } from "./helpers";

const USER_ID = "user-123";

describe("API /api/games", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAuth).mockResolvedValue({
      userId: USER_ID,
      role: "USER",
      name: "Test User",
      email: "test@example.com",
    });
  });

  describe("GET", () => {
    it("returns games list for authenticated user", async () => {
      const games = [{ id: "game-1", name: "Catan" }, { id: "game-2", name: "Wingspan" }];
      vi.mocked(GameService.list).mockResolvedValue(games as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/games");
      const res = await (GET as Function)(req);
      const { status, body } = parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(games);
      expect(requireAuth).toHaveBeenCalledTimes(1);
    });

    it("passes pagination params from query string", async () => {
      vi.mocked(GameService.list).mockResolvedValue([] as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/games", {
        searchParams: { page: "2", limit: "10" },
      });
      await (GET as Function)(req);

      expect(GameService.list).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ page: 2, limit: 10 }));
    });

    it("caps limit at 100", async () => {
      vi.mocked(GameService.list).mockResolvedValue([] as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/games", {
        searchParams: { limit: "500" },
      });
      await (GET as Function)(req);

      expect(GameService.list).toHaveBeenCalledWith(USER_ID, expect.objectContaining({ limit: 100 }));
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized")
      );

      const req = createMockRequest("GET", "http://localhost:3000/api/games");
      const res = await (GET as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(401);
      expect(handleApiError).toHaveBeenCalledTimes(1);
    });
  });

  describe("POST", () => {
    it("creates a game and returns 201", async () => {
      const newGame = { id: "game-new", name: "Catan", ownerId: USER_ID };
      vi.mocked(GameService.create).mockResolvedValue(newGame as never);

      const req = createMockRequest("POST", "http://localhost:3000/api/games", {
        body: { name: "Catan", tagNames: ["Strategy"] },
      });
      const res = await (POST as Function)(req);
      const { status, body } = parseResponse(res);

      expect(status).toBe(201);
      expect(body).toEqual(newGame);
    });

    it("forwards service validation errors via handleApiError", async () => {
      const validationError = new (ApiError as unknown as new (s: number, m: string) => Error & { statusCode: number })(400, "Name is required");
      vi.mocked(GameService.create).mockRejectedValue(validationError);

      const req = createMockRequest("POST", "http://localhost:3000/api/games", { body: {} });
      const res = await (POST as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(400);
      expect(handleApiError).toHaveBeenCalledWith(validationError);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized")
      );

      const req = createMockRequest("POST", "http://localhost:3000/api/games", { body: { name: "Catan" } });
      const res = await (POST as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(401);
      expect(GameService.create).not.toHaveBeenCalled();
    });
  });
});
