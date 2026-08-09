import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: { apiLog: { create: vi.fn() } },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/services/session.service", () => ({
  SessionService: {
    list: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { GET as listSessions, POST as createSession } from "@/app/api/mobile/v1/sessions/route";
import { GET as getSession, PUT as updateSession, DELETE as deleteSession } from "@/app/api/mobile/v1/sessions/[id]/route";
import { apiAuth } from "@/lib/api-auth";
import { SessionService } from "@/lib/services/session.service";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedList = vi.mocked(SessionService.list);
const mockedGetById = vi.mocked(SessionService.getById);
const mockedCreate = vi.mocked(SessionService.create);
const mockedUpdate = vi.mocked(SessionService.update);
const mockedDelete = vi.mocked(SessionService.delete);

function authUser() {
  return { user: { id: "u1", email: "a@b.c", name: "Max", role: "USER" } };
}

const sampleSession = {
  id: "s1",
  gameId: "g1",
  playedAt: new Date("2024-01-01"),
  durationMinutes: 60,
  notes: null,
  createdAt: new Date("2024-01-01"),
  deletedAt: null,
  players: [{ id: "p1", userId: "u1", score: 10, isWinner: true, placement: 1 }],
  game: { id: "g1", name: "Azul" },
};

describe("Mobile Session Routes", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("lists sessions", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedList.mockResolvedValue([sampleSession] as never);

    const res = await listSessions(new NextRequest("http://localhost:3000/api/mobile/v1/sessions"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].gameId).toBe("g1");
  });

  it("creates a session", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedCreate.mockResolvedValue(sampleSession as never);

    const res = await createSession(
      new NextRequest("http://localhost:3000/api/mobile/v1/sessions", {
        method: "POST",
        body: JSON.stringify({
          gameId: "g1",
          playedAt: "2024-01-01T00:00:00.000Z",
          players: [{ userId: "u1" }],
        }),
      }),
      {}
    );

    expect(res.status).toBe(201);
  });

  it("gets a session", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedGetById.mockResolvedValue(sampleSession as never);

    const res = await getSession(new NextRequest("http://localhost:3000/api/mobile/v1/sessions/s1"), { params: Promise.resolve({ id: "s1" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("s1");
  });

  it("updates a session", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedUpdate.mockResolvedValue({ ...sampleSession, durationMinutes: 90 } as never);

    const res = await updateSession(
      new NextRequest("http://localhost:3000/api/mobile/v1/sessions/s1", {
        method: "PUT",
        body: JSON.stringify({ durationMinutes: 90 }),
      }),
      { params: Promise.resolve({ id: "s1" }) }
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.durationMinutes).toBe(90);
  });

  it("deletes a session", async () => {
    mockedApiAuth.mockResolvedValue(authUser() as never);
    mockedDelete.mockResolvedValue({} as never);

    const res = await deleteSession(new NextRequest("http://localhost:3000/api/mobile/v1/sessions/s1", { method: "DELETE" }), { params: Promise.resolve({ id: "s1" }) });

    expect(res.status).toBe(200);
    expect((await res.json()).message).toBe("Session gelöscht");
  });
});
