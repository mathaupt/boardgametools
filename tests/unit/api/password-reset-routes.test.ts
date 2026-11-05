import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ findUnique: vi.fn(), userUpdate: vi.fn(), tokenUpdate: vi.fn(), tokenDeleteMany: vi.fn(), transaction: vi.fn(), tokenCreate: vi.fn(), tokenVerify: vi.fn(), sendMail: vi.fn(), baseUrl: vi.fn(), rate: vi.fn(), rateResponse: vi.fn(), hash: vi.fn(), error: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: m.findUnique, update: m.userUpdate }, passwordResetToken: { update: m.tokenUpdate, deleteMany: m.tokenDeleteMany }, $transaction: m.transaction } }));
vi.mock("@/lib/password-reset", () => ({ createPasswordResetToken: m.tokenCreate, verifyResetToken: m.tokenVerify }));
vi.mock("@/lib/mailer", () => ({ sendPasswordResetEmail: m.sendMail }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: m.baseUrl }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: m.rate, rateLimitResponse: m.rateResponse }));
vi.mock("bcryptjs", () => ({ hash: m.hash }));
vi.mock("@/lib/logger", () => ({ default: { error: m.error } }));
import { POST as requestReset } from "@/app/api/auth/password-reset/request/route";
import { POST as confirmReset } from "@/app/api/auth/password-reset/confirm/route";
const postRequestReset = (input: Request) => requestReset(input as never, {} as never);
const postConfirmReset = (input: Request) => confirmReset(input as never, {} as never);
beforeEach(() => { vi.clearAllMocks(); m.rate.mockReturnValue({ allowed: true, retryAfterMs: 1 }); m.rateResponse.mockReturnValue(Response.json({ error: "rate limited" }, { status: 429 })); m.baseUrl.mockResolvedValue("https://app.test/"); m.findUnique.mockResolvedValue(null); m.tokenCreate.mockResolvedValue({ token: "token-1", expiresAt: new Date("2026-12-01") }); m.sendMail.mockResolvedValue(undefined); m.tokenVerify.mockResolvedValue({ id: "r1", userId: "u1" }); m.hash.mockResolvedValue("hashed"); m.transaction.mockResolvedValue([]); });
const request = (body: unknown, ip = "1.2.3.4") => new Request("http://local/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": `${ip}, proxy` }, body: JSON.stringify(body) });

describe("Passwort-Reset-Routen", () => {
  it("validiert und begrenzt Reset-Anfragen", async () => {
    expect((await postRequestReset(request({ email: 3 }))).status).toBe(400);
    m.rate.mockReturnValueOnce({ allowed: false, retryAfterMs: 5000 });
    expect((await postRequestReset(request({ email: "a@test.de" }))).status).toBe(429);
    expect(m.rate).toHaveBeenCalledWith("pw-reset-request:1.2.3.4", 3, 60_000);
  });
  it("gibt bei fehlenden und deaktivierten Nutzern eine nicht unterscheidbare Erfolgsantwort", async () => {
    expect(await (await postRequestReset(request({ email: "MISSING@TEST.DE" }))).json()).toEqual({ success: true });
    expect(m.findUnique).toHaveBeenCalledWith({ where: { email: "missing@test.de" } });
    m.findUnique.mockResolvedValueOnce({ id: "u1", email: "off@test.de", isActive: false });
    expect(await (await postRequestReset(request({ email: "off@test.de" }))).json()).toEqual({ success: true });
    expect(m.tokenCreate).not.toHaveBeenCalled();
  });
  it("sendet Tokenmail an aktive Konten und behandelt Providerfehler generisch", async () => {
    m.findUnique.mockResolvedValue({ id: "u1", email: "User@Test.de", isActive: true });
    expect((await postRequestReset(request({ email: "USER@test.de" }))).status).toBe(200);
    expect(m.sendMail).toHaveBeenCalledWith("User@Test.de", "https://app.test/reset-password?token=token-1", expect.any(Date));
    m.sendMail.mockRejectedValueOnce(new Error("smtp"));
    expect((await postRequestReset(request({ email: "USER@test.de" }))).status).toBe(500);
  });
  it("validiert Rate-Limit, Token und Passwort beim Bestätigen", async () => {
    m.rate.mockReturnValueOnce({ allowed: false, retryAfterMs: 10 }); expect((await postConfirmReset(request({}))).status).toBe(429);
    expect((await postConfirmReset(request({ token: 1, password: "12345678" }))).status).toBe(400);
    expect((await postConfirmReset(request({ token: "x", password: "short" }))).status).toBe(400);
    expect((await postConfirmReset(request({ token: "x", password: "x".repeat(129) }))).status).toBe(400);
    m.tokenVerify.mockResolvedValueOnce(null); expect((await postConfirmReset(request({ token: "expired", password: "12345678" }))).status).toBe(400);
  });
  it("hasht das gültige Passwort und verwendet Token atomar", async () => {
    expect(await (await postConfirmReset(request({ token: "valid", password: "secure-pass" }))).json()).toEqual({ success: true });
    expect(m.hash).toHaveBeenCalledWith("secure-pass", 12); expect(m.transaction).toHaveBeenCalledOnce();
    expect(m.userUpdate).toHaveBeenCalledWith({ where: { id: "u1" }, data: { passwordHash: "hashed" } });
    expect(m.tokenUpdate).toHaveBeenCalledWith({ where: { id: "r1" }, data: { usedAt: expect.any(Date) } });
    expect(m.tokenDeleteMany).toHaveBeenCalledWith({ where: { userId: "u1", usedAt: null, id: { not: "r1" } } });
  });
  it("gibt Fehler aus Token- und DB-Diensten generisch zurück", async () => {
    m.tokenVerify.mockRejectedValueOnce(new Error("database"));
    expect((await postConfirmReset(request({ token: "valid", password: "secure-pass" }))).status).toBe(500);
  });
});
