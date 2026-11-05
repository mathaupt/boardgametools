import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), mutation: vi.fn(), userFind: vi.fn(), notify: vi.fn(), log: vi.fn(), handle: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, ApiError: class ApiError extends Error { statusCode: number; constructor(statusCode: number, message: string) { super(message); this.statusCode = statusCode; } }, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { user: { findUnique: m.userFind } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { MISSING_GAME_ID: "Spiel-ID fehlt", GAME_NOT_FOUND: "Spiel nicht gefunden", GAME_ALREADY_PROPOSED: "Spiel bereits vorgeschlagen", MISSING_PROPOSAL_ID: "Vorschlags-ID fehlt", PROPOSAL_NOT_FOUND: "Vorschlag nicht gefunden", PROPOSAL_DELETED: "Vorschlag gelöscht" } }));
vi.mock("@/lib/services/push.service", () => ({ notifyNewGameProposal: m.notify }));
vi.mock("@/lib/logger", () => ({ default: { error: m.log } }));
vi.mock("@/lib/services/event-mutation.service", () => ({ withEventMutation: m.mutation }));
import { POST, DELETE } from "@/app/api/events/[id]/proposals/route";
const proposal = { id: "p1", gameId: "g1", game: { name: "Catan" }, proposedBy: { id: "u1", name: "Alex", email: "alex@test.de" }, _count: { votes: 2, guestVotes: 1 } };
function req(method: string, body?: unknown, proposalId?: string) { return new Request(`http://local/api/events/e1/proposals${proposalId ? `?proposalId=${proposalId}` : ""}`, { method, headers: { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) as never; }
function context(createdById = "owner") { const tx = { game: { findFirst: vi.fn().mockResolvedValue({ id: "g1", name: "Catan" }) }, gameProposal: { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue(proposal), delete: vi.fn() } }; const event = { createdById, title: "Abend" }; m.mutation.mockImplementation(async (_identity: unknown, _action: unknown, callback: (context: unknown) => unknown) => callback({ tx, event })); return tx; }
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "u1" }); m.handle.mockImplementation((error: unknown) => Response.json({ error: (error as Error).message }, { status: (error as { statusCode?: number }).statusCode ?? 500 })); m.userFind.mockResolvedValue({ name: "Alex", email: "alex@test.de" }); m.notify.mockResolvedValue(undefined); });

describe("Event-Spielvorschläge CRUD", () => {
  it("validiert Anlage, prüft Spielbesitz und Duplikate und liefert Stimmenzahl", async () => {
    expect((await POST(req("POST", {}), { params: Promise.resolve({ id: "e1" }) })).status).toBe(400);
    const tx = context(); tx.game.findFirst.mockResolvedValueOnce(null);
    expect((await POST(req("POST", { gameId: "foreign" }), { params: Promise.resolve({ id: "e1" }) })).status).toBe(404);
    const duplicate = context(); duplicate.gameProposal.findFirst.mockResolvedValueOnce({ id: "p0" });
    expect((await POST(req("POST", { gameId: "g1" }), { params: Promise.resolve({ id: "e1" }) })).status).toBe(400);
    context(); const response = await POST(req("POST", { gameId: "g1" }), { params: Promise.resolve({ id: "e1" }) });
    expect(response.status).toBe(201); expect(await response.json()).toMatchObject({ id: "p1", totalVotes: 3 });
    expect(m.notify).toHaveBeenCalledWith("owner", "e1", "Abend", "Alex", "Catan");
  });
  it("überspringt Push für Ersteller und protokolliert fehlgeschlagene Benachrichtigungen", async () => {
    context("u1"); await POST(req("POST", { gameId: "g1" }), { params: Promise.resolve({ id: "e1" }) }); expect(m.notify).not.toHaveBeenCalled();
    context(); m.notify.mockRejectedValueOnce(new Error("push")); await POST(req("POST", { gameId: "g1" }), { params: Promise.resolve({ id: "e1" }) }); expect(m.log).toHaveBeenCalledOnce();
  });
  it("löscht nur berechtigte Vorschläge und behandelt fehlende IDs", async () => {
    expect((await DELETE(req("DELETE"), { params: Promise.resolve({ id: "e1" }) })).status).toBe(400);
    const tx = context(); tx.gameProposal.findFirst.mockResolvedValueOnce({ id: "p1", proposedById: "u1" });
    expect(await (await DELETE(req("DELETE", undefined, "p1"), { params: Promise.resolve({ id: "e1" }) })).json()).toEqual({ message: "Vorschlag gelöscht" });
    expect(tx.gameProposal.delete).toHaveBeenCalledWith({ where: { id: "p1" } });
    const absent = context(); absent.gameProposal.findFirst.mockResolvedValueOnce(null);
    expect((await DELETE(req("DELETE", undefined, "gone"), { params: Promise.resolve({ id: "e1" }) })).status).toBe(404);
    context("owner"); const unauthorized = context("another"); unauthorized.gameProposal.findFirst.mockResolvedValueOnce({ id: "p1", proposedById: "other" });
    expect((await DELETE(req("DELETE", undefined, "p1"), { params: Promise.resolve({ id: "e1" }) })).status).toBe(404);
  });
});
