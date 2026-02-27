import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { gameId } = body ?? {};

    if (!gameId) {
      return NextResponse.json({ error: "Missing required field: gameId" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        invites: {
          select: { userId: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const isInvited = event.invites.some((invite) => invite.userId === session.user.id);
    const hasAccess = event.createdById === session.user.id || isInvited || event.isPublic;

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const existingProposal = await prisma.gameProposal.findFirst({
      where: { eventId, gameId },
    });

    if (existingProposal) {
      return NextResponse.json({ error: "Game already proposed for this event" }, { status: 400 });
    }

    const proposal = await prisma.gameProposal.create({
      data: {
        eventId,
        gameId,
        proposedById: session.user.id,
      },
      include: {
        game: true,
        proposedBy: true,
        _count: { select: { votes: true, guestVotes: true } },
      },
    });

    return NextResponse.json({
      ...proposal,
      totalVotes: proposal._count.votes + proposal._count.guestVotes,
    }, { status: 201 });
  } catch (error) {
    console.error("Error proposing game via public link:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
