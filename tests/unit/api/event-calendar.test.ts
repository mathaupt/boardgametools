import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), eventFind: vi.fn(), handleError: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: class NextResponse extends Response { static json(body: unknown, init?: ResponseInit) { return Response.json(body, init); } } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handleError }));
vi.mock("@/lib/db", () => ({ default: { event: { findFirst: m.eventFind } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { EVENT_NOT_FOUND: "Event nicht gefunden", ACCESS_DENIED: "Zugriff verweigert" } }));
import { GET } from "@/app/api/events/[id]/calendar/route";
const event = { id: "e1", createdById: "owner", eventDate: new Date(2026, 10, 20, 18, 0, 0), title: "Spielabend!", description: "Bring Spiele", location: null, createdBy: { name: "Alex", email: "alex@example.test" }, invites: [{ userId: "guest", status: "accepted", user: { name: "Sam" } }, { userId: "owner", status: "declined", user: null }], proposals: [{ game: { name: "Catan" }, bggName: null }, { game: null, bggName: "Azul" }, { game: null, bggName: null }] };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "owner" }); m.eventFind.mockResolvedValue(event); m.handleError.mockImplementation(() => Response.json({ error: "forbidden" }, { status: 403 })); });
const call = () => GET(new Request("http://local/api/events/e1/calendar") as never, { params: Promise.resolve({ id: "e1" }) });

describe("Event-Kalenderexport", () => {
  it("liefert den Kalender für Ersteller mit Spielen, Teilnehmern und sicherem Downloadnamen", async () => {
    const response = await call(); const text = await response.text();
    expect(response.headers.get("Content-Type")).toBe("text/calendar"); expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(response.headers.get("Content-Disposition")).toContain("event-Spielabend-.ics");
    expect(text).toContain("SUMMARY:Spielabend!"); expect(text).toContain("1. Catan\\n2. Azul\\n3. Unbekannt");
    expect(text).toContain("✅ Sam\\n❌ Unbekannt"); expect(text).toContain("Ort: TBD"); expect(text).toContain("DTEND:20261120T210000Z");
  });
  it("erlaubt eingeladene Personen, aber verbirgt fremde und fehlende Events", async () => {
    m.auth.mockResolvedValueOnce({ userId: "guest" }); expect((await call()).status).toBe(200);
    m.auth.mockResolvedValueOnce({ userId: "stranger" }); expect((await call()).status).toBe(403);
    m.eventFind.mockResolvedValueOnce(null); expect((await call()).status).toBe(404);
  });
  it("übergibt Datenbankfehler an den gemeinsamen API-Handler", async () => {
    m.eventFind.mockRejectedValueOnce(new Error("db"));
    expect((await call()).status).toBe(403); expect(m.handleError).toHaveBeenCalledOnce();
  });
});
