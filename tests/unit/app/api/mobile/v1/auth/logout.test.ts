import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: { apiLog: { create: vi.fn() } },
}));

vi.mock("@/lib/token-service", () => ({
  revokeToken: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { POST } from "@/app/api/mobile/v1/auth/logout/route";
import { revokeToken } from "@/lib/token-service";

const mockedRevoke = vi.mocked(revokeToken);

describe("POST /api/mobile/v1/auth/logout", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("revokes the provided access token", async () => {
    mockedRevoke.mockResolvedValue(undefined as never);
    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/logout", {
        method: "POST",
        body: JSON.stringify({ accessToken: "token" }),
      }),
      {}
    );

    expect(res.status).toBe(200);
    expect(mockedRevoke).toHaveBeenCalledWith("token");
  });
});
