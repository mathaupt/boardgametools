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

  const game = await prisma.game.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      sessions: {
        include: { players: { include: { user: true } } },
        orderBy: { playedAt: "desc" },
        take: 10,
      },
    },
  });

  if (!game) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  return NextResponse.json(game);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.game.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, description, minPlayers, maxPlayers, playTimeMinutes, complexity, bggId, imageUrl } = body;

    const game = await prisma.game.update({
      where: { id },
      data: {
        name,
        description,
        minPlayers,
        maxPlayers,
        playTimeMinutes,
        complexity,
        bggId,
        imageUrl,
      },
    });

    return NextResponse.json(game);
  } catch (error) {
    console.error("Error updating game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.game.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Game not found" }, { status: 404 });
  }

  await prisma.game.delete({ where: { id } });

  return NextResponse.json({ message: "Game deleted" });
}
