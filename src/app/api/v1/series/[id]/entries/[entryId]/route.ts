import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { SeriesService } from "@/lib/services";

type RouteContext = { params: Promise<{ id: string; entryId: string }> };

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id, entryId } = await params;
    const body = await request.json();
    const result = await SeriesService.updateEntry(userId, id, entryId, body);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id, entryId } = await params;
    const result = await SeriesService.deleteEntry(userId, id, entryId);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
