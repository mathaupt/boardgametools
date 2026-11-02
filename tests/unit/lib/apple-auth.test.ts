import { beforeEach, describe, expect, it, vi } from "vitest";

const { jwtVerify } = vi.hoisted(() => ({ jwtVerify: vi.fn() }));
vi.mock("jose", () => ({ createRemoteJWKSet: vi.fn(() => vi.fn()), jwtVerify }));

import { verifyAppleIdentityToken } from "@/lib/apple-auth";

describe("verifyAppleIdentityToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the verified Apple identity and normalizes string booleans", async () => {
    jwtVerify.mockResolvedValue({ payload: {
      sub: "apple-user-1",
      email: "person@example.com",
      email_verified: "true",
      is_private_email: false,
    } });

    await expect(verifyAppleIdentityToken("signed-token")).resolves.toEqual({
      sub: "apple-user-1",
      email: "person@example.com",
      emailVerified: true,
      isPrivateEmail: false,
    });
    expect(jwtVerify).toHaveBeenCalledWith("signed-token", expect.any(Function), {
      issuer: "https://appleid.apple.com",
      audience: undefined,
    });
  });

  it("preserves false boolean claims and omits absent optional identity claims", async () => {
    jwtVerify.mockResolvedValue({ payload: {
      sub: "apple-user-2",
      email_verified: false,
      is_private_email: "false",
    } });

    await expect(verifyAppleIdentityToken("another-token")).resolves.toEqual({
      sub: "apple-user-2",
      email: undefined,
      emailVerified: false,
      isPrivateEmail: false,
    });
  });

  it("propagates token verification errors", async () => {
    const invalidToken = new Error("Invalid signature");
    jwtVerify.mockRejectedValue(invalidToken);
    await expect(verifyAppleIdentityToken("invalid-token")).rejects.toBe(invalidToken);
  });
});
