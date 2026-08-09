import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    $transaction: vi.fn(),
    apiLog: { create: vi.fn() },
    game: { count: vi.fn(() => Promise.resolve(0)) },
    gameSession: { count: vi.fn(() => Promise.resolve(0)) },
    event: { count: vi.fn(() => Promise.resolve(0)) },
    group: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { GET } from "@/app/api/mobile/v1/me/route";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedTransaction = vi.mocked(prisma.$transaction);

describe("GET /api/mobile/v1/me", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("returns profile and totals", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", name: "Max", email: "a@b.c", role: "USER" } } as never);
    mockedTransaction.mockResolvedValue([5, 12, 3, 2] as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/me"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.id).toBe("u1");
    expect(body.totals).toEqual({ ownedGames: 5, sessions: 12, events: 3, groups: 2 });
  });

  it("returns 401 when not authenticated", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/me"), {});
    expect(res.status).toBe(401);
  });
});
