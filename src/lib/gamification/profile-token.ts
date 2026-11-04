import { createHash, createHmac, randomBytes } from "node:crypto";
import { env } from "@/lib/env";

const TOKEN_BYTES = 32;
const TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function createProfileNonce(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

export function deriveProfileToken(userId: string, nonce: string): string {
  return createHmac("sha256", env.NEXTAUTH_SECRET)
    .update(`boardgametools:public-profile:${userId}:`)
    .update(nonce, "utf8")
    .digest("base64url");
}

export function hashProfileToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isValidProfileToken(token: string): boolean {
  return TOKEN_PATTERN.test(token);
}

