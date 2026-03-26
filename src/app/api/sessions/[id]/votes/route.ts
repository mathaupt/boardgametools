import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const sessionData = await prisma.gameSession.findFirst({
      where: { id, deletedAt: null },
      include: {
        game: true,
        createdBy: { select: { id: true, name: true, email: true } },
        players: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        ratings: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: "desc" },
        },
      }
    });

    if (!sessionData) {
      return NextResponse.json({ error: Errors.SESSION_NOT_FOUND }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Teilnehmer oder Ersteller)
    const isParticipant = sessionData.players.some((p) => p.userId === userId);
    const isCreator = sessionData.createdById === userId;

    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    return NextResponse.json(sessionData);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { rating, comment } = body;

    if (rating === undefined || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({
        error: "rating muss eine Zahl zwischen 1 und 5 sein"
      }, { status: 400 });
    }

    // Prüfe ob Session existiert und User Berechtigung hat
    const sessionData = await prisma.gameSession.findFirst({
      where: { id, deletedAt: null },
      include: { players: true }
    });

    if (!sessionData) {
      return NextResponse.json({ error: Errors.SESSION_NOT_FOUND }, { status: 404 });
    }

    // Prüfe ob User Teilnehmer oder Ersteller ist
    const isParticipant = sessionData.players.some((p) => p.userId === userId);
    const isCreator = sessionData.createdById === userId;

    if (!isParticipant && !isCreator) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    // Upsert: Bewertung erstellen oder aktualisieren
    const sessionRating = await prisma.sessionRating.upsert({
      where: {
        sessionId_userId: { sessionId: id, userId: userId },
      },
      create: {
        sessionId: id,
        userId: userId,
        rating,
        comment: comment?.trim() || null,
      },
      update: {
        rating,
        comment: comment?.trim() || null,
      },
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    });

    return NextResponse.json(sessionRating, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
