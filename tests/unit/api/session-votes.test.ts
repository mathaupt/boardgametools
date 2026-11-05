import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), find: vi.fn(), upsert: vi.fn(), handle: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { gameSession: { findFirst: m.find }, sessionRating: { upsert: m.upsert } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { SESSION_NOT_FOUND: "Session nicht gefunden", ACCESS_DENIED: "Zugriff verweigert" } }));
import { GET, POST } from "@/app/api/sessions/[id]/votes/route";
const session = { id: "s1", createdById: "owner", players: [{ userId: "player" }], ratings: [] };
const ctx = { params: Promise.resolve({ id: "s1" }) };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "player" }); m.find.mockResolvedValue(session); m.upsert.mockResolvedValue({ id: "r1", rating: 4 }); m.handle.mockImplementation(() => Response.json({ error: "server" }, { status: 500 })); });
const req = (method: string, body?: unknown) => new Request("http://local/api", { method, headers: { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) as never;

describe("Sessionbewertungen", () => {
  it("liefert Bewertungen für Beteiligte und Ersteller, aber keine fremden Sessions", async () => {
    expect((await GET(req("GET"), ctx)).status).toBe(200);
    m.auth.mockResolvedValueOnce({ userId: "owner" }); expect((await GET(req("GET"), ctx)).status).toBe(200);
    m.auth.mockResolvedValueOnce({ userId: "stranger" }); expect((await GET(req("GET"), ctx)).status).toBe(403);
    m.find.mockResolvedValueOnce(null); expect((await GET(req("GET"), ctx)).status).toBe(404);
  });
  it("validiert Sterne, Sessionzugriff und speichert Bewertung sowie normalisierten Kommentar", async () => {
    expect((await POST(req("POST", { rating: 0 }), ctx)).status).toBe(400);
    expect((await POST(req("POST", { rating: "5" }), ctx)).status).toBe(400);
    m.find.mockResolvedValueOnce(null); expect((await POST(req("POST", { rating: 5 }), ctx)).status).toBe(404);
    m.find.mockResolvedValueOnce({ ...session, players: [] }); m.auth.mockResolvedValueOnce({ userId: "stranger" }); expect((await POST(req("POST", { rating: 5 }), ctx)).status).toBe(403);
    const response = await POST(req("POST", { rating: 4, comment: "  Schön gespielt  " }), ctx);
    expect(response.status).toBe(201); expect(m.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { sessionId_userId: { sessionId: "s1", userId: "player" } }, create: expect.objectContaining({ rating: 4, comment: "Schön gespielt" }), update: expect.objectContaining({ rating: 4, comment: "Schön gespielt" }) }));
  });
});
