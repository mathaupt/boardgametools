import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", () => ({
  NextRequest: class {},
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: vi.fn((handler: unknown) => handler) }));
vi.mock("@/lib/require-auth", () => {
  class ApiError extends Error { statusCode: number; constructor(s: number, m: string) { super(m); this.statusCode = s; } }
  return {
    requireAuth: vi.fn(), requireAdmin: vi.fn(), ApiError,
    handleApiError: vi.fn((err: unknown) => ({ body: { error: (err as Error)?.message || "Internal server error" }, status: (err as { statusCode?: number })?.statusCode || 500 })),
  };
});
vi.mock("@/lib/services", () => ({ GameService: { list: vi.fn(), create: vi.fn() } }));
vi.mock("@/lib/db", () => ({ default: { user: { update: vi.fn() } } }));
vi.mock("bcryptjs", () => ({ hash: vi.fn(() => Promise.resolve("hashed-pw")) }));
vi.mock("@/lib/validation", () => ({ validateString: vi.fn(() => null), firstError: vi.fn(() => null) }));
vi.mock("@/lib/error-messages", () => ({
  Errors: { INTERNAL_SERVER_ERROR: "Interner Serverfehler", MISSING_REQUIRED_FIELDS: "Pflichtfelder fehlen",
    CANNOT_MODIFY_OWN_ACCOUNT: "Eigenes Konto kann nicht geaendert werden", USER_STATUS_CHANGED: "Benutzer-Status geaendert",
    PASSWORD_CHANGED: "Passwort geaendert" },
}));

import { requireAuth, requireAdmin, handleApiError, ApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";
import prisma from "@/lib/db";
import { GET as GamesGET } from "@/app/api/games/route";
import { POST as DeactivatePOST } from "@/app/api/admin/users/deactivate/route";
import { createMockRequest, parseResponse } from "./helpers";

describe("Auth Flow — Route Integration", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  describe("requireAuth via games route", () => {
    it("proceeds when session exists", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ userId: "u1", role: "USER", name: "T", email: "t@t.com" });
      vi.mocked(GameService.list).mockResolvedValue([] as never);
      const res = await (GamesGET as Function)(createMockRequest("GET", "http://localhost:3000/api/games"));
      expect(parseResponse(res).status).toBe(200);
      expect(GameService.list).toHaveBeenCalledWith("u1", expect.any(Object));
    });

    it("returns 401 when no session", async () => {
      vi.mocked(requireAuth).mockRejectedValue(new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized"));
      const res = await (GamesGET as Function)(createMockRequest("GET", "http://localhost:3000/api/games"));
      expect(parseResponse(res).status).toBe(401);
      expect(GameService.list).not.toHaveBeenCalled();
    });

    it("returns 500 for unexpected errors", async () => {
      vi.mocked(requireAuth).mockResolvedValue({ userId: "u1", role: "USER", name: "T", email: "t@t.com" });
      vi.mocked(GameService.list).mockRejectedValue(new Error("DB down"));
      const res = await (GamesGET as Function)(createMockRequest("GET", "http://localhost:3000/api/games"));
      expect(parseResponse(res).status).toBe(500);
    });
  });

  describe("requireAdmin via deactivate route", () => {
    it("proceeds when admin", async () => {
      vi.mocked(requireAdmin).mockResolvedValue({ userId: "admin-1", role: "ADMIN" });
      vi.mocked(prisma.user.update).mockResolvedValue({} as never);
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: "target", isActive: false } });
      expect(parseResponse(await (DeactivatePOST as Function)(req)).status).toBe(200);
    });

    it("returns 403 for non-admin", async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new (ApiError as unknown as new (s: number, m: string) => Error)(403, "Forbidden"));
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: "target", isActive: false } });
      expect(parseResponse(await (DeactivatePOST as Function)(req)).status).toBe(403);
      expect(handleApiError).toHaveBeenCalled();
    });

    it("returns 401 for unauthenticated", async () => {
      vi.mocked(requireAdmin).mockRejectedValue(new (ApiError as unknown as new (s: number, m: string) => Error)(401, "Unauthorized"));
      const req = createMockRequest("POST", "http://localhost:3000/api/admin/users/deactivate", { body: { userId: "target", isActive: false } });
      expect(parseResponse(await (DeactivatePOST as Function)(req)).status).toBe(401);
    });
  });
});
