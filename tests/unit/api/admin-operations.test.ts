import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: vi.fn((handler: unknown) => handler) }));
vi.mock("@/lib/require-auth", () => {
  class ApiError extends Error { statusCode: number; constructor(s: number, m: string) { super(m); this.statusCode = s; } }
  return {
    requireAdmin: vi.fn(), ApiError,
    handleApiError: vi.fn((err: unknown) => ({ body: { error: (err as Error)?.message || "Internal server error" }, status: (err as { statusCode?: number })?.statusCode || 500 })),
  };
});
vi.mock("@/lib/db", () => ({ default: { user: { update: vi.fn(), findUnique: vi.fn(), create: vi.fn() } } }));
vi.mock("bcryptjs", () => ({ hash: vi.fn(() => Promise.resolve("hashed-pw")) }));
vi.mock("@/lib/validation", () => ({ validateString: vi.fn(() => null), firstError: vi.fn(() => null) }));
vi.mock("@/lib/error-messages", () => ({
  Errors: { MISSING_REQUIRED_FIELDS: "Pflichtfelder fehlen", CANNOT_MODIFY_OWN_ACCOUNT: "Eigenes Konto kann nicht geaendert werden",
    USER_STATUS_CHANGED: "Benutzer-Status geaendert", PASSWORD_CHANGED: "Passwort geaendert",
    PASSWORD_MIN_LENGTH: "Passwort muss mindestens 8 Zeichen lang sein" },
}));

import prisma from "@/lib/db";
import { requireAdmin, handleApiError, ApiError } from "@/lib/require-auth";
import { POST as DeactivatePOST } from "@/app/api/admin/users/deactivate/route";
import { POST as ChangePasswordPOST } from "@/app/api/admin/users/change-password/route";
import { createMockRequest, parseResponse } from "./helpers";

const ADMIN_ID = "admin-001";
const TARGET_ID = "user-002";

describe("Admin Operations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdmin).mockResolvedValue({ userId: ADMIN_ID, role: "ADMIN" });
  });

  describe("POST /deactivate", () => {
    it("deactivates user", async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: TARGET_ID, isActive: false } });
      const { status, body } = parseResponse(await (DeactivatePOST as Function)(req));
      expect(status).toBe(200);
      expect(body.message).toBe("Benutzer-Status geaendert");
    });

    it("prevents self-deactivation", async () => {
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: ADMIN_ID, isActive: false } });
      const { status } = parseResponse(await (DeactivatePOST as Function)(req));
      expect(status).toBe(400);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("returns 403 for non-admin", async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new (ApiError as unknown as new (s: number, m: string) => Error)(403, "Forbidden"));
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: TARGET_ID, isActive: false } });
      expect(parseResponse(await (DeactivatePOST as Function)(req)).status).toBe(403);
      expect(handleApiError).toHaveBeenCalled();
    });

    it("returns 400 when isActive not boolean", async () => {
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: TARGET_ID, isActive: "no" } });
      expect(parseResponse(await (DeactivatePOST as Function)(req)).status).toBe(400);
    });
  });

  describe("POST /change-password", () => {
    it("changes password", async () => {
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/change-password", { body: { userId: TARGET_ID, newPassword: "securePass123" } });
      const { status, body } = parseResponse(await (ChangePasswordPOST as Function)(req));
      expect(status).toBe(200);
      expect(body.message).toBe("Passwort geaendert");
    });

    it("prevents changing own password", async () => {
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/change-password", { body: { userId: ADMIN_ID, newPassword: "newPass123" } });
      const { status } = parseResponse(await (ChangePasswordPOST as Function)(req));
      expect(status).toBe(400);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("validates min password length", async () => {
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/change-password", { body: { userId: TARGET_ID, newPassword: "short" } });
      expect(parseResponse(await (ChangePasswordPOST as Function)(req)).status).toBe(400);
    });
  });
});
