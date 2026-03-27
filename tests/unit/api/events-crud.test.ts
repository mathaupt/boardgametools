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

vi.mock("@/lib/services/event.service", () => ({
  EventService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("@/lib/error-messages", () => ({
  Errors: {
    INTERNAL_SERVER_ERROR: "Interner Serverfehler",
  },
}));

import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import { EventService } from "@/lib/services/event.service";
import { GET, POST } from "@/app/api/events/route";
import { createMockRequest, parseResponse } from "./helpers";

const USER_ID = "user-123";

describe("API /api/events", () => {
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
    it("returns events list for authenticated user", async () => {
      const events = [{ id: "evt-1", title: "Game Night" }];
      vi.mocked(EventService.list).mockResolvedValue(events as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/events");
      const res = await (GET as Function)(req);
      const { status, body } = parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(events);
      expect(requireAuth).toHaveBeenCalledTimes(1);
    });

    it("returns a single event when eventId is provided", async () => {
      const event = { id: "evt-1", title: "Game Night" };
      vi.mocked(EventService.getById).mockResolvedValue(event as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/events", {
        searchParams: { eventId: "evt-1" },
      });
      const res = await (GET as Function)(req);
      const { status, body } = parseResponse(res);

      expect(status).toBe(200);
      expect(body).toEqual(event);
      expect(EventService.getById).toHaveBeenCalledWith(USER_ID, "evt-1");
    });

    it("passes pagination params from query string", async () => {
      vi.mocked(EventService.list).mockResolvedValue([] as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/events", {
        searchParams: { page: "2", limit: "10" },
      });
      await (GET as Function)(req);

      expect(EventService.list).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ page: 2, limit: 10 })
      );
    });

    it("caps limit at 100", async () => {
      vi.mocked(EventService.list).mockResolvedValue([] as never);

      const req = createMockRequest("GET", "http://localhost:3000/api/events", {
        searchParams: { page: "1", limit: "500" },
      });
      await (GET as Function)(req);

      expect(EventService.list).toHaveBeenCalledWith(
        USER_ID,
        expect.objectContaining({ limit: 100 })
      );
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized")
      );

      const req = createMockRequest("GET", "http://localhost:3000/api/events");
      const res = await (GET as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(401);
      expect(handleApiError).toHaveBeenCalled();
    });

    it("handles service errors via handleApiError", async () => {
      const error = new Error("DB failure");
      vi.mocked(EventService.list).mockRejectedValue(error);

      const req = createMockRequest("GET", "http://localhost:3000/api/events");
      const res = await (GET as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(500);
      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  describe("POST", () => {
    it("creates an event and returns 201", async () => {
      const newEvent = { id: "evt-new", title: "Board Game Night", ownerId: USER_ID };
      vi.mocked(EventService.create).mockResolvedValue(newEvent as never);

      const req = createMockRequest("POST", "http://localhost:3000/api/events", {
        body: { title: "Board Game Night", date: "2025-01-01" },
      });
      const res = await (POST as Function)(req);
      const { status, body } = parseResponse(res);

      expect(status).toBe(201);
      expect(body).toEqual(newEvent);
    });

    it("forwards service validation errors via handleApiError", async () => {
      const validationError = new (ApiError as unknown as new (s: number, m: string) => Error & { statusCode: number })(
        400,
        "Title is required"
      );
      vi.mocked(EventService.create).mockRejectedValue(validationError);

      const req = createMockRequest("POST", "http://localhost:3000/api/events", { body: {} });
      const res = await (POST as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(400);
      expect(handleApiError).toHaveBeenCalledWith(validationError);
    });

    it("returns 401 when not authenticated", async () => {
      vi.mocked(requireAuth).mockRejectedValue(
        new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized")
      );

      const req = createMockRequest("POST", "http://localhost:3000/api/events", {
        body: { title: "Game Night" },
      });
      const res = await (POST as Function)(req);
      const { status } = parseResponse(res);

      expect(status).toBe(401);
      expect(handleApiError).toHaveBeenCalled();
      expect(EventService.create).not.toHaveBeenCalled();
    });
  });
});
