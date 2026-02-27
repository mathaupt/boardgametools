import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Event mit allen Details laden
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: true,
        invites: {
          include: { user: true }
        },
        proposals: {
          include: {
            game: true,
            proposedBy: true,
            _count: { select: { votes: true, guestVotes: true } },
            votes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }
        },
        selectedGame: true,
        guestParticipants: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Ersteller oder eingeladen)
    const isCreator = event.createdById === session.user.id;
    const isInvited = event.invites.some(invite => invite.userId === session.user.id);

    if (!isCreator && !isInvited) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const eventResponse = {
      ...event,
      proposals: event.proposals.map(proposal => ({
        ...proposal,
        totalVotes: proposal._count.votes + proposal._count.guestVotes,
        userHasVoted: proposal.votes.length > 0,
        votes: undefined,
      })),
      guestParticipants: event.guestParticipants.map((guest) => ({
        ...guest,
        votes: undefined,
      })),
      currentUserId: session.user.id,
      isCreator,
    };

    return NextResponse.json(eventResponse);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
