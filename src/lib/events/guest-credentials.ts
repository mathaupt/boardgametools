import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { ApiError } from "@/lib/require-auth";

const GUEST_COOKIE_PREFIX = "bgt_guest_";
const CREDENTIAL_PATTERN = /^[A-Za-z0-9_-]{43}$/;
const HASH_PATTERN = /^[a-f0-9]{64}$/;
const CREDENTIAL_TTL_SECONDS = 60 * 60 * 24 * 365;

export const GUEST_CREDENTIAL_REQUIRED = "Gastzugang nicht bestätigt. Bitte registriere dich mit einem neuen Spitznamen.";

export interface GuestCredentialRecord {
  id: string;
  credentialHash: string | null;
}

export function createGuestCredential(): { credential: string; credentialHash: string } {
  const credential = randomBytes(32).toString("base64url");
  return { credential, credentialHash: hashGuestCredential(credential)! };
}

export function hashGuestCredential(credential: string): string | null {
  if (!CREDENTIAL_PATTERN.test(credential)) return null;
  return createHash("sha256").update(credential, "utf8").digest("hex");
}

export function verifyGuestCredential(credential: string | null, expectedHash: string | null): boolean {
  if (!credential || !expectedHash || !HASH_PATTERN.test(expectedHash)) return false;
  const actual = hashGuestCredential(credential);
  if (!actual) return false;
  return timingSafeEqual(Buffer.from(actual, "hex"), Buffer.from(expectedHash, "hex"));
}

export function guestCredentialCookieName(eventId: string): string {
  const eventKey = createHash("sha256").update(eventId, "utf8").digest("hex").slice(0, 24);
  return `${GUEST_COOKIE_PREFIX}${eventKey}`;
}

export function readGuestCredential(request: Request, eventId: string): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader || cookieHeader.length > 16_384) return null;
  const name = guestCredentialCookieName(eventId);

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    const value = part.slice(separator + 1).trim();
    return CREDENTIAL_PATTERN.test(value) ? value : null;
  }
  return null;
}

export function guestCredentialCookieHeader(
  request: Request,
  eventId: string,
  token: string,
  credential: string,
): string {
  const pathname = new URL(request.url).pathname;
  const family = pathname.startsWith("/api/mobile/v1/public/event/")
    ? "/api/mobile/v1/public/event"
    : "/api/public/event";
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${guestCredentialCookieName(eventId)}=${credential}; Path=${family}/${encodeURIComponent(token)}; Max-Age=${CREDENTIAL_TTL_SECONDS}; HttpOnly; SameSite=Lax${secure}`;
}

export function assertGuestMutationOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site" || (origin !== null && origin !== new URL(request.url).origin)) {
    throw new ApiError(403, "Anfragequelle nicht erlaubt.");
  }
}

export async function requireGuestIdentity(
  request: Request,
  eventId: string,
  lookup: () => Promise<GuestCredentialRecord | null>,
): Promise<GuestCredentialRecord> {
  assertGuestMutationOrigin(request);
  const credential = readGuestCredential(request, eventId);
  if (!credential) throw new ApiError(401, GUEST_CREDENTIAL_REQUIRED);

  const guest = await lookup();
  if (!guest || !verifyGuestCredential(credential, guest.credentialHash)) {
    throw new ApiError(401, GUEST_CREDENTIAL_REQUIRED);
  }
  return guest;
}
