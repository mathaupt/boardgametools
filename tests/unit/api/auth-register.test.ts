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

vi.mock("@/lib/db", () => ({
  default: { user: { findUnique: vi.fn(), create: vi.fn() } },
}));

vi.mock("bcryptjs", () => ({ hash: vi.fn(async () => "hashed-pw") }));

vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(() => ({ allowed: true, retryAfterMs: 0 })),
  rateLimitResponse: vi.fn((ms: number) => ({ body: { error: "Too many" }, status: 429, headers: { "Retry-After": String(Math.ceil(ms / 1000)) } })),
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  validateEmail: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

vi.mock("@/lib/logger", () => ({ default: { error: vi.fn(), warn: vi.fn(), info: vi.fn(), debug: vi.fn() } }));

vi.mock("@/lib/error-messages", () => ({
  Errors: {
    USER_CREATED: "Benutzer erfolgreich erstellt",
    INTERNAL_SERVER_ERROR: "Interner Serverfehler",
  },
}));

import prisma from "@/lib/db";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { firstError } from "@/lib/validation";
import { POST } from "@/app/api/auth/register/route";
import { createMockRequest, parseResponse } from "./helpers";

describe("API /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: true, retryAfterMs: 0 });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);
  });

  it("registers a new user and returns 201", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "user-new" } as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "New@Example.com", password: "securePass123", name: "New User" },
    });
    const res = await (POST as Function)(req);
    const { status, body } = parseResponse(res);

    expect(status).toBe(201);
    expect(body.userId).toBe("user-new");
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "new@example.com" } });
  });

  it("normalizes email to lowercase", async () => {
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "u1" } as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "  John@EXAMPLE.COM  ", password: "securePass123", name: "John" },
    });
    await (POST as Function)(req);

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: "john@example.com" } });
  });

  it("returns 400 when validation fails", async () => {
    vi.mocked(firstError).mockReturnValueOnce("password zu kurz" as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "a@b.c", password: "short", name: "Test" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(400);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 with generic message when email exists (no user enumeration)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "existing" } as never);

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "existing@example.com", password: "securePass123", name: "Existing" },
    });
    const res = await (POST as Function)(req);
    const { status, body } = parseResponse(res);

    expect(status).toBe(400);
    expect(body.error).toContain("Registrierung fehlgeschlagen");
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    vi.mocked(checkRateLimit).mockReturnValue({ allowed: false, retryAfterMs: 30000 });

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "a@b.c", password: "securePass123", name: "Test" },
    });
    await (POST as Function)(req);

    expect(rateLimitResponse).toHaveBeenCalledWith(30000);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("returns 500 on unexpected error", async () => {
    vi.mocked(prisma.user.findUnique).mockRejectedValue(new Error("DB down"));

    const req = createMockRequest("POST", "http://localhost:3000/api/auth/register", {
      body: { email: "a@b.c", password: "securePass123", name: "Test" },
    });
    const res = await (POST as Function)(req);
    const { status } = parseResponse(res);

    expect(status).toBe(500);
  });
});
