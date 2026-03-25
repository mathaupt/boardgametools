import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString, firstError } from "@/lib/validation";
import { NOT_DELETED, SAFE_USER_SELECT } from "./shared";

// ── Types ────────────────────────────────────────────────────────

export interface CreateGroupInput {
  name: string;
  description?: string;
}

export interface UpdateGroupInput {
  name?: string;
  description?: string;
}

// ── Service ──────────────────────────────────────────────────────

const groupListInclude = {
  owner: { select: SAFE_USER_SELECT },
  _count: { select: { members: true, polls: true, events: true } },
};

export const GroupService = {
  /** List groups the user owns or is a member of */
  async list(userId: string) {
    return prisma.group.findMany({
      where: {
        ...NOT_DELETED,
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: groupListInclude,
      orderBy: { updatedAt: "desc" },
    });
  },

  /** Get a single group with full details */
  async getById(userId: string, groupId: string) {
    const group = await prisma.group.findFirst({
      where: { id: groupId, ...NOT_DELETED },
      include: {
        owner: { select: SAFE_USER_SELECT },
        members: {
          include: { user: { select: SAFE_USER_SELECT } },
          orderBy: { joinedAt: "asc" },
        },
        events: {
          orderBy: { eventDate: "desc" },
          take: 10,
        },
        _count: { select: { members: true, polls: true, events: true } },
      },
    });
    if (!group) throw new ApiError(404, "Group not found");

    // Check membership
    const isMember = group.ownerId === userId || group.members.some((m) => m.userId === userId);
    if (!isMember && !group.isPublic) throw new ApiError(403, "Forbidden");

    return group;
  },

  /** Create a new group */
  async create(userId: string, input: CreateGroupInput) {
    const validationError = firstError(
      validateString(input.name, "Name", { max: 200 }),
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const group = await prisma.group.create({
      data: {
        name: input.name,
        description: input.description || null,
        ownerId: userId,
        members: {
          create: { userId, role: "owner" },
        },
      },
      include: {
        owner: { select: SAFE_USER_SELECT },
        members: { include: { user: { select: SAFE_USER_SELECT } } },
        _count: { select: { members: true, polls: true, events: true } },
      },
    });

    invalidateTag(CacheTags.userGroups(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return group;
  },

  /** Update a group */
  async update(userId: string, groupId: string, input: UpdateGroupInput) {
    const existing = await prisma.group.findFirst({
      where: { id: groupId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Group not found");

    const validationError = firstError(
      input.name ? validateString(input.name, "Name", { max: 200 }) : null,
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const updated = await prisma.group.update({
      where: { id: groupId },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.description !== undefined && { description: input.description }),
      },
      include: groupListInclude,
    });

    invalidateTag(CacheTags.userGroups(userId));
    return updated;
  },

  /** Soft-delete a group */
  async delete(userId: string, groupId: string) {
    const existing = await prisma.group.findFirst({
      where: { id: groupId, ownerId: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Group not found");

    await prisma.group.update({
      where: { id: groupId },
      data: { deletedAt: new Date() },
    });

    invalidateTag(CacheTags.userGroups(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return { message: "Group deleted" };
  },
};
