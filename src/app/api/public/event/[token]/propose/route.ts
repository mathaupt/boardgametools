import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-propose:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

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

    const validationError = validateString(gameId, "gameId", { min: 1, max: 100 });
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const event = await prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
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
      where: { id: gameId, ownerId: session.user.id, deletedAt: null },
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
        proposedBy: { select: { id: true, name: true, email: true } },
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
});
