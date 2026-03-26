import prisma from "@/lib/db";
import { cachedQuery, invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { validateString, firstError } from "@/lib/validation";
import { sendEventInviteEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { NOT_DELETED, SAFE_USER_SELECT, buildPagination, paginatedResponse } from "./shared";
import logger from "@/lib/logger";

// ── Types ────────────────────────────────────────────────────────

export interface CreateEventInput {
  title: string;
  description?: string;
  eventDate: string;
  location?: string;
  groupId?: string;
  inviteEmails?: string[];
}

export interface UpdateEventInput {
  title?: string;
  description?: string;
  eventDate?: string;
  location?: string;
  groupId?: string;
  status?: string;
}

// ── Service ──────────────────────────────────────────────────────

const eventListInclude = {
  invites: {
    include: { user: { select: SAFE_USER_SELECT } },
  },
  proposals: {
    include: {
      game: true,
      _count: { select: { votes: true } },
    },
  },
  selectedGame: true,
  _count: { select: { proposals: true, invites: true } },
};

export const EventService = {
  /** List events created by a user (optionally paginated) */
  async list(userId: string, opts?: { page?: number; limit?: number }) {
    const where = { createdById: userId, ...NOT_DELETED };
    const { page, limit, isPaginated, skip } = buildPagination(opts);

    if (isPaginated) {
      const [events, total] = await Promise.all([
        prisma.event.findMany({
          where,
          include: eventListInclude,
          orderBy: { eventDate: "desc" },
          skip,
          take: limit,
        }),
        prisma.event.count({ where }),
      ]);
      return paginatedResponse(events, total, page, limit);
    }

    return cachedQuery(
      () =>
        prisma.event.findMany({
          where,
          include: eventListInclude,
          orderBy: { eventDate: "desc" },
        }),
      ["user-events", userId],
      { revalidate: 60, tags: [CacheTags.userEvents(userId)] }
    );
  },

  /** Get a single event with full details */
  async getById(userId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, ...NOT_DELETED },
      include: {
        createdBy: { select: SAFE_USER_SELECT },
        invites: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
        proposals: {
          include: {
            game: true,
            proposedBy: { select: SAFE_USER_SELECT },
            _count: { select: { votes: true } },
          },
        },
        selectedGame: true,
        guestParticipants: true,
        dateProposals: {
          include: {
            votes: { include: { user: { select: SAFE_USER_SELECT } } },
            guestVotes: { include: { guest: true } },
          },
        },
      },
    });
    if (!event) throw new ApiError(404, "Event not found");

    // Authorization: only creator or invited users
    const isCreator = event.createdById === userId;
    const isInvited = event.invites.some((i) => i.userId === userId);
    if (!isCreator && !isInvited) throw new ApiError(403, "Forbidden");

    return event;
  },

  /** Create a new event */
  async create(userId: string, input: CreateEventInput) {
    if (!input.title || !input.eventDate) {
      throw new ApiError(400, "Missing required fields: title, eventDate");
    }

    const validationError = firstError(
      validateString(input.title, "Titel", { max: 200 }),
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
      validateString(input.location, "Ort", { required: false, max: 500 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    // Build invite list
    const organizerInvite = { userId, status: "accepted" as const };
    const additionalInvites: { userId: string | null; email: string | null; status: "pending" }[] = [];
    if (input.inviteEmails && input.inviteEmails.length > 0) {
      const users = await prisma.user.findMany({
        where: { email: { in: input.inviteEmails } },
      });
      const userByEmail = new Map(users.map((u) => [u.email, u]));
      for (const email of input.inviteEmails) {
        const user = userByEmail.get(email);
        additionalInvites.push({
          userId: user?.id || null,
          email: user ? null : email,
          status: "pending" as const,
        });
      }
    }

    const newEvent = await prisma.event.create({
      data: {
        title: input.title,
        description: input.description || null,
        eventDate: new Date(input.eventDate),
        location: input.location || null,
        groupId: input.groupId || null,
        createdById: userId,
        invites: { create: [organizerInvite, ...additionalInvites] },
      },
      include: {
        ...eventListInclude,
        invites: {
          include: { user: { select: SAFE_USER_SELECT } },
        },
      },
    });

    // Send invitation emails to all invitees (not the organizer)
    const base = await getPublicBaseUrl();
    const creator = await prisma.user.findUnique({ where: { id: userId }, select: SAFE_USER_SELECT });
    const inviterName = creator?.name || creator?.email || "Jemand";

    for (const invite of newEvent.invites) {
      if (invite.userId === userId) continue;
      const recipientEmail = invite.user?.email || invite.email;
      if (!recipientEmail) continue;

      const eventUrl = invite.userId
        ? `${base}/dashboard/events/${newEvent.id}`
        : `${base}/public/invite/${encryptId(invite.id)}`;

      try {
        await sendEventInviteEmail({
          to: recipientEmail,
          eventTitle: input.title,
          eventDate: new Date(input.eventDate),
          location: input.location || null,
          inviterName,
          eventUrl,
        });
      } catch (mailErr) {
        logger.error({ err: mailErr }, "Failed to send invite email");
      }
    }

    invalidateTag(CacheTags.userEvents(userId));
    invalidateTag(CacheTags.userDashboard(userId));

    return newEvent;
  },

  /** Close an event (set status to "closed") */
  async close(userId: string, eventId: string, selectedGameId?: string, winningProposalId?: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, createdById: userId, ...NOT_DELETED },
    });
    if (!event) throw new ApiError(404, "Event not found");

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        status: "closed",
        ...(selectedGameId && { selectedGameId }),
        ...(winningProposalId && { winningProposalId }),
      },
    });

    invalidateTag(CacheTags.userEvents(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return updated;
  },

  /** Update an existing event */
  async update(userId: string, eventId: string, input: UpdateEventInput) {
    const existing = await prisma.event.findFirst({
      where: { id: eventId, createdById: userId, ...NOT_DELETED },
    });
    if (!existing) throw new ApiError(404, "Event not found");

    const validationError = firstError(
      input.title ? validateString(input.title, "Titel", { max: 200 }) : null,
      validateString(input.description, "Beschreibung", { required: false, max: 2000 }),
      validateString(input.location, "Ort", { required: false, max: 500 }),
    );
    if (validationError) throw new ApiError(400, validationError);

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.eventDate !== undefined && { eventDate: new Date(input.eventDate) }),
        ...(input.location !== undefined && { location: input.location }),
        ...(input.groupId !== undefined && { groupId: input.groupId || null }),
        ...(input.status !== undefined && { status: input.status }),
      },
      include: eventListInclude,
    });

    invalidateTag(CacheTags.userEvents(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return updated;
  },

  /** Soft-delete an event */
  async delete(userId: string, eventId: string) {
    const event = await prisma.event.findFirst({
      where: { id: eventId, createdById: userId, ...NOT_DELETED },
    });
    if (!event) throw new ApiError(404, "Event not found");

    await prisma.event.update({
      where: { id: eventId },
      data: { deletedAt: new Date() },
    });

    invalidateTag(CacheTags.userEvents(userId));
    invalidateTag(CacheTags.userDashboard(userId));
    return { message: "Event deleted" };
  },
};
