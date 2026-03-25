import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: seriesId } = await params;

  const series = await prisma.gameSeries.findFirst({
    where: { id: seriesId, ownerId: session.user.id, deletedAt: null },
  });

  if (!series) {
    return NextResponse.json({ error: "Series not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: "entries must be an array of { id, sortOrder }" },
        { status: 400 }
      );
    }

    await prisma.$transaction(
      entries.map((entry: { id: string; sortOrder: number }) =>
        prisma.gameSeriesEntry.update({
          where: { id: entry.id },
          data: { sortOrder: entry.sortOrder },
        })
      )
    );

    return NextResponse.json({ message: "Order updated" });
  } catch (error) {
    console.error("Error reordering series entries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
