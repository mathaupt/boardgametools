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
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/api-auth", () => ({ apiAuth: vi.fn() }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("bcryptjs", () => ({ compare: vi.fn(), hash: vi.fn(() => Promise.resolve("hashed")) }));

import { GET, PUT } from "@/app/api/mobile/v1/me/route";
import { apiAuth } from "@/lib/api-auth";
import prisma from "@/lib/db";
import { compare } from "bcryptjs";

const mockedApiAuth = vi.mocked(apiAuth);
const mockedTransaction = vi.mocked(prisma.$transaction);
const mockedFindUnique = vi.mocked(prisma.user.findUnique);
const mockedUpdate = vi.mocked(prisma.user.update);
const mockedCompare = vi.mocked(compare);

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

describe("PUT /api/mobile/v1/me", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("updates name and returns user", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", name: "Max", email: "a@b.c", role: "USER" } } as never);
    mockedFindUnique.mockResolvedValue({ id: "u1", name: "Max", email: "a@b.c", role: "USER", passwordHash: "old" } as never);
    mockedUpdate.mockResolvedValue({ id: "u1", name: "Moritz", email: "a@b.c", role: "USER" } as never);

    const res = await PUT(
      new NextRequest("http://localhost:3000/api/mobile/v1/me", {
        method: "PUT",
        body: JSON.stringify({ name: "Moritz" }),
      }),
      {}
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.name).toBe("Moritz");
    expect(mockedUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "Moritz" } }));
  });

  it("updates password when current password is correct", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", name: "Max", email: "a@b.c", role: "USER" } } as never);
    mockedFindUnique.mockResolvedValue({ id: "u1", name: "Max", email: "a@b.c", role: "USER", passwordHash: "old" } as never);
    mockedUpdate.mockResolvedValue({ id: "u1", name: "Max", email: "a@b.c", role: "USER" } as never);
    mockedCompare.mockResolvedValue(true as never);

    const res = await PUT(
      new NextRequest("http://localhost:3000/api/mobile/v1/me", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: "oldpass", newPassword: "newpass123" }),
      }),
      {}
    );

    expect(res.status).toBe(200);
    expect(mockedCompare).toHaveBeenCalledWith("oldpass", "old");
    expect(mockedUpdate).toHaveBeenCalledWith(expect.objectContaining({ data: { passwordHash: "hashed" } }));
  });

  it("rejects password change when current password is wrong", async () => {
    mockedApiAuth.mockResolvedValue({ user: { id: "u1", name: "Max", email: "a@b.c", role: "USER" } } as never);
    mockedFindUnique.mockResolvedValue({ id: "u1", name: "Max", email: "a@b.c", role: "USER", passwordHash: "old" } as never);
    mockedCompare.mockResolvedValue(false as never);

    const res = await PUT(
      new NextRequest("http://localhost:3000/api/mobile/v1/me", {
        method: "PUT",
        body: JSON.stringify({ currentPassword: "wrong", newPassword: "newpass123" }),
      }),
      {}
    );

    expect(res.status).toBe(403);
    expect(mockedUpdate).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    mockedApiAuth.mockResolvedValue(null as never);

    const res = await PUT(
      new NextRequest("http://localhost:3000/api/mobile/v1/me", {
        method: "PUT",
        body: JSON.stringify({ name: "Moritz" }),
      }),
      {}
    );
    expect(res.status).toBe(401);
  });
});
