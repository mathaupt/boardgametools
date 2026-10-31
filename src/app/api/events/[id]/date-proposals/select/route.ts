import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError, ApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import { withEventMutation } from "@/lib/services/event-mutation.service";

type RouteContext = { params: Promise<{ id: string }> };

// POST: Termin auswählen (Event-Ersteller wählt den finalen Termin)
// Body: { dateProposalId: string }
export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { dateProposalId } = body;

    if (!dateProposalId) {
      throw new ApiError(400, Errors.MISSING_DATE_PROPOSAL_ID);
    }

    const updatedEvent = await withEventMutation(
      { kind: "user", eventId: id, userId },
      "selectDate",
      async ({ tx, event }) => {
        if (event.createdById !== userId) throw new ApiError(403, Errors.ONLY_CREATOR_CAN_SELECT);
        const proposal = await tx.dateProposal.findFirst({ where: { id: dateProposalId, eventId: id } });
        if (!proposal) throw new ApiError(404, Errors.DATE_PROPOSAL_NOT_FOUND);
        return tx.event.update({ where: { id }, data: { selectedDate: proposal.date, eventDate: proposal.date } });
      }
    );

    return NextResponse.json({
      message: Errors.DATE_SELECTED,
      selectedDate: updatedEvent.selectedDate,
      eventDate: updatedEvent.eventDate,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
