import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const games = await prisma.game.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: { _count: { select: { sessions: true } } },
  });

  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, minPlayers, maxPlayers, playTimeMinutes, complexity, bggId, imageUrl } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        name,
        description,
        minPlayers: minPlayers || 1,
        maxPlayers: maxPlayers || 4,
        playTimeMinutes,
        complexity,
        bggId,
        imageUrl,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
