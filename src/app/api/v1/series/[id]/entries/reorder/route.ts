import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { SeriesService } from "@/lib/services";

type RouteContext = { params: Promise<{ id: string }> };

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const result = await SeriesService.reorderEntries(userId, id, body.entryIds);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
