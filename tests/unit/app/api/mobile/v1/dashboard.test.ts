import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  default: {
    $transaction: vi.fn(),
    apiLog: { create: vi.fn() },
    game: { count: vi.fn(() => Promise.resolve(0)) },
    gameSession: { count: vi.fn(() => Promise.resolve(0)), aggregate: vi.fn(() => Promise.resolve({ _sum: { durationMinutes: 0 } })) },
    event: { count: vi.fn(() => Promise.resolve(0)) },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));

import { GET } from "@/app/api/mobile/v1/dashboard/route";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedTransaction = vi.mocked(prisma.$transaction);

describe("GET /api/mobile/v1/dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedTransaction.mockResolvedValue([5, 12, 3, { _sum: { durationMinutes: 720 } }] as never);
  });

  it("returns dashboard stats", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", name: "Max", email: "a@b.c", role: "USER" } } as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/dashboard"), {});
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ games: 5, sessions: 12, events: 3, totalDurationMinutes: 720 });
  });

  it("returns 401 when not authenticated", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await GET(new NextRequest("http://localhost:3000/api/mobile/v1/dashboard"), {});
    expect(res.status).toBe(401);
  });
});
