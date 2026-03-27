import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { EventService } from "@/lib/services/event.service";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("eventId");
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "0", 10), 100);

    if (eventId) {
      const event = await EventService.getById(userId, eventId);
      return NextResponse.json(event);
    }

    const result = await EventService.list(userId, page > 0 && limit > 0 ? { page, limit } : undefined);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const newEvent = await EventService.create(userId, body);
    return NextResponse.json(newEvent, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
