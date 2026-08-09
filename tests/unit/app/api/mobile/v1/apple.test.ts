import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
    },
    apiLog: { create: vi.fn() },
  },
}));

vi.mock("@/lib/apple-auth", () => ({
  verifyAppleIdentityToken: vi.fn(),
}));

vi.mock("@/lib/token-service", () => ({
  createTokenPair: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { POST } from "@/app/api/mobile/v1/auth/apple/route";
import { verifyAppleIdentityToken } from "@/lib/apple-auth";
import { createTokenPair } from "@/lib/token-service";
import prisma from "@/lib/db";

const mockedVerify = vi.mocked(verifyAppleIdentityToken);
const mockedCreateTokenPair = vi.mocked(createTokenPair);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);

describe("POST /api/mobile/v1/auth/apple", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns tokens for an existing Apple user", async () => {
    mockedVerify.mockResolvedValue({ sub: "apple-1", email: "a@b.c", emailVerified: true });
    mockedFindUnique.mockResolvedValue({ id: "u1", email: "a@b.c", name: "Max", role: "USER", isActive: true } as never);
    mockedCreateTokenPair.mockResolvedValue({
      accessToken: "access123",
      refreshToken: "refresh123",
      expiresAt: new Date("2099-01-01"),
    } as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/apple", {
        method: "POST",
        body: JSON.stringify({ identityToken: "id-token", authorizationCode: "code" }),
      }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accessToken).toBe("access123");
    expect(body.user.email).toBe("a@b.c");
  });

  it("creates a new Apple user and returns tokens", async () => {
    mockedVerify.mockResolvedValue({ sub: "apple-2", email: "new@b.c", emailVerified: true });
    mockedFindUnique.mockResolvedValue(null as never);
    (prisma.user.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "u2", email: "new@b.c", name: "new", role: "USER", isActive: true,
    } as never);
    mockedCreateTokenPair.mockResolvedValue({
      accessToken: "access456",
      refreshToken: "refresh456",
      expiresAt: new Date("2099-01-01"),
    } as never);

    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/apple", {
        method: "POST",
        body: JSON.stringify({ identityToken: "id-token", authorizationCode: "code", name: "Max" }),
      }),
      {}
    );

    expect(res.status).toBe(200);
    expect((await res.json()).accessToken).toBe("access456");
  });

  it("returns 400 for missing token", async () => {
    const res = await POST(
      new NextRequest("http://localhost:3000/api/mobile/v1/auth/apple", {
        method: "POST",
        body: JSON.stringify({ authorizationCode: "code" }),
      }),
      {}
    );
    expect(res.status).toBe(400);
  });
});
