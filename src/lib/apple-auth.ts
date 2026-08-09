import { createRemoteJWKSet, jwtVerify, JWTVerifyGetKey } from "jose";
import { env } from "@/lib/env";

const APPLE_KEYS_URL = new URL("https://appleid.apple.com/auth/keys");

let jwks: JWTVerifyGetKey | null = null;

function getAppleJWKS(): JWTVerifyGetKey {
  if (!jwks) {
    jwks = createRemoteJWKSet(APPLE_KEYS_URL);
  }
  return jwks;
}

export interface AppleIdentity {
  sub: string;
  email?: string;
  emailVerified?: boolean;
  isPrivateEmail?: boolean;
}

export async function verifyAppleIdentityToken(identityToken: string): Promise<AppleIdentity> {
  const { payload } = await jwtVerify(identityToken, getAppleJWKS(), {
    issuer: "https://appleid.apple.com",
    audience: env.APPLE_CLIENT_ID ?? undefined,
  });

  return {
    sub: payload.sub as string,
    email: payload.email as string | undefined,
    emailVerified: payload.email_verified === true || payload.email_verified === "true",
    isPrivateEmail: payload.is_private_email === true || payload.is_private_email === "true",
  };
}
