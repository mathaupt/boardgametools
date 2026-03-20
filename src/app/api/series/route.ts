import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

export const GET = withApiLogging(async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const series = await prisma.gameSeries.findMany({
    where: { ownerId: session.user.id },
    orderBy: { name: "asc" },
    include: {
      entries: {
        include: { game: { select: { imageUrl: true } } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const result = series.map((s) => ({
    ...s,
    _count: {
      entries: s.entries.length,
      played: s.entries.filter((e) => e.played).length,
    },
  }));

  return NextResponse.json(result);
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, imageUrl } = body;

    const validationError = firstError(
      validateString(name, "name", { min: 1, max: 200 }),
      validateString(description, "description", { required: false, max: 1000 }),
      validateString(imageUrl, "imageUrl", { required: false, max: 2000 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const gameSeries = await prisma.gameSeries.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        imageUrl: imageUrl?.trim() || null,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json(gameSeries, { status: 201 });
  } catch (error) {
    console.error("Error creating game series:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
