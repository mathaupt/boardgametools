import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const result = await GameService.getById(userId, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const body = await request.json();
    const result = await GameService.update(userId, id, body);
    return NextResponse.json(result);
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
    const { id } = await params;
    const result = await GameService.delete(userId, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
