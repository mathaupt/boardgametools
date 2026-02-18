import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const userId = session.user.id;

  try {
    // Alle Sessions des Users
    const sessions = await prisma.gameSession.findMany({
      where: { createdById: userId },
      include: {
        game: true,
        players: {
          include: { user: true }
        }
      },
      orderBy: { playedAt: "desc" }
    });

    return NextResponse.json(sessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
          create: players.map((player: any) => ({
            userId: player.userId,
            score: player.score || null,
            isWinner: player.isWinner || false,
            placement: player.placement || null
          }))
        }
      },
      include: {
        game: true,
        players: {
          include: { user: true }
        }
      }
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
