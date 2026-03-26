import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("next/server", () => ({
  NextResponse: { json: vi.fn((body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 })) },
}));

vi.mock("@/lib/db", () => ({
  default: {
    group: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/cache", () => ({
  cachedQuery: vi.fn((_fn: () => Promise<unknown>, _keys: string[], _opts?: unknown) => _fn()),
  invalidateTag: vi.fn(),
}));

vi.mock("@/lib/cache-tags", () => ({
  CacheTags: {
    userGroups: (id: string) => `groups-${id}`,
    userDashboard: (id: string) => `dash-${id}`,
  },
}));

vi.mock("@/lib/validation", () => ({
  validateString: vi.fn(() => null),
  firstError: vi.fn((...args: unknown[]) => args.find(Boolean) || null),
}));

import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { GroupService } from "@/lib/services/group.service";
import { ApiError } from "@/lib/require-auth";
import { firstError } from "@/lib/validation";

const uid = "user-1";
const gid = "group-1";

const fakeGroup = {
  id: gid,
  name: "Game Night",
  description: "Weekly games",
  ownerId: uid,
  isPublic: false,
  deletedAt: null,
  owner: { id: uid, name: "Alice", email: "a@b.com" },
  members: [{ userId: uid, role: "owner", user: { id: uid, name: "Alice", email: "a@b.com" } }],
  events: [],
  _count: { members: 1, polls: 0, events: 0 },
};

describe("GroupService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── list ──────────────────────────────────────────────────────

  it("list – returns groups the user owns or is a member of", async () => {
    const groups = [fakeGroup];
    vi.mocked(prisma.group.findMany).mockResolvedValue(groups as never);

    const result = await GroupService.list(uid);

    expect(result).toEqual(groups);
    expect(prisma.group.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { ownerId: uid },
            { members: { some: { userId: uid } } },
          ],
        }),
      })
    );
  });

  // ── getById ───────────────────────────────────────────────────

  it("getById – returns group with full includes for member", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(fakeGroup as never);

    const result = await GroupService.getById(uid, gid);

    expect(result).toEqual(fakeGroup);
    expect(prisma.group.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: gid }),
        include: expect.objectContaining({ members: expect.any(Object) }),
      })
    );
  });

  it("getById – throws 404 when group not found", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(null as never);

    await expect(GroupService.getById(uid, "nope")).rejects.toThrow(ApiError);
    await expect(GroupService.getById(uid, "nope")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("getById – throws 403 when user is not member and group is not public", async () => {
    const privateGroup = {
      ...fakeGroup,
      ownerId: "other-user",
      isPublic: false,
      members: [{ userId: "other-user", role: "owner" }],
    };
    vi.mocked(prisma.group.findFirst).mockResolvedValue(privateGroup as never);

    await expect(GroupService.getById(uid, gid)).rejects.toThrow(ApiError);
    await expect(GroupService.getById(uid, gid)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  // ── create ────────────────────────────────────────────────────

  it("create – creates group with owner membership and invalidates cache", async () => {
    vi.mocked(prisma.group.create).mockResolvedValue(fakeGroup as never);

    const result = await GroupService.create(uid, { name: "Game Night", description: "Weekly games" });

    expect(result).toEqual(fakeGroup);
    expect(prisma.group.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "Game Night",
          ownerId: uid,
          members: { create: { userId: uid, role: "owner" } },
        }),
      })
    );
    expect(invalidateTag).toHaveBeenCalledWith(`groups-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`dash-${uid}`);
  });

  it("create – throws 400 on validation error", async () => {
    vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

    await expect(GroupService.create(uid, { name: "" })).rejects.toThrow(ApiError);

    vi.mocked(firstError).mockReturnValueOnce("Name is required" as never);

    await expect(
      GroupService.create(uid, { name: "" })
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(prisma.group.create).not.toHaveBeenCalled();
  });

  // ── update ────────────────────────────────────────────────────

  it("update – updates group for owner and invalidates cache", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(fakeGroup as never);
    const updated = { ...fakeGroup, name: "New Name" };
    vi.mocked(prisma.group.update).mockResolvedValue(updated as never);

    const result = await GroupService.update(uid, gid, { name: "New Name" });

    expect(result).toEqual(updated);
    expect(prisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: gid },
        data: expect.objectContaining({ name: "New Name" }),
      })
    );
    expect(invalidateTag).toHaveBeenCalledWith(`groups-${uid}`);
  });

  it("update – throws 404 when group not found or user is not owner", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(null as never);

    await expect(GroupService.update(uid, gid, { name: "X" })).rejects.toThrow(ApiError);
    await expect(GroupService.update(uid, gid, { name: "X" })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });

  // ── delete ────────────────────────────────────────────────────

  it("delete – soft-deletes group for owner and invalidates cache", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(fakeGroup as never);
    vi.mocked(prisma.group.update).mockResolvedValue({} as never);

    const result = await GroupService.delete(uid, gid);

    expect(result).toEqual({ message: "Group deleted" });
    expect(prisma.group.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: gid },
        data: { deletedAt: expect.any(Date) },
      })
    );
    expect(invalidateTag).toHaveBeenCalledWith(`groups-${uid}`);
    expect(invalidateTag).toHaveBeenCalledWith(`dash-${uid}`);
  });

  it("delete – throws 404 when group not found or user is not owner", async () => {
    vi.mocked(prisma.group.findFirst).mockResolvedValue(null as never);

    await expect(GroupService.delete(uid, gid)).rejects.toThrow(ApiError);
    await expect(GroupService.delete(uid, gid)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prisma.group.update).not.toHaveBeenCalled();
  });
});
