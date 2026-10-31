import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { EventService } from "@/lib/services/event.service";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const updatedEvent = await EventService.close(userId, id);
    return NextResponse.json(updatedEvent);
  } catch (error) {
    return handleApiError(error);
  }
});
