import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: { apiToken: { updateMany: vi.fn() }, apiLog: { create: vi.fn() } },
}));

vi.mock("@/lib/token-service", () => ({
  rotateTokenPair: vi.fn(),
  hashToken: vi.fn((t: string) => t),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { POST } from "@/app/api/mobile/v1/auth/refresh/route";
import { rotateTokenPair } from "@/lib/token-service";

const mockedRotate = vi.mocked(rotateTokenPair);

describe("POST /api/mobile/v1/auth/refresh", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns a new token pair", async () => {
    mockedRotate.mockResolvedValue({
      accessToken: "newAccess",
      refreshToken: "newRefresh",
      expiresAt: new Date("2099-01-01"),
    } as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: "oldRefresh" }),
      })
    );

    expect(res.status).toBe(200);
    expect((await res.json()).accessToken).toBe("newAccess");
  });

  it("returns 401 for invalid refresh token", async () => {
    mockedRotate.mockResolvedValue(null as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/refresh", {
        method: "POST",
        body: JSON.stringify({ refreshToken: "bad" }),
      })
    );

    expect(res.status).toBe(401);
  });
});
