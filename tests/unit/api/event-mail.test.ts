import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), event: vi.fn(), custom: vi.fn(), reminder: vi.fn(), base: vi.fn(), encrypt: vi.fn(), handle: vi.fn(), log: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { event: { findFirst: m.event } } }));
vi.mock("@/lib/mailer", () => ({ sendCustomEventMessage: m.custom, sendEventUpcomingReminder: m.reminder }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: m.base }));
vi.mock("@/lib/crypto", () => ({ encryptId: m.encrypt }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/logger", () => ({ default: { error: m.log } }));
vi.mock("@/lib/error-messages", () => ({ Errors: { INVALID_MAIL_TYPE: "Mailtyp ungültig", MESSAGE_REQUIRED_FOR_CUSTOM: "Nachricht erforderlich", EVENT_NOT_FOUND: "Event nicht gefunden" } }));
import { POST } from "@/app/api/events/[id]/mail/route";
const event = { title: "Abend", eventDate: new Date("2026-11-20T18:00:00Z"), location: "Berlin", invites: [
  { id: "i1", userId: "u2", email: null, status: "accepted", user: { email: "u2@example.test" } },
  { id: "i2", userId: null, email: "guest@example.test", status: "pending", user: null },
  { id: "i3", userId: null, email: null, status: "accepted", user: null },
  { id: "i4", userId: "u3", email: null, status: "declined", user: { email: "u3@example.test" } },
  { id: "self", userId: "u1", email: null, status: "accepted", user: { email: null } },
] };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "u1", name: null, email: null }); m.event.mockResolvedValue(event); m.custom.mockResolvedValue(undefined); m.reminder.mockResolvedValue(undefined); m.base.mockResolvedValue("https://app.test"); m.encrypt.mockImplementation((id: string) => `enc-${id}`); m.handle.mockImplementation(() => Response.json({ error: "server" }, { status: 500 })); });
const call = (body: unknown) => POST(new Request("http://local/api", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }) as never, { params: Promise.resolve({ id: "e1" }) });

describe("Event-Mailversand", () => {
  it("validiert Mailtyp und Pflichtnachricht sowie Erstellerzugriff", async () => {
    expect((await call({ type: "wrong" })).status).toBe(400);
    expect((await call({ type: "custom", message: "  " })).status).toBe(400);
    m.event.mockResolvedValueOnce(null); expect((await call({ type: "reminder" })).status).toBe(404);
  });
  it("sendet eigene Nachrichten an andere Empfänger und erstellt sichere Empfängerlinks", async () => {
    const response = await call({ type: "custom", message: "  Hallo  ", subject: "  Neuigkeiten  " });
    expect(await response.json()).toMatchObject({ sentCount: 3, failedCount: 0, totalRecipients: 4, message: "3 Nachrichten gesendet" });
    expect(m.custom).toHaveBeenNthCalledWith(1, expect.objectContaining({ to: "u2@example.test", senderName: "Der Organisator", message: "Hallo", subject: "Neuigkeiten", eventUrl: "https://app.test/dashboard/events/e1" }));
    expect(m.custom).toHaveBeenNthCalledWith(2, expect.objectContaining({ to: "guest@example.test", eventUrl: "https://app.test/public/invite/enc-i2" }));
    expect(m.custom).toHaveBeenNthCalledWith(3, expect.objectContaining({ to: "u3@example.test" }));
  });
  it("sendet Erinnerungen nur an angemeldete Gäste mit angenommener Einladung", async () => {
    const response = await call({ type: "reminder" });
    expect(await response.json()).toMatchObject({ sentCount: 1, failedCount: 0, totalRecipients: 3, message: "1 Erinnerung gesendet" });
    expect(m.reminder).toHaveBeenCalledOnce(); expect(m.reminder).toHaveBeenCalledWith(expect.objectContaining({ to: "u2@example.test", organizerName: "Der Organisator" }));
  });
  it("zählt Mailfehler und reicht unerwartete Fehler an den API-Handler weiter", async () => {
    m.auth.mockResolvedValueOnce({ userId: "u1", name: "Mia", email: "mia@example.test" }); m.custom.mockRejectedValueOnce(new Error("SMTP offline"));
    const response = await call({ type: "custom", message: "Hallo" });
    expect(await response.json()).toMatchObject({ sentCount: 2, failedCount: 1, totalRecipients: 4, errors: ["u2@example.test: SMTP offline"] }); expect(m.log).toHaveBeenCalledOnce();
    m.event.mockRejectedValueOnce(new Error("database")); expect((await call({ type: "reminder" })).status).toBe(500); expect(m.handle).toHaveBeenCalledOnce();
  });
});
