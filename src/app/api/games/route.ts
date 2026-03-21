import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, validateNumber, firstError } from "@/lib/validation";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "0", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "0", 10), 100);
  const include = searchParams.get("include");

  const where = { ownerId: session.user.id };

  if (page > 0 && limit > 0) {
    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
          _count: { select: { sessions: true } },
          ...(include === "sessions" ? { sessions: { orderBy: { playedAt: "desc" as const }, take: 5 } } : {}),
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.game.count({ where }),
    ]);
    return NextResponse.json({ data: games, total, page, limit, totalPages: Math.ceil(total / limit) });
  }

  const games = await prisma.game.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: { select: { sessions: true } },
      tags: { include: { tag: true } },
      ...(include === "sessions" ? { sessions: { orderBy: { playedAt: "desc" as const }, take: 5 } } : {}),
    },
  });

  return NextResponse.json(games);
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, minPlayers, maxPlayers, playTimeMinutes, complexity, bggId, imageUrl, tagNames } = body;

    const validationError = firstError(
      validateString(name, "Name", { max: 200 }),
      validateString(description, "Beschreibung", { required: false, max: 2000 }),
      validateNumber(minPlayers, "Min. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(maxPlayers, "Max. Spieler", { required: false, min: 1, max: 99 }),
      validateNumber(playTimeMinutes, "Spieldauer", { required: false, min: 0, max: 9999 }),
      validateNumber(complexity, "Komplexität", { required: false, min: 1, max: 5 }),
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
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

    // Link tags if provided
    if (Array.isArray(tagNames) && tagNames.length > 0) {
      for (const tagName of tagNames) {
        const trimmed = String(tagName).trim();
        if (!trimmed) continue;
        const tag = await prisma.tag.upsert({
          where: { name_ownerId: { name: trimmed, ownerId: session.user.id } },
          create: { name: trimmed, ownerId: session.user.id, source: "manual" },
          update: {},
        });
        await prisma.gameTag.create({
          data: { gameId: game.id, tagId: tag.id },
        });
      }
    }

    const result = await prisma.game.findUnique({
      where: { id: game.id },
      include: { tags: { include: { tag: true } } },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating game:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
