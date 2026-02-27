import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { findPublicEventByToken } from "@/lib/event-share";

// POST: Gast stimmt über Terminvorschläge ab
// Body: { guestId: string, votes: [{ dateProposalId: string, availability: "yes"|"maybe"|"no" }] }
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const event = await findPublicEventByToken(token);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { guestId, votes } = body;

    if (!guestId || !votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: guestId, votes" },
        { status: 400 }
      );
    }

    // Prüfe ob Gast zum Event gehört
    const guest = await prisma.guestParticipant.findFirst({
      where: { id: guestId, eventId: event.id },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found for this event" },
        { status: 404 }
      );
    }

    // Bulk upsert in transaction
    const results = await prisma.$transaction(
      votes.map((v: { dateProposalId: string; availability: string }) =>
        prisma.guestDateVote.upsert({
          where: {
            dateProposalId_guestId: {
              dateProposalId: v.dateProposalId,
              guestId,
            },
          },
          update: { availability: v.availability },
          create: {
            dateProposalId: v.dateProposalId,
            guestId,
            availability: v.availability,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error guest date voting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
