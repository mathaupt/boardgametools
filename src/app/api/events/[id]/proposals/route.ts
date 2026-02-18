import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json({ 
        error: "Missing required field: gameId" 
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: session.user.id }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prüfe ob Spiel dem User gehört
    const game = await prisma.game.findFirst({
      where: { id: gameId, ownerId: session.user.id }
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Prüfe ob Spiel bereits vorgeschlagen wurde
    const existingProposal = await prisma.gameProposal.findFirst({
      where: { eventId: id, gameId }
    });

    if (existingProposal) {
      return NextResponse.json({ 
        error: "Game already proposed for this event" 
      }, { status: 400 });
    }

    // Erstelle Game Proposal
    const proposal = await prisma.gameProposal.create({
      data: {
        eventId: id,
        gameId,
        proposedById: session.user.id
      },
      include: {
        game: true,
        proposedBy: true,
        _count: { select: { votes: true } }
      }
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error("Error creating proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const proposalId = searchParams.get("proposalId");

  if (!proposalId) {
    return NextResponse.json({ 
      error: "Missing required parameter: proposalId" 
    }, { status: 400 });
  }

  try {
    // Prüfe ob Proposal existiert und User Berechtigung hat
    const proposal = await prisma.gameProposal.findFirst({
      where: { 
        id: proposalId, 
        eventId: id,
        proposedById: session.user.id 
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    // Lösche Proposal und dazugehörige Votes
    await prisma.gameProposal.delete({
      where: { id: proposalId }
    });

    return NextResponse.json({ message: "Proposal deleted" });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
