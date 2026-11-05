import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), member: vi.fn(), poll: vi.fn(), user: vi.fn(), tx: vi.fn(), error: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }) } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.error }));
vi.mock("@/lib/error-messages", () => ({ Errors: { NOT_A_MEMBER: "Kein Mitglied", POLL_NOT_FOUND_OR_CLOSED: "Umfrage geschlossen", OPTION_IDS_REQUIRED: "Optionen erforderlich", SINGLE_CHOICE_ONLY_ONE: "Nur eine Auswahl" } }));
vi.mock("@/lib/db", () => ({ default: { groupMember: { findFirst: m.member }, groupPoll: { findFirst: m.poll }, user: { findUnique: m.user }, $transaction: m.tx } }));
import { POST } from "@/app/api/groups/[id]/polls/[pollId]/vote/route";
const ctx = { params: Promise.resolve({ id: "group-1", pollId: "poll-1" }) };
const req = (optionIds: unknown) => ({ json: async () => ({ optionIds }) });

beforeEach(() => {
  vi.clearAllMocks();
  m.auth.mockResolvedValue({ userId: "user-1" });
  m.member.mockResolvedValue({ id: "member-1" });
  m.poll.mockResolvedValue({ type: "multiple" });
  m.user.mockResolvedValue({ name: "Alex" });
  m.tx.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({ groupPollVote: { deleteMany: vi.fn(), create: vi.fn(({ data }) => ({ id: "vote-1", ...data })) } }));
  m.error.mockImplementation((error: Error) => ({ status: 500, body: { error: error.message } }));
});

describe("POST group poll vote", () => {
  it("checks membership, open poll, required options and choice limits", async () => {
    m.member.mockResolvedValueOnce(null);
    expect(await POST(req(["o1"]) as never, ctx)).toMatchObject({ status: 403 });
    m.poll.mockResolvedValueOnce(null);
    expect(await POST(req(["o1"]) as never, ctx)).toMatchObject({ status: 404 });
    for (const options of [undefined, [], Array.from({ length: 51 }, (_, i) => `o${i}`)]) {
      const response = await POST(req(options) as never, ctx);
      expect(response.status).toBe(options?.length ? 400 : 400);
    }
    m.poll.mockResolvedValueOnce({ type: "single" });
    expect(await POST(req(["o1", "o2"]) as never, ctx)).toMatchObject({ status: 400 });
    expect(m.tx).not.toHaveBeenCalled();
  });

  it("replaces votes with the user's name or a fallback and returns created votes", async () => {
    const response = await POST(req(["o1", "o2"]) as never, ctx);
    expect(response).toMatchObject({ status: 201, body: [{ voterName: "Alex" }, { voterName: "Alex" }] });
    m.user.mockResolvedValueOnce(null);
    const fallback = await POST(req(["o3"]) as never, ctx);
    expect(fallback.body).toMatchObject([{ voterName: "Unbekannt" }]);
  });

  it("forwards authentication, JSON and database errors to the shared handler", async () => {
    const authError = new Error("unauthorized"); m.auth.mockRejectedValueOnce(authError);
    await expect(POST(req(["o1"]) as never, ctx)).rejects.toBe(authError);
    const parseError = new Error("bad json"); await POST({ json: async () => { throw parseError; } } as never, ctx);
    expect(m.error).toHaveBeenCalledWith(parseError);
    const dbError = new Error("write failed"); m.tx.mockRejectedValueOnce(dbError);
    await POST(req(["o1"]) as never, ctx); expect(m.error).toHaveBeenCalledWith(dbError);
  });
});
