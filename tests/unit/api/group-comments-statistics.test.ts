import { beforeEach, describe, expect, it, vi } from "vitest";
const m = vi.hoisted(() => ({ auth: vi.fn(), member: vi.fn(), userFind: vi.fn(), commentFind: vi.fn(), commentCount: vi.fn(), commentGroupBy: vi.fn(), commentCreate: vi.fn(), groupFind: vi.fn(), memberCount: vi.fn(), memberFind: vi.fn(), polls: vi.fn(), eventCount: vi.fn(), handle: vi.fn() }));
vi.mock("next/server", () => ({ NextResponse: { json: (body: unknown, init?: ResponseInit) => Response.json(body, init) } }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: m.auth, handleApiError: m.handle }));
vi.mock("@/lib/db", () => ({ default: { groupMember: { findFirst: m.member, count: m.memberCount, findMany: m.memberFind }, user: { findUnique: m.userFind }, groupComment: { findMany: m.commentFind, count: m.commentCount, groupBy: m.commentGroupBy, create: m.commentCreate }, groupPoll: { findMany: m.polls }, group: { findFirst: m.groupFind }, event: { count: m.eventCount } } }));
vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/error-messages", () => ({ Errors: { NOT_A_MEMBER: "Kein Gruppenmitglied", NOT_FOUND: "Gruppe nicht gefunden" } }));
import { GET as commentsGET, POST as commentsPOST } from "@/app/api/groups/[id]/comments/route";
import { GET as statisticsGET } from "@/app/api/groups/[id]/statistics/route";
const ctx = { params: Promise.resolve({ id: "g1" }) };
beforeEach(() => { vi.clearAllMocks(); m.auth.mockResolvedValue({ userId: "u1" }); m.member.mockResolvedValue({ id: "m1" }); m.userFind.mockResolvedValue(null); m.commentFind.mockResolvedValue([{ id: "c1" }]); m.commentCount.mockResolvedValue(3); m.commentGroupBy.mockResolvedValue([{ authorName: "Alex", _count: { id: 2 } }]); m.commentCreate.mockResolvedValue({ id: "c2" }); m.groupFind.mockResolvedValue({ id: "g1" }); m.memberCount.mockResolvedValue(3); m.memberFind.mockResolvedValue([{ user: { id: "u1", name: "Alex" }, joinedAt: new Date("2026-01-01"), role: "owner" }]); m.polls.mockResolvedValue([{ status: "open", options: [{ _count: { votes: 2 } }] }, { status: "closed", options: [{ _count: { votes: 3 } }] }]); m.eventCount.mockResolvedValue(4); m.handle.mockImplementation(() => Response.json({ error: "server" }, { status: 500 })); });
const request = (method: string, body?: unknown, pollId?: string) => new Request(`http://local/api${pollId ? `?pollId=${pollId}` : ""}`, { method, headers: { "content-type": "application/json" }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) }) as never;

describe("Gruppenkommentare und Statistiken", () => {
  it("beschränkt Kommentare auf Mitglieder und den angefragten Umfragekontext", async () => {
    m.member.mockResolvedValueOnce(null); expect((await commentsGET(request("GET"), ctx)).status).toBe(403);
    const response = await commentsGET(request("GET", undefined, "p1"), ctx); expect(await response.json()).toEqual([{ id: "c1" }]);
    expect(m.commentFind).toHaveBeenCalledWith({ where: { groupId: "g1", pollId: "p1" }, orderBy: { createdAt: "asc" } });
  });
  it("validiert und speichert Gruppenkommentare mit sicherem Autorennamen", async () => {
    expect((await commentsPOST(request("POST", { content: "" }), ctx)).status).toBe(400);
    const response = await commentsPOST(request("POST", { content: "  Hallo  ", pollId: "p1" }), ctx);
    expect(response.status).toBe(201); expect(m.commentCreate).toHaveBeenCalledWith({ data: { groupId: "g1", pollId: "p1", authorName: "Unbekannt", userId: "u1", content: "Hallo" } });
  });
  it("aggregiert Umfragen, Stimmen, Mitglieder, Kommentare und Aktivität pro Monat", async () => {
    m.commentFind.mockResolvedValueOnce([{ createdAt: new Date(2026, 0, 3) }, { createdAt: new Date(2026, 0, 20) }, { createdAt: new Date(2026, 1, 1) }]);
    const response = await statisticsGET(request("GET"), ctx); const body = await response.json();
    expect(body.overview).toEqual({ memberCount: 3, pollCount: 2, openPolls: 1, closedPolls: 1, commentCount: 3, eventCount: 4, totalVotes: 5, avgParticipation: 2.5 });
    expect(body.members[0]).toMatchObject({ id: "u1", name: "Alex", role: "owner" }); expect(body.monthlyActivity).toHaveLength(2);
  });
  it("weist fremde Gruppen ab und behandelt Statistikfehler über den gemeinsamen Handler", async () => {
    m.groupFind.mockResolvedValueOnce(null); expect((await statisticsGET(request("GET"), ctx)).status).toBe(404);
    m.groupFind.mockResolvedValueOnce({ id: "g1" }); m.polls.mockRejectedValueOnce(new Error("db"));
    expect((await statisticsGET(request("GET"), ctx)).status).toBe(500); expect(m.handle).toHaveBeenCalledOnce();
  });
});
