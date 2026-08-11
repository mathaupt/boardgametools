import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

interface ReorderEntry {
  id: string;
  sortOrder: number;
}

function validateReorderBody(body: unknown): ReorderEntry[] | null {
  if (typeof body !== "object" || body === null) return null;
  const entries = (body as Record<string, unknown>).entries;
  if (!Array.isArray(entries)) return null;
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) return null;
    const id = (entry as Record<string, unknown>).id;
    const sortOrder = (entry as Record<string, unknown>).sortOrder;
    if (typeof id !== "string" || id.length === 0) return null;
    if (typeof sortOrder !== "number" || !Number.isInteger(sortOrder)) return null;
  }
  return entries as ReorderEntry[];
}

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id: seriesId } = await params;

    const series = await prisma.gameSeries.findFirst({
      where: { id: seriesId, ownerId: session.user.id, deletedAt: null },
      select: { id: true },
    });
    if (!series) {
      throw new ApiError(404, "Series not found");
    }

    const body = await request.json();
    const entries = validateReorderBody(body);
    if (!entries) {
      throw new ApiError(400, "entries must be an array of { id, sortOrder }");
    }

    await prisma.$transaction(
      entries.map((entry) =>
        prisma.gameSeriesEntry.updateMany({
          where: { id: entry.id, seriesId },
          data: { sortOrder: entry.sortOrder },
        })
      )
    );

    return NextResponse.json({ message: "Reordered" });
  } catch (error) {
    return handleApiError(error);
  }
});
