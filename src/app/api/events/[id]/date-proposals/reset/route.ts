import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  _request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    await withEventMutation(
      { kind: "user", eventId: id, userId },
      "resetDates",
      async ({ tx, event, now }) => {
        if (event.createdById !== userId) throw new ApiError(403, Errors.ONLY_CREATOR_CAN_RESET);
        await tx.dateProposal.deleteMany({ where: { eventId: id } });
        await tx.event.update({ where: { id }, data: { selectedDate: null, status: "planning", updatedAt: now } });
      }
    );

    return NextResponse.json({ message: Errors.DATE_POLL_RESET });
  } catch (error) {
    return handleApiError(error);
  }
});
