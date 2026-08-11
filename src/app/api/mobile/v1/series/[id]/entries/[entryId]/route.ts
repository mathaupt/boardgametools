import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { SeriesService } from "@/lib/services";

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id, entryId } = await params;
    const body = await request.json();
    const result = await SeriesService.updateEntry(session.user.id, id, entryId, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; entryId: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id, entryId } = await params;
    const result = await SeriesService.deleteEntry(session.user.id, id, entryId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
