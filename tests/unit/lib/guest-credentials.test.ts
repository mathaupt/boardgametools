import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/require-auth", () => ({
  ApiError: class ApiError extends Error {
    constructor(public statusCode: number, message: string) { super(message); }
  },
}));

import {
  assertGuestMutationOrigin,
  createGuestCredential,
  guestCredentialCookieHeader,
  guestCredentialCookieName,
  hashGuestCredential,
  readGuestCredential,
  requireGuestIdentity,
  verifyGuestCredential,
} from "@/lib/events/guest-credentials";

describe("public guest credentials", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("creates unguessable credentials and stores only a verifiable hash", () => {
    const first = createGuestCredential();
    const second = createGuestCredential();

    expect(first.credential).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(first.credential).not.toBe(second.credential);
    expect(first.credentialHash).not.toContain(first.credential);
    expect(verifyGuestCredential(first.credential, first.credentialHash)).toBe(true);
    expect(verifyGuestCredential(second.credential, first.credentialHash)).toBe(false);
    expect(hashGuestCredential("invalid")).toBeNull();
  });

  it("reads the event-scoped cookie and emits HttpOnly, SameSite and production Secure flags", () => {
    const credential = "A".repeat(43);
    const eventId = "event-1";
    const name = guestCredentialCookieName(eventId);
    const request = new Request("https://example.test/api/public/event/share-token/join", {
      headers: { cookie: `other=x; ${name}=${credential}` },
    });
    vi.stubEnv("NODE_ENV", "production");

    expect(readGuestCredential(request, eventId)).toBe(credential);
    expect(readGuestCredential(request, "another-event")).toBeNull();
    expect(guestCredentialCookieHeader(request, eventId, "share-token", credential)).toContain("HttpOnly; SameSite=Lax; Secure");
    expect(guestCredentialCookieHeader(request, eventId, "share-token", credential)).toContain("Path=/api/public/event/share-token");
  });

  it("sets the mobile API cookie path for the mobile alias", () => {
    const request = new Request("https://example.test/api/mobile/v1/public/event/share-token/join");
    const cookie = guestCredentialCookieHeader(request, "event-1", "share-token", "A".repeat(43));

    expect(cookie).toContain("Path=/api/mobile/v1/public/event/share-token");
  });

  it("requires the valid event credential and rejects cross-origin mutation requests", async () => {
    const credential = "B".repeat(43);
    const eventId = "event-1";
    const request = new Request("https://example.test/api/public/event/share-token/vote", {
      method: "POST",
      headers: { cookie: `${guestCredentialCookieName(eventId)}=${credential}` },
    });
    const lookup = vi.fn(async () => ({ id: "guest-1", credentialHash: hashGuestCredential(credential) }));

    await expect(requireGuestIdentity(request, eventId, lookup)).resolves.toEqual({
      id: "guest-1", credentialHash: hashGuestCredential(credential),
    });
    expect(lookup).toHaveBeenCalledOnce();
    expect(() => assertGuestMutationOrigin(new Request(request.url, {
      method: "POST", headers: { origin: "https://attacker.example", "sec-fetch-site": "cross-site" },
    }))).toThrow("Anfragequelle nicht erlaubt.");
  });

  it("rejects a missing credential before looking up a guest", async () => {
    const lookup = vi.fn();
    await expect(requireGuestIdentity(
      new Request("https://example.test/api/public/event/share-token/vote", { method: "POST" }),
      "event-1",
      lookup,
    )).rejects.toThrow("Gastzugang nicht bestätigt.");
    expect(lookup).not.toHaveBeenCalled();
  });
});
