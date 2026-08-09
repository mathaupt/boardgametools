import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    apiToken: { updateMany: vi.fn() },
    apiLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/api-auth", () => ({
  apiAuth: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { POST } from "@/app/api/mobile/v1/auth/logout-all/route";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);

describe("POST /api/mobile/v1/auth/logout-all", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("revokes all tokens for authenticated user", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } } as never);
    vi.mocked(prisma.apiToken.updateMany).mockResolvedValue({ count: 3 } as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/logout-all", { method: "POST" }),
      {}
    );

    expect(res.status).toBe(200);
    expect(vi.mocked(prisma.apiToken.updateMany)).toHaveBeenCalledWith({
      where: { userId: "u1", revokedAt: null },
      data: { revokedAt: expect.any(Date) },
    });
  });

  it("returns 401 for unauthenticated requests", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/logout-all", { method: "POST" }),
      {}
    );

    expect(res.status).toBe(401);
  });
});
