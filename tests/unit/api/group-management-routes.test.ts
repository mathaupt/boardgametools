import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const db = {
    $transaction: vi.fn(),
    group: { findFirst: vi.fn(), update: vi.fn() },
    groupMember: { findFirst: vi.fn(), create: vi.fn(), delete: vi.fn() },
    groupChallengeParticipant: { updateMany: vi.fn() },
    user: { findUnique: vi.fn() },
  };
  return { db, auth: vi.fn(), hash: vi.fn(), invalidate: vi.fn() };
});

vi.mock("@/lib/api-logger", () => ({ withApiLogging: (handler: unknown) => handler }));
vi.mock("@/lib/require-auth", () => ({ requireAuth: mocks.auth, handleApiError: (error: { statusCode?: number; message?: string }) => Response.json({ error: error.message }, { status: error.statusCode ?? 500 }) }));
vi.mock("@/lib/db", () => ({ default: mocks.db }));
vi.mock("@/lib/cache", () => ({ invalidateTag: mocks.invalidate }));
vi.mock("bcryptjs", () => ({ hash: mocks.hash }));

import { GET as getGroup, PUT as updateGroup, DELETE as deleteGroup } from "@/app/api/groups/[id]/route";
import { POST as addMember, DELETE as removeMember } from "@/app/api/groups/[id]/members/route";

const params = { params: Promise.resolve({ id: "group-1" }) };
const request = (method: string, body?: unknown) => new Request("http://localhost/api/groups/group-1", {
  method,
  ...(body === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
}) as never;

describe("group detail and member routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ userId: "owner" });
    mocks.db.group.findFirst.mockResolvedValue({ id: "group-1", ownerId: "owner", password: "secret-hash" });
    mocks.db.group.update.mockResolvedValue({ id: "group-1", name: "Tabletop" });
    mocks.db.groupMember.findFirst.mockResolvedValue({ id: "member-owner", role: "owner" });
    mocks.db.user.findUnique.mockResolvedValue({ id: "user-2", name: "Ada", email: "ada@example.test" });
    mocks.db.$transaction.mockImplementation(async (callback) => callback(mocks.db));
    mocks.hash.mockResolvedValue("hashed-password");
  });

  it("returns group details without password hashes and handles missing groups", async () => {
    const response = await getGroup(request("GET"), params);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ hasPassword: true, id: "group-1" });
    expect(await (await getGroup(request("GET"), params)).json()).not.toHaveProperty("password");

    mocks.db.group.findFirst.mockResolvedValue(null);
    expect((await getGroup(request("GET"), params)).status).toBe(404);
  });

  it("validates owner updates, hashes passwords, and invalidates group caches", async () => {
    mocks.db.group.findFirst.mockResolvedValueOnce(null);
    expect((await updateGroup(request("PUT", { name: "New" }), params)).status).toBe(404);
    expect((await updateGroup(request("PUT", { name: "" }), params)).status).toBe(400);

    const response = await updateGroup(request("PUT", { name: "New", description: "", password: "secret" }), params);
    expect(response.status).toBe(200);
    expect(mocks.hash).toHaveBeenCalledWith("secret", 12);
    expect(mocks.db.group.update).toHaveBeenCalledWith(expect.objectContaining({ data: { name: "New", description: null, password: "hashed-password" } }));
    expect(mocks.invalidate).toHaveBeenCalledTimes(2);
  });

  it("soft-deletes an owned group and rejects non-owners", async () => {
    mocks.db.group.findFirst.mockResolvedValueOnce(null);
    expect((await deleteGroup(request("DELETE"), params)).status).toBe(404);
    const response = await deleteGroup(request("DELETE"), params);
    expect(response.status).toBe(200);
    expect(mocks.db.group.update).toHaveBeenCalledWith({ where: { id: "group-1" }, data: { deletedAt: expect.any(Date) } });
  });

  it("validates member additions and prevents unauthorized or duplicate invitations", async () => {
    mocks.db.groupMember.findFirst.mockResolvedValue(null);
    expect((await addMember(request("POST", { email: "ada@example.test" }), params)).status).toBe(403);
    mocks.db.groupMember.findFirst.mockResolvedValue({ role: "admin" });
    expect((await addMember(request("POST", { email: "invalid" }), params)).status).toBe(400);
    mocks.db.user.findUnique.mockResolvedValue(null);
    expect((await addMember(request("POST", { email: "missing@example.test" }), params)).status).toBe(404);

    mocks.db.user.findUnique.mockResolvedValue({ id: "user-2" });
    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ role: "admin" }).mockResolvedValueOnce({ id: "existing" });
    expect((await addMember(request("POST", { email: "ada@example.test" }), params)).status).toBe(409);
  });

  it("adds a valid group member and returns only selected user details", async () => {
    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ id: "owner", role: "owner" }).mockResolvedValueOnce(null);
    mocks.db.groupMember.create.mockResolvedValue({ id: "member-2", user: { id: "user-2", name: "Ada", email: "ada@example.test" } });
    const response = await addMember(request("POST", { email: "ada@example.test" }), params);
    expect(response.status).toBe(201);
    expect(mocks.db.groupMember.create).toHaveBeenCalledWith(expect.objectContaining({ include: { user: { select: { id: true, name: true, email: true } } } }));
  });

  it("protects member removal and closes active group challenges before deleting", async () => {
    expect((await removeMember(request("DELETE", {}), params)).status).toBe(400);
    mocks.db.groupMember.findFirst.mockResolvedValueOnce(null);
    expect((await removeMember(request("DELETE", { userId: "user-2" }), params)).status).toBe(403);
    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ id: "member-1", role: "member" });
    expect((await removeMember(request("DELETE", { userId: "user-2" }), params)).status).toBe(403);

    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ id: "member-owner", role: "owner" }).mockResolvedValueOnce(null);
    expect((await removeMember(request("DELETE", { userId: "user-2" }), params)).status).toBe(404);
    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ id: "member-owner", role: "owner" }).mockResolvedValueOnce({ id: "owner", role: "owner" });
    expect((await removeMember(request("DELETE", { userId: "owner" }), params)).status).toBe(400);

    mocks.db.groupMember.findFirst.mockResolvedValueOnce({ id: "member-owner", role: "owner" }).mockResolvedValueOnce({ id: "member-2", role: "member" });
    expect((await removeMember(request("DELETE", { userId: "user-2" }), params)).status).toBe(200);
    expect(mocks.db.groupChallengeParticipant.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ challenge: { groupId: "group-1", status: "active" } }) }));
    expect(mocks.db.groupMember.delete).toHaveBeenCalledWith({ where: { id: "member-2" } });
  });
});
