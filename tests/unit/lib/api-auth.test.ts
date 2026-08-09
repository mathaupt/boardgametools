import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { apiAuth } from "@/lib/api-auth";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/db", () => ({
  default: { apiToken: { findUnique: vi.fn(), update: vi.fn() } },
}));
vi.mock("@/lib/token-service", () => ({ hashToken: vi.fn((t: string) => t) }));

import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

const mockedAuth = vi.mocked(auth);
const mockedPrisma = vi.mocked(prisma);

describe("apiAuth", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns web session when NextAuth session exists", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } } as never);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me");
    const result = await apiAuth(req);
    expect(result?.user.id).toBe("u1");
  });

  it("returns null for missing authorization header", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me");
    const result = await apiAuth(req);
    expect(result).toBeNull();
  });

  it("resolves bearer token to user", async () => {
    mockedAuth.mockResolvedValue(null as never);
    mockedPrisma.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      type: "access",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 10000),
      user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" },
    } as never);

    const token = "a".repeat(64);
    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me", {
      headers: { authorization: `Bearer ${token}` },
    });
    const result = await apiAuth(req);
    expect(result?.user.id).toBe("u1");
    expect(mockedPrisma.apiToken.update).toHaveBeenCalled();
  });

  it("returns null for an expired token", async () => {
    mockedAuth.mockResolvedValue(null as never);
    mockedPrisma.apiToken.findUnique.mockResolvedValue({
      id: "t1",
      type: "access",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 10000),
      user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" },
    } as never);

    const req = new NextRequest("http://localhost:3000/api/mobile/v1/me", {
      headers: { authorization: "Bearer expired" },
    });
    const result = await apiAuth(req);
    expect(result).toBeNull();
  });
});
