import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createTokenPair,
  rotateTokenPair,
  revokeToken,
  hashToken,
} from "@/lib/token-service";

vi.mock("@/lib/db", () => ({
  default: {
    apiToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import prisma from "@/lib/db";

const mockedPrisma = vi.mocked(prisma);

describe("token-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an access and refresh token pair", async () => {
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: "1" }, { id: "2" }] as never);
    const result = await createTokenPair("user-1", "iPhone von Max");
    expect(result.accessToken).toHaveLength(64);
    expect(result.refreshToken).toHaveLength(64);
    expect(result.expiresAt instanceof Date).toBe(true);
    expect(mockedPrisma.$transaction).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({}), // PrismaPromise cannot be easily matched
      ])
    );
  });

  it("rotates a refresh token", async () => {
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: "rt-1",
      type: "refresh",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 86400000),
    } as never);
    vi.mocked(prisma.apiToken.update).mockResolvedValue({} as never);
    vi.mocked(prisma.$transaction).mockResolvedValue([{ id: "2" }, { id: "3" }] as never);

    const result = await rotateTokenPair("some-refresh-token");
    expect(result).not.toBeNull();
    expect(prisma.apiToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "rt-1" },
        data: { revokedAt: expect.any(Date) },
      })
    );
  });

  it("returns null for an expired refresh token", async () => {
    vi.mocked(prisma.apiToken.findUnique).mockResolvedValue({
      id: "rt-2",
      type: "refresh",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    const result = await rotateTokenPair("expired-token");
    expect(result).toBeNull();
    expect(prisma.apiToken.update).not.toHaveBeenCalled();
  });

  it("revokes a token by hash", async () => {
    vi.mocked(prisma.apiToken.updateMany).mockResolvedValue({ count: 1 } as never);
    await revokeToken("token-to-revoke");
    expect(prisma.apiToken.updateMany).toHaveBeenCalledWith({
      where: { tokenHash: hashToken("token-to-revoke") },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
