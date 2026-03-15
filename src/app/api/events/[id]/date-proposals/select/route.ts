import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

// POST: Termin auswählen (Event-Ersteller wählt den finalen Termin)
// Body: { dateProposalId: string }
export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const event = await prisma.event.findUnique({ where: { id } });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Only the event creator can select a date" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { dateProposalId } = body;

    if (!dateProposalId) {
      return NextResponse.json(
        { error: "Missing required field: dateProposalId" },
        { status: 400 }
      );
    }

    const proposal = await prisma.dateProposal.findFirst({
      where: { id: dateProposalId, eventId: id },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Date proposal not found for this event" },
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
      message: "Date selected",
      selectedDate: updatedEvent.selectedDate,
      eventDate: updatedEvent.eventDate,
    });
  } catch (error) {
    console.error("Error selecting date:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
