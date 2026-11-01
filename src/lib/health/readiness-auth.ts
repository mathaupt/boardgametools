import { createHash, timingSafeEqual } from "node:crypto";

const MIN_TOKEN_BYTES = 32;
const MAX_AUTHORIZATION_LENGTH = 2_048;

export function isReadinessTokenConfigured(token: string | undefined): token is string {
  return !!token && Buffer.byteLength(token, "utf8") >= MIN_TOKEN_BYTES;
}

export function hasValidReadinessAuthorization(
  authorization: string | null,
  configuredToken: string,
): boolean {
  if (!authorization || authorization.length > MAX_AUTHORIZATION_LENGTH) return false;
  const match = /^Bearer ([A-Za-z0-9._~+/-]+=*)$/.exec(authorization);
  if (!match || !isReadinessTokenConfigured(configuredToken)) return false;

  const expectedDigest = createHash("sha256").update(configuredToken, "utf8").digest();
  const providedDigest = createHash("sha256").update(match[1], "utf8").digest();
  return timingSafeEqual(expectedDigest, providedDigest);
}
