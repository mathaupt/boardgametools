import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    user: { findUnique: vi.fn() },
    apiLog: { create: vi.fn() },
  },
}));

vi.mock("bcryptjs", () => ({
  compare: vi.fn(),
}));

vi.mock("@/lib/token-service", () => ({
  createTokenPair: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

import { POST } from "@/app/api/mobile/v1/auth/login/route";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";
import { createTokenPair } from "@/lib/token-service";

const mockedCompare = vi.mocked(compare);
const mockedCreateTokenPair = vi.mocked(createTokenPair);

function jsonRequest(body: object): NextRequest {
  return new NextRequest("http://localhost:3000/api/mobile/v1/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("POST /api/mobile/v1/auth/login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns token pair for valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      email: "a@b.c",
      name: "Max",
      role: "USER",
      isActive: true,
      passwordHash: "hash",
    } as never);

    mockedCompare.mockResolvedValue(true as never);
    mockedCreateTokenPair.mockResolvedValue({
      accessToken: "access123",
      refreshToken: "refresh123",
      expiresAt: new Date("2099-01-01"),
    } as never);

    const res = await POST(jsonRequest({ email: "a@b.c", password: "pw" }), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.accessToken).toBe("access123");
    expect(body.user.email).toBe("a@b.c");
  });

  it("returns 401 for invalid password", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "u1",
      isActive: true,
      passwordHash: "hash",
    } as never);
    mockedCompare.mockResolvedValue(false as never);

    const res = await POST(jsonRequest({ email: "a@b.c", password: "wrong" }), {});
    expect(res.status).toBe(401);
  });

  it("returns 401 for non-existent user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null as never);

    const res = await POST(jsonRequest({ email: "x@y.z", password: "pw" }), {});
    expect(res.status).toBe(401);
  });
});
