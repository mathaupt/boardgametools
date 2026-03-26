import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, validateNumber, firstError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string; entryId: string }> };

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id: seriesId, entryId } = await params;

  const entry = await prisma.gameSeriesEntry.findFirst({
    where: {
      id: entryId,
      seriesId,
      series: { ownerId: userId },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { played, playedAt, rating, difficulty, sortOrder, playTimeMinutes, successful, playerCount, score } = body;

    const validationError = firstError(
      validateNumber(rating, "rating", { required: false, min: 1, max: 5 }),
      validateString(difficulty, "difficulty", { required: false, max: 50 }),
      validateNumber(sortOrder, "sortOrder", { required: false, min: 0, max: 9999 }),
      validateNumber(playTimeMinutes, "playTimeMinutes", { required: false, min: 0, max: 9999 }),
      validateNumber(playerCount, "playerCount", { required: false, min: 1, max: 99 }),
      validateNumber(score, "score", { required: false, min: 0, max: 999999 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const data: Record<string, unknown> = {};

    if (played !== undefined) {
      data.played = played;
      if (played && !entry.playedAt && playedAt === undefined) {
        data.playedAt = new Date();
      }
      if (!played) {
        data.playedAt = null;
        data.rating = null;
        data.playTimeMinutes = null;
        data.successful = null;
        data.playerCount = null;
        data.score = null;
      }
    }

    if (playedAt !== undefined) {
      data.playedAt = playedAt ? new Date(playedAt) : null;
    }

    if (rating !== undefined) {
      if (rating !== null && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
      }
      data.rating = rating;
    }

    if (difficulty !== undefined) {
      data.difficulty = difficulty;
    }

    if (sortOrder !== undefined) {
      data.sortOrder = sortOrder;
    }

    if (playTimeMinutes !== undefined) {
      data.playTimeMinutes = playTimeMinutes;
    }

    if (successful !== undefined) {
      data.successful = successful;
    }

    if (playerCount !== undefined) {
      data.playerCount = playerCount;
    }

    if (score !== undefined) {
      data.score = score;
    }

    const updated = await prisma.gameSeriesEntry.update({
      where: { id: entryId },
      data,
      include: {
        game: {
          select: {
            id: true,
            name: true,
            imageUrl: true,
            minPlayers: true,
            maxPlayers: true,
            playTimeMinutes: true,
            complexity: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id: seriesId, entryId } = await params;

  const entry = await prisma.gameSeriesEntry.findFirst({
    where: {
      id: entryId,
      seriesId,
      series: { ownerId: userId },
    },
  });

  if (!entry) {
    return NextResponse.json({ error: "Entry not found" }, { status: 404 });
  }

  await prisma.gameSeriesEntry.delete({ where: { id: entryId } });

  return NextResponse.json({ message: "Entry removed from series" });
});
