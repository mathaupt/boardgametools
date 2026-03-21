import { describe, it, expect, vi } from "vitest";

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

import { hashResetToken } from "@/lib/password-reset";

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
