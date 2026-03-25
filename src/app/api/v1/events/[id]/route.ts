import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { EventService } from "@/lib/services";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const { userId } = await requireAuth();
    const { id } = await params;
    const result = await EventService.getById(userId, id);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
