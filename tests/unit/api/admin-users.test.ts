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

vi.mock("@/lib/require-auth", () => {
  class ApiError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string) {
      super(message);
      this.statusCode = statusCode;
    }
  }
  return {
    requireAdmin: vi.fn(),
    handleApiError: vi.fn((err: unknown) => ({
      body: { error: (err as Error)?.message || "Internal server error" },
      status: (err as { statusCode?: number })?.statusCode || 500,
    })),
    ApiError,
  };
});

vi.mock("@/lib/db", () => ({
  default: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock("bcryptjs", () => ({ hash: vi.fn(async () => "hashed-pw") }));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

vi.mock("@/lib/error-messages", () => ({
  Errors: {
    MISSING_REQUIRED_FIELDS: "Pflichtfelder fehlen",
    PASSWORD_MIN_LENGTH: "Passwort muss mindestens 8 Zeichen lang sein",
    USER_ALREADY_EXISTS: "Benutzer existiert bereits",
  },
}));

import { requireAdmin, handleApiError, ApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { firstError } from "@/lib/validation";
import { POST } from "@/app/api/admin/users/route";
import { createMockRequest, parseResponse } from "./helpers";

describe("API /api/admin/users", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
  });

  it("creates a new user when admin", async () => {
    const created = { id: "new-1", email: "new@example.com", name: "New", role: "USER", isActive: true, createdAt: new Date() };
    vi.mocked(prisma.user.create).mockResolvedValue(created as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/admin/users", {
      body: { name: "New", email: "new@example.com", password: "securePass123" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(201);
    expect(requireAdmin).toHaveBeenCalledTimes(1);
    expect(prisma.user.create).toHaveBeenCalled();
  });

  it("returns 400 on validation error", async () => {
    vi.mocked(firstError).mockReturnValueOnce("name ist erforderlich" as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/admin/users", {
      body: { name: "", email: "a@b.c", password: "securePass123" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 400 on invalid role", async () => {
    const req = createMockRequest("POST", "http://localhost:3000/api/admin/users", {
      body: { name: "Test", email: "a@b.c", password: "securePass123", role: "SUPERADMIN" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(400);
  });

  it("returns 409 when user already exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/admin/users", {
      body: { name: "Existing", email: "existing@example.com", password: "securePass123" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(409);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 403 when non-admin", async () => {
    vi.mocked(requireAdmin).mockRejectedValue(
      new (ApiError as unknown as new (s: number, m: string) => Error)(403, "Forbidden")
    );

    const req = createMockRequest("POST", "http://localhost:3000/api/admin/users", {
      body: { name: "Test", email: "a@b.c", password: "securePass123" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(403);
    expect(handleApiError).toHaveBeenCalledTimes(1);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
