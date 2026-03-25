import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";

/**
 * Fetch pending event invites for a given user.
 * Only includes future events, ordered by event date ascending.
 */
export async function getPendingInvites(userId: string) {
  return cachedQuery(
    () => prisma.eventInvite.findMany({
      where: {
        userId,
        status: "pending",
        event: { eventDate: { gte: new Date() } },
      },
      include: {
        event: {
          include: {
            createdBy: { select: { name: true } },
          },
        },
      },
      orderBy: { event: { eventDate: "asc" } },
    }),
    ["pending-invites", userId],
    { revalidate: 30, tags: [CacheTags.pendingInvites(userId)] }
  );
}
