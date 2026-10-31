import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/db";
import { invalidateTag } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { ApiError } from "@/lib/require-auth";
import { evaluateEventState, type EventAction } from "@/lib/events/event-state";

export type EventMutationScope =
  | { kind: "user"; eventId: string; userId: string }
  | { kind: "public"; token: string; userId?: string; guestId?: string };

type LockedEvent = {
  id: string;
  createdById: string;
  status: string;
  eventDate: Date;
  selectedDate: Date | null;
  selectedGameId: string | null;
  winningProposalId: string | null;
  deletedAt: Date | null;
  isPublic: boolean;
  shareToken: string | null;
  title: string;
  invites: Array<{ id: string; userId: string | null; user?: { id: string } | null }>;
};

export interface EventMutationContext {
  tx: Prisma.TransactionClient;
  event: LockedEvent;
  eventId: string;
  now: Date;
  userId: string | null;
  guestId: string | null;
}

/** Serialize a state-changing event operation against the event row. */
export async function withEventMutation<T>(
  scope: EventMutationScope,
  action: EventAction | null,
  write: (context: EventMutationContext) => Promise<T>
): Promise<T> {
  const { value, ownerId } = await prisma.$transaction(async (tx) => {
    const rows = scope.kind === "user"
      ? await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id" FROM "Event" WHERE "id" = ${scope.eventId} FOR UPDATE
        `)
      : await tx.$queryRaw<Array<{ id: string }>>(Prisma.sql`
          SELECT "id" FROM "Event"
          WHERE "shareToken" = ${scope.token} AND "isPublic" = TRUE AND "deletedAt" IS NULL
          FOR UPDATE
        `);

    const eventId = rows[0]?.id;
    if (!eventId) throw new ApiError(404, "Event not found");

    const event = await tx.event.findFirst({
      where: { id: eventId, deletedAt: null },
      include: { invites: { select: { id: true, userId: true, user: { select: { id: true } } } } },
    }) as LockedEvent | null;
    if (!event) throw new ApiError(404, "Event not found");

    if (scope.kind === "public") {
      if (!event.isPublic || event.shareToken !== scope.token) throw new ApiError(404, "Event not found");
    } else {
      const hasAccess = event.createdById === scope.userId || event.isPublic ||
        event.invites.some((invite) => invite.userId === scope.userId);
      if (!hasAccess) throw new ApiError(403, "Access denied");
    }

    const now = new Date();
    if (action) {
      const state = evaluateEventState(event, now);
      if (!state.available[action]) {
        throw new ApiError(409, state.blockedReason ?? "The event no longer accepts changes.");
      }
    }

    const value = await write({
      tx,
      event,
      eventId,
      now,
      userId: scope.kind === "user" ? scope.userId : scope.userId ?? null,
      guestId: scope.kind === "public" ? scope.guestId ?? null : null,
    });
    await tx.event.update({ where: { id: eventId }, data: { updatedAt: now } });
    return { value, ownerId: event.createdById };
  });

  invalidateTag(CacheTags.userEvents(ownerId));
  invalidateTag(CacheTags.userDashboard(ownerId));
  return value;
}
