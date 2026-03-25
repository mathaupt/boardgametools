import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  default: {
    passwordResetToken: {
      deleteMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import {
  hashResetToken,
  createPasswordResetToken,
  verifyResetToken,
  markResetTokenUsed,
} from "@/lib/password-reset";
import prisma from "@/lib/db";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("hashResetToken", () => {
  it("returns a deterministic hash for the same input", () => {
    const hash1 = hashResetToken("test-token");
    const hash2 = hashResetToken("test-token");
    expect(hash1).toBe(hash2);
  });

  it("returns different hashes for different inputs", () => {
    const hash1 = hashResetToken("token-a");
    const hash2 = hashResetToken("token-b");
    expect(hash1).not.toBe(hash2);
  });

  it("returns 64-character hex string (SHA-256)", () => {
    const hash = hashResetToken("any-token");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("returns non-empty output for empty string", () => {
    const hash = hashResetToken("");
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("createPasswordResetToken", () => {
  it("deletes old unused tokens for the user", async () => {
    await createPasswordResetToken("user-123");
    expect(prisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
      where: { userId: "user-123", usedAt: null },
    });
  });

  it("creates a new token in the database", async () => {
    await createPasswordResetToken("user-123");
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-123",
        tokenHash: expect.stringMatching(/^[a-f0-9]{64}$/),
        expiresAt: expect.any(Date),
      }),
    });
  });

  it("returns a hex token and expiry date", async () => {
    const result = await createPasswordResetToken("user-123");
    expect(result.token).toMatch(/^[a-f0-9]{64}$/);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("stored tokenHash matches hash of returned token", async () => {
    const result = await createPasswordResetToken("user-123");
    const expectedHash = hashResetToken(result.token);
    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ tokenHash: expectedHash }),
    });
  });
});

describe("verifyResetToken", () => {
  it("returns null for empty token", async () => {
    const result = await verifyResetToken("");
    expect(result).toBeNull();
    expect(prisma.passwordResetToken.findUnique).not.toHaveBeenCalled();
  });

  it("returns null when token not found in DB", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);
    const result = await verifyResetToken("unknown-token");
    expect(result).toBeNull();
  });

  it("returns null when token is already used", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      tokenHash: "abc",
      expiresAt: new Date(Date.now() + 60000),
      usedAt: new Date(),
      createdAt: new Date(),
      user: { id: "user-1", name: "Test", email: "t@t.de", passwordHash: "h" },
    } as never);
    const result = await verifyResetToken("some-token");
    expect(result).toBeNull();
  });

  it("returns null when token is expired", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue({
      id: "tok-1",
      userId: "user-1",
      tokenHash: "abc",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
      createdAt: new Date(),
      user: { id: "user-1", name: "Test", email: "t@t.de", passwordHash: "h" },
    } as never);
    const result = await verifyResetToken("some-token");
    expect(result).toBeNull();
  });

  it("returns record when token is valid", async () => {
    const record = {
      id: "tok-1",
      userId: "user-1",
      tokenHash: hashResetToken("valid-token"),
      expiresAt: new Date(Date.now() + 60000),
      usedAt: null,
      createdAt: new Date(),
      user: { id: "user-1", name: "Test", email: "t@t.de", passwordHash: "h" },
    };
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(record as never);
    const result = await verifyResetToken("valid-token");
    expect(result).toEqual(record);
  });

  it("queries with correct tokenHash", async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);
    await verifyResetToken("my-token");
    expect(prisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
      where: { tokenHash: hashResetToken("my-token") },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  });
});

describe("markResetTokenUsed", () => {
  it("updates the token with usedAt timestamp", async () => {
    await markResetTokenUsed("tok-42");
    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
      where: { id: "tok-42" },
      data: { usedAt: expect.any(Date) },
    });
  });
});
