import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const series = await prisma.gameSeries.findFirst({
    where: { id, ownerId: session.user.id },
    include: {
      entries: {
        include: {
          game: {
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              minPlayers: true,
              maxPlayers: true,
              playTimeMinutes: true,
              complexity: true,
              bggId: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  return NextResponse.json(series);
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.gameSeries.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { name, description, imageUrl } = body;

    const validationError = firstError(
      validateString(name, "name", { required: false, min: 1, max: 200 }),
      validateString(description, "description", { required: false, max: 1000 }),
      validateString(imageUrl, "imageUrl", { required: false, max: 2000 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    const updated = await prisma.gameSeries.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl?.trim() || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating game series:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.gameSeries.findFirst({
    where: { id, ownerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  await prisma.gameSeries.delete({ where: { id } });

  return NextResponse.json({ message: "Series deleted" });
});
