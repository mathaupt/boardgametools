import { describe, it, expect, beforeEach, afterEach } from "vitest";

describe("crypto", () => {
  const originalEnv = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = "test-secret-for-crypto-testing";
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXTAUTH_SECRET = originalEnv;
    } else {
      delete process.env.NEXTAUTH_SECRET;
    }
  });

  it("roundtrip: decryptId(encryptId(id)) returns original id", async () => {
    const { encryptId, decryptId } = await import("@/lib/crypto");
    const id = "clx1234567890abcdef";
    expect(decryptId(encryptId(id))).toBe(id);
  });

  it("works with various ID formats", async () => {
    const { encryptId, decryptId } = await import("@/lib/crypto");
    const ids = ["abc", "12345", "uuid-like-cuid-value", "a".repeat(100)];
    for (const id of ids) {
      expect(decryptId(encryptId(id))).toBe(id);
    }
  });

  it("different IDs produce different ciphertext", async () => {
    const { encryptId } = await import("@/lib/crypto");
    const enc1 = encryptId("id-1");
    const enc2 = encryptId("id-2");
    expect(enc1).not.toBe(enc2);
  });

  it("same ID encrypted twice produces different ciphertext (random IV)", async () => {
    const { encryptId } = await import("@/lib/crypto");
    const enc1 = encryptId("same-id");
    const enc2 = encryptId("same-id");
    expect(enc1).not.toBe(enc2);
  });

  it("decryptId throws on invalid token", async () => {
    const { decryptId } = await import("@/lib/crypto");
    expect(() => decryptId("invalid-token")).toThrow();
  });

  it("encrypted output is URL-safe base64", async () => {
    const { encryptId } = await import("@/lib/crypto");
    const encrypted = encryptId("test-id");
    expect(encrypted).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(encrypted).not.toContain("+");
    expect(encrypted).not.toContain("/");
    expect(encrypted).not.toContain("=");
  });
});
