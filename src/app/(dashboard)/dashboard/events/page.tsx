import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { getPendingInvites } from "@/lib/queries/pending-invites";
import { EventsOverview } from "@/components/dashboard/events-overview";

export default async function EventsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const events = await cachedQuery(
    () => prisma.event.findMany({
      where: { createdById: userId, deletedAt: null },
      include: {
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: {
            game: true,
            _count: { 
              select: { 
                votes: true 
              } 
            },
            votes: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        selectedGame: true,
        winningProposal: true,
        _count: { select: { proposals: true, invites: true } }
      },
      orderBy: { eventDate: "desc" },
      take: 20
    }),
    ["user-events-list", userId!],
    { revalidate: 60, tags: [CacheTags.userEvents(userId!)] }
  );

  // Offene Einladungen laden
  const pendingInvites = await getPendingInvites(userId!);

  return <EventsOverview events={events} invites={pendingInvites.map((invite) => ({
    id: invite.id, eventId: invite.eventId, status: invite.status,
    event: { id: invite.event.id, title: invite.event.title, eventDate: invite.event.eventDate.toISOString(), location: invite.event.location, createdBy: invite.event.createdBy },
  }))} />;
}
