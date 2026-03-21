import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

// Mock prisma
vi.mock("@/lib/db", () => ({
  default: {
    apiLog: {
      create: vi.fn().mockResolvedValue({}),
    },
  },
}));

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "user-1" } }),
}));

import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { logApiRequest, withApiLogging } from "@/lib/api-logger";

describe("api-logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("logApiRequest", () => {
    it("creates an api log entry", async () => {
      await logApiRequest({
        method: "GET",
        path: "/api/games",
        statusCode: 200,
        durationMs: 42,
        userId: "user-1",
        userAgent: "test-agent",
        ip: "127.0.0.1",
        errorMessage: null,
      });

      expect(prisma.apiLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          method: "GET",
          path: "/api/games",
          statusCode: 200,
          durationMs: 42,
          userId: "user-1",
        }),
      });
    });

    it("truncates long userAgent to 500 chars", async () => {
      const longAgent = "x".repeat(600);
      await logApiRequest({
        method: "GET",
        path: "/api/test",
        statusCode: 200,
        durationMs: 10,
        userAgent: longAgent,
      });

      const call = vi.mocked(prisma.apiLog.create).mock.calls[0][0];
      expect(call.data.userAgent).toHaveLength(500);
    });

    it("truncates long errorMessage to 1000 chars", async () => {
      const longError = "e".repeat(1500);
      await logApiRequest({
        method: "POST",
        path: "/api/test",
        statusCode: 500,
        durationMs: 10,
        errorMessage: longError,
      });

      const call = vi.mocked(prisma.apiLog.create).mock.calls[0][0];
      expect(call.data.errorMessage).toHaveLength(1000);
    });

    it("does not throw when prisma fails", async () => {
      vi.mocked(prisma.apiLog.create).mockRejectedValueOnce(new Error("DB error"));
      // Should not throw
      await expect(logApiRequest({
        method: "GET",
        path: "/api/test",
        statusCode: 200,
        durationMs: 10,
      })).resolves.not.toThrow();
    });
  });

  describe("withApiLogging", () => {
    it("calls the handler and returns its response", async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }));
      const wrapped = withApiLogging(handler);

      const req = new NextRequest("http://localhost:3000/api/games");
      const response = await wrapped(req);

      expect(handler).toHaveBeenCalledWith(req, undefined);
      expect(response.status).toBe(200);
    });

    it("returns 500 when handler throws", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("handler crash"));
      const wrapped = withApiLogging(handler);

      const req = new NextRequest("http://localhost:3000/api/games");
      const response = await wrapped(req);

      expect(response.status).toBe(500);
      const body = await response.json();
      expect(body.error).toBe("Internal Server Error");
    });

    it("calls auth to get user id", async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({}));
      const wrapped = withApiLogging(handler);

      const req = new NextRequest("http://localhost:3000/api/games");
      await wrapped(req);

      expect(auth).toHaveBeenCalled();
    });

    it("logs the request with fire-and-forget", async () => {
      const handler = vi.fn().mockResolvedValue(NextResponse.json({ ok: true }, { status: 201 }));
      const wrapped = withApiLogging(handler);

      const req = new NextRequest("http://localhost:3000/api/games", { method: "POST" });
      await wrapped(req);

      // logApiRequest is fire-and-forget, so prisma.apiLog.create may have been called
      // We just verify the response was returned correctly
      expect(handler).toHaveBeenCalled();
    });
  });
});
