import { describe, expect, it, vi } from "vitest";
import { createProfileNonce, deriveProfileToken, hashProfileToken, isValidProfileToken } from "@/lib/gamification/profile-token";

describe("public profile tokens", () => {
  it("generates unique opaque tokens with at least 256 bits of entropy", () => {
    const nonceA = createProfileNonce();
    const nonceB = createProfileNonce();
    const first = deriveProfileToken("user-1", nonceA);
    const second = deriveProfileToken("user-1", nonceB);
    expect(nonceA).not.toBe(nonceB);
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(isValidProfileToken(first)).toBe(true);
  });

  it("hashes tokens deterministically without returning the original token", () => {
    const token = deriveProfileToken("user-1", createProfileNonce());
    const hash = hashProfileToken(token);
    expect(hash).not.toBe(token);
    expect(hash).toBe(hashProfileToken(token));
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it("rejects malformed tokens before lookup", () => {
    expect(isValidProfileToken("short")).toBe(false);
    expect(isValidProfileToken(`${"x".repeat(42)}!`)).toBe(false);
  });

  it("derives tokens from a CSPRNG nonce and binds them to the user and server secret", () => {
    vi.stubEnv("NEXTAUTH_SECRET", "profile-token-test-secret");
    const nonce = createProfileNonce();
    const token = deriveProfileToken("user-1", nonce);
    expect(deriveProfileToken("user-1", nonce)).toBe(token);
    expect(deriveProfileToken("user-2", nonce)).not.toBe(token);
    vi.stubEnv("NEXTAUTH_SECRET", "a-different-secret");
    expect(deriveProfileToken("user-1", nonce)).not.toBe(token);
    vi.unstubAllEnvs();
  });
});
