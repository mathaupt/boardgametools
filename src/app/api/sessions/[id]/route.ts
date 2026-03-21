import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

interface SessionPlayerInput {
  userId: string;
  score?: number | null;
  isWinner?: boolean;
  placement?: number | null;
}

const includeRelations = {
  game: true as const,
  createdBy: { select: { id: true, name: true, email: true } },
  players: {
    include: { user: { select: { id: true, name: true, email: true } } },
  },
  ratings: {
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" as const },
  },
};

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  context?: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context!.params;

  try {
    const gameSession = await prisma.gameSession.findUnique({
      where: { id },
      include: includeRelations,
    });

    if (!gameSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (gameSession.createdById !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    return NextResponse.json(gameSession);
  } catch (error) {
    console.error("Error fetching session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  context?: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context!.params;

  try {
    const existing = await prisma.gameSession.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const { gameId, playedAt, durationMinutes, notes, players } = body;

    if (!gameId || !playedAt || !players || players.length === 0) {
      return NextResponse.json({
        error: "Missing required fields: gameId, playedAt, players",
      }, { status: 400 });
    }

    const validationError = validateString(notes, "Notizen", { required: false, max: 2000 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: session.user.id },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      await tx.sessionPlayer.deleteMany({ where: { sessionId: id } });

      return tx.gameSession.update({
        where: { id },
        data: {
          gameId,
          playedAt: new Date(playedAt),
          durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
          notes: notes || null,
          players: {
            create: players.map((player: SessionPlayerInput) => ({
              userId: player.userId,
              score: player.score ?? null,
              isWinner: player.isWinner ?? false,
              placement: player.placement ?? null,
            })),
          },
        },
        include: includeRelations,
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  context?: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context!.params;

  try {
    const existing = await prisma.gameSession.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (existing.createdById !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    await prisma.gameSession.delete({ where: { id } });

    return NextResponse.json({ message: "Session deleted" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
