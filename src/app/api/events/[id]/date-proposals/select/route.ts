import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

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
    const event = await prisma.event.findFirst({ where: { id, deletedAt: null } });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    if (event.createdById !== userId) {
      return NextResponse.json(
        { error: Errors.ONLY_CREATOR_CAN_SELECT },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dateProposalId } = body;

    if (!dateProposalId) {
      return NextResponse.json(
        { error: Errors.MISSING_DATE_PROPOSAL_ID },
        { status: 400 }
      );
    }

    const proposal = await prisma.dateProposal.findFirst({
      where: { id: dateProposalId, eventId: id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: Errors.DATE_PROPOSAL_NOT_FOUND },
        { status: 404 }
      );
    }

    // Aktualisiere Event mit ausgewähltem Datum
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        selectedDate: proposal.date,
        eventDate: proposal.date,
      },
    });

    return NextResponse.json({
      message: Errors.DATE_SELECTED,
      selectedDate: updatedEvent.selectedDate,
      eventDate: updatedEvent.eventDate,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
