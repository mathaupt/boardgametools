import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id: seriesId } = await params;

  const series = await prisma.gameSeries.findFirst({
    where: { id: seriesId, ownerId: userId, deletedAt: null },
  });

  if (!series) {
    return NextResponse.json({ error: Errors.SERIES_NOT_FOUND }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { entries } = body;

    if (!Array.isArray(entries)) {
      return NextResponse.json(
        { error: Errors.ENTRIES_FORMAT },
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

    return NextResponse.json({ message: Errors.ORDER_UPDATED });
  } catch (error) {
    return handleApiError(error);
  }
});
