import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { SeriesService } from "@/lib/services";

export const GET = withApiLogging(async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id } = await params;
    const result = await SeriesService.getById(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id } = await params;
    const body = await request.json();
    const result = await SeriesService.update(session.user.id, id, body);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id } = await params;
    const result = await SeriesService.delete(session.user.id, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
