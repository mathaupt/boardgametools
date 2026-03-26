import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status ?? 200,
    })),
  },
}));

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ApiError, requireAuth, requireAdmin, handleApiError } from "@/lib/require-auth";

const mockAuth = vi.mocked(auth);

describe("require-auth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ApiError", () => {
    it("creates error with correct statusCode and message", () => {
      const error = new ApiError(404, "Not found");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Not found");
    });

    it('has name "ApiError"', () => {
      const error = new ApiError(400, "Bad request");
      expect(error.name).toBe("ApiError");
    });

    it("is instanceof Error", () => {
      const error = new ApiError(500, "Server error");
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe("requireAuth", () => {
    it("returns userId, role, name and email when session has full user", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1", role: "ADMIN", name: "Admin", email: "a@b.c" },
        expires: "",
      } as never);

      const result = await requireAuth();
      expect(result).toEqual({ userId: "user-1", role: "ADMIN", name: "Admin", email: "a@b.c" });
    });

    it('returns role "USER" and null name/email when session.user has no extras', async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-2" },
        expires: "",
      } as never);

      const result = await requireAuth();
      expect(result).toEqual({ userId: "user-2", role: "USER", name: null, email: null });
    });

    it("throws ApiError(401) when session is null", async () => {
      mockAuth.mockResolvedValue(null as never);
      await expect(requireAuth()).rejects.toThrow(ApiError);
      await expect(requireAuth()).rejects.toMatchObject({ statusCode: 401, message: "Unauthorized" });
    });

    it("throws ApiError(401) when session.user is null", async () => {
      mockAuth.mockResolvedValue({ user: undefined, expires: "" } as never);
      await expect(requireAuth()).rejects.toThrow(ApiError);
      await expect(requireAuth()).rejects.toMatchObject({ statusCode: 401 });
    });

    it("throws ApiError(401) when session.user.id is undefined", async () => {
      mockAuth.mockResolvedValue({ user: { id: undefined }, expires: "" } as never);
      await expect(requireAuth()).rejects.toThrow(ApiError);
      await expect(requireAuth()).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("requireAdmin", () => {
    it('returns userId and role "ADMIN" for admin user', async () => {
      mockAuth.mockResolvedValue({
        user: { id: "admin-1", role: "ADMIN", name: "Boss", email: "boss@x.y" },
        expires: "",
      } as never);

      const result = await requireAdmin();
      expect(result).toMatchObject({ userId: "admin-1", role: "ADMIN" });
    });

    it("throws ApiError(403) when user has USER role", async () => {
      mockAuth.mockResolvedValue({
        user: { id: "user-1" },
        expires: "",
      } as never);

      await expect(requireAdmin()).rejects.toThrow(ApiError);
      await expect(requireAdmin()).rejects.toMatchObject({ statusCode: 403, message: "Forbidden" });
    });

    it("throws ApiError(401) when not authenticated", async () => {
      mockAuth.mockResolvedValue(null as never);
      await expect(requireAdmin()).rejects.toThrow(ApiError);
      await expect(requireAdmin()).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("handleApiError", () => {
    it("returns JSON response with correct status for ApiError", () => {
      const error = new ApiError(422, "Validation failed");
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Validation failed" },
        { status: 422 },
      );
      expect(response).toEqual(expect.objectContaining({ status: 422 }));
    });

    it("returns 500 response for unknown errors", () => {
      const error = new TypeError("something broke");
      const response = handleApiError(error);

      expect(NextResponse.json).toHaveBeenCalledWith(
        { error: "Internal server error" },
        { status: 500 },
      );
      expect(response).toEqual(expect.objectContaining({ status: 500 }));
    });

    it("logs unexpected errors via logger.error", async () => {
      const logger = vi.mocked((await import("@/lib/logger")).default);
      const error = new Error("unexpected");

      handleApiError(error);

      expect(logger.error).toHaveBeenCalledWith({ err: error }, "Unexpected error");
    });
  });
});
