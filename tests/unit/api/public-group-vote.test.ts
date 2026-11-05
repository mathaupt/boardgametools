import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ rate: vi.fn(), rateResponse: vi.fn(), findGroup: vi.fn(), compare: vi.fn(), poll: vi.fn(), transaction: vi.fn(), error: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/group-share", () => ({ findPublicGroupByToken: m.findGroup }));
vi.mock("@/lib/db", () => ({ default: { groupPoll: { findFirst: m.poll }, $transaction: m.transaction } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: m.rate, rateLimitResponse: m.rateResponse }));
vi.mock("bcryptjs", () => ({ compare: m.compare }));
vi.mock("@/lib/logger", () => ({ default: { error: m.error } }));
vi.mock("@/lib/error-messages", () => ({ Errors: { GROUP_NOT_FOUND: "Gruppe nicht gefunden", INVALID_PASSWORD: "Passwort ungültig", POLL_VOTE_FIELDS_REQUIRED: "Pflichtfelder fehlen", POLL_NOT_FOUND_OR_CLOSED: "Umfrage geschlossen", SINGLE_CHOICE_ONLY_ONE: "Nur eine Antwort erlaubt", INTERNAL_SERVER_ERROR: "Interner Fehler" } }));
import { POST } from "@/app/api/public/group/[token]/vote/route";
const ctx = { params: Promise.resolve({ token: "share" }) };
const vote = (body: unknown) => POST(new Request("http://local/api", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "10.0.0.1, proxy" }, body: JSON.stringify(body) }) as never, ctx);
beforeEach(() => { vi.clearAllMocks(); m.rate.mockReturnValue({ allowed: true, retryAfterMs: 100 }); m.rateResponse.mockReturnValue(Response.json({ error: "limit" }, { status: 429 })); m.findGroup.mockResolvedValue({ id: "g1", password: null }); m.compare.mockResolvedValue(true); m.poll.mockResolvedValue({ id: "p1", type: "multiple" }); m.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ groupPollVote: { deleteMany: vi.fn(), create: vi.fn(({ data }) => ({ id: data.optionId, ...data })) } })); });

describe("Öffentliche Gruppenabstimmung", () => {
  it("begrenzt Anfragen und behandelt fehlende Gruppe oder ungültige Eingaben", async () => {
    m.rate.mockReturnValueOnce({ allowed: false, retryAfterMs: 100 }); expect((await vote({})).status).toBe(429);
    m.findGroup.mockResolvedValueOnce(null); expect((await vote({})).status).toBe(404);
    expect((await vote({ voterName: "", pollId: "p1", optionIds: ["o1"] })).status).toBe(400);
    expect((await vote({ voterName: "Sam", pollId: "p1", optionIds: [] })).status).toBe(400);
    expect((await vote({ voterName: "Sam", pollId: "p1", optionIds: Array(51).fill("o") })).status).toBe(400);
  });
  it("prüft Gruppenpasswort, offene Umfrage und Auswahltyp", async () => {
    m.findGroup.mockResolvedValueOnce({ id: "g1", password: "hash" }); m.compare.mockResolvedValueOnce(false);
    expect((await vote({ voterName: "Sam", pollId: "p1", optionIds: ["o1"], password: "bad" })).status).toBe(403);
    m.poll.mockResolvedValueOnce(null); expect((await vote({ voterName: "Sam", pollId: "p1", optionIds: ["o1"] })).status).toBe(404);
    m.poll.mockResolvedValueOnce({ id: "p1", type: "single" }); expect((await vote({ voterName: "Sam", pollId: "p1", optionIds: ["a", "b"] })).status).toBe(400);
  });
  it("ersetzt frühere Gaststimmen atomar und gibt neue Stimmen zurück", async () => {
    const response = await vote({ voterName: "  Sam  ", pollId: "p1", optionIds: ["a", "b"] });
    expect(response.status).toBe(201); expect(await response.json()).toEqual([{ id: "a", optionId: "a", voterName: "Sam" }, { id: "b", optionId: "b", voterName: "Sam" }]);
    expect(m.transaction).toHaveBeenCalledOnce();
  });
  it("behandelt Fehler beim Schreiben generisch", async () => {
    m.transaction.mockRejectedValueOnce(new Error("database")); const response = await vote({ voterName: "Sam", pollId: "p1", optionIds: ["a"] });
    expect(response.status).toBe(500); expect(await response.json()).toEqual({ error: "Interner Fehler" }); expect(m.error).toHaveBeenCalledOnce();
  });
});
