import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";

interface SessionPlayerInput {
  userId: string;
  score?: number | null;
  isWinner?: boolean;
  placement?: number | null;
}

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = session.user.id;
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "0", 10), 100);

  try {
    const where = { createdById: userId };
    const includeRelations = {
      game: true as const,
      players: {
        include: { user: { select: { id: true, name: true, email: true } } }
      }
    };

    if (page > 0 && limit > 0) {
      const [sessions, total] = await Promise.all([
        prisma.gameSession.findMany({
          where, include: includeRelations, orderBy: { playedAt: "desc" },
          skip: (page - 1) * limit, take: limit,
        }),
        prisma.gameSession.count({ where }),
      ]);
      return NextResponse.json({ data: sessions, total, page, limit, totalPages: Math.ceil(total / limit) });
    }

    const sessions = await prisma.gameSession.findMany({
      where, include: includeRelations, orderBy: { playedAt: "desc" },
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { 
      gameId, 
      playedAt, 
      durationMinutes, 
      notes, 
      players
    } = body;

    // Validierung
    if (!gameId || !playedAt || !players || players.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields: gameId, playedAt, players" 
      }, { status: 400 });
    }

    const validationError = validateString(notes, "Notizen", { required: false, max: 2000 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Prüfe ob Spiel dem User gehört
    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: session.user.id }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Erstelle Session
    const newSession = await prisma.gameSession.create({
      data: {
        gameId,
        playedAt: new Date(playedAt),
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        notes,
        createdById: session.user.id,
        players: {
          create: players.map((player: SessionPlayerInput) => ({
            userId: player.userId,
            score: player.score ?? null,
            isWinner: player.isWinner ?? false,
            placement: player.placement ?? null
          }))
        }
      },
      include: {
        game: true,
        players: {
          include: { user: { select: { id: true, name: true, email: true } } }
        }
      }
    });

    invalidateTag(CacheTags.userSessions(session.user.id));
    invalidateTag(CacheTags.userStats(session.user.id));
    invalidateTag(CacheTags.userDashboard(session.user.id));

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
