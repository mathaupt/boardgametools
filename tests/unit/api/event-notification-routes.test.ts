import { beforeEach, describe, expect, it, vi } from "vitest";

const m = vi.hoisted(() => ({ auth: vi.fn(), event: vi.fn(), inviteFind: vi.fn(), inviteCreate: vi.fn(), user: vi.fn(), mail: vi.fn(), reminder: vi.fn(), base: vi.fn(), encrypt: vi.fn(), validate: vi.fn(), error: vi.fn(), logger: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.error }));
vi.mock("@/lib/error-messages", () => ({ Errors: { EVENT_NOT_FOUND: "Event nicht gefunden", INVITE_NOT_FOUND: "Einladung nicht gefunden", MISSING_USER_IDS: "Nutzer erforderlich", REMINDER_SENT: "Erinnerung gesendet" } }));
vi.mock("@/lib/db", () => ({ default: { event: { findFirst: m.event }, eventInvite: { findFirst: m.inviteFind, findUnique: m.inviteFind, create: m.inviteCreate }, user: { findUnique: m.user } } }));
vi.mock("@/lib/mailer", () => ({ sendEventInviteEmail: m.mail, sendEventReminderEmail: m.reminder }));
vi.mock("@/lib/public-link", () => ({ getPublicBaseUrl: m.base }));
vi.mock("@/lib/crypto", () => ({ encryptId: m.encrypt }));
vi.mock("@/lib/validation", () => ({ validateString: m.validate }));
vi.mock("@/lib/logger", () => ({ default: { error: m.logger } }));
import { POST as share } from "@/app/api/events/[id]/share/route";
import { POST as resend } from "@/app/api/events/[id]/invites/resend/route";
const ctx = { params: Promise.resolve({ id: "event-1" }) };
const request = (body: unknown) => ({ json: async () => body });

beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "owner", name: "", email: "owner@example.test" });
  m.event.mockResolvedValue({ id: "event-1", title: "Abend", eventDate: new Date(), location: null });
  m.inviteFind.mockResolvedValue(null);
  m.inviteCreate.mockResolvedValue({ id: "invite-1" });
  m.user.mockResolvedValue({ id: "user-1", name: "Alex", email: "alex@example.test" });
  m.mail.mockResolvedValue(undefined); m.reminder.mockResolvedValue(undefined);
  m.base.mockResolvedValue("https://example.test"); m.encrypt.mockReturnValue("encrypted-invite");
  m.validate.mockReturnValue(null);
  m.error.mockImplementation((error: Error) => ({ status: 500, body: { error: error.message } }));
});

describe("Event invitation and reminder routes", () => {
  it("validates share input, creator access, and user IDs", async () => {
    for (const body of [{}, { userIds: "user-1" }, { userIds: [] }]) expect((await share(request(body) as never, ctx)).status).toBe(400);
    m.validate.mockReturnValueOnce("Ungültige ID");
    expect(await share(request({ userIds: ["bad"] }) as never, ctx)).toMatchObject({ status: 400, body: { error: "Ungültige ID" } });
    m.event.mockResolvedValueOnce(null);
    expect(await share(request({ userIds: ["u1"] }) as never, ctx)).toMatchObject({ status: 404 });
  });

  it("reuses existing invitations and creates registered or external invites", async () => {
    m.inviteFind.mockResolvedValueOnce({ id: "existing" });
    m.user.mockResolvedValueOnce({ id: "u1", name: "Alex", email: "alex@example.test" });
    const response = await share(request({ userIds: ["u0", "u1"] }) as never, ctx);
    expect(response).toMatchObject({ status: 200, body: { message: "Event shared with 2 users" } });
    expect(m.inviteCreate).toHaveBeenCalledOnce();
    expect(m.mail).toHaveBeenCalledWith(expect.objectContaining({ eventUrl: "https://example.test/dashboard/events/event-1", inviterName: "owner@example.test" }));
  });

  it("logs mail failure, handles missing users and forwards share errors", async () => {
    m.mail.mockRejectedValueOnce(new Error("SMTP down"));
    await share(request({ userIds: ["u1"] }) as never, ctx);
    expect(m.logger).toHaveBeenCalled();
    m.user.mockResolvedValueOnce(null);
    const missing = await share(request({ userIds: ["missing"] }) as never, ctx);
    expect(m.error).toHaveBeenCalled(); expect(missing.status).toBe(500);
    const badJson = new Error("bad json");
    await share({ json: async () => { throw badJson; } } as never, ctx);
    expect(m.error).toHaveBeenCalledWith(badJson);
  });

  it("validates reminder event, invitation state and recipient address", async () => {
    expect(await resend(request({}) as never, ctx)).toMatchObject({ status: 400 });
    m.event.mockResolvedValueOnce(null);
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 404 });
    m.inviteFind.mockResolvedValueOnce(null);
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 404 });
    m.inviteFind.mockResolvedValueOnce({ id: "i1", eventId: "another", status: "pending" });
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 404 });
    m.inviteFind.mockResolvedValueOnce({ id: "i1", eventId: "event-1", status: "accepted", email: "x@example.test" });
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 400 });
    m.inviteFind.mockResolvedValueOnce({ id: "i1", eventId: "event-1", status: "pending", email: null, user: null });
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 400 });
  });

  it("sends reminder links to registered users and external invitees", async () => {
    m.inviteFind.mockResolvedValueOnce({ id: "i1", eventId: "event-1", status: "pending", userId: "u1", email: null, user: { email: "alex@example.test" } });
    expect(await resend(request({ inviteId: "i1" }) as never, ctx)).toMatchObject({ status: 200 });
    expect(m.reminder).toHaveBeenLastCalledWith(expect.objectContaining({ eventUrl: "https://example.test/dashboard/events/event-1", inviterName: "owner@example.test" }));
    m.auth.mockResolvedValueOnce({ userId: "owner", name: "Host", email: "ignored@example.test" });
    m.inviteFind.mockResolvedValueOnce({ id: "i2", eventId: "event-1", status: "pending", userId: null, email: "outside@example.test", user: null });
    await resend(request({ inviteId: "i2" }) as never, ctx);
    expect(m.encrypt).toHaveBeenCalledWith("i2");
    expect(m.reminder).toHaveBeenLastCalledWith(expect.objectContaining({ eventUrl: "https://example.test/public/invite/encrypted-invite", inviterName: "Host" }));
  });
});
