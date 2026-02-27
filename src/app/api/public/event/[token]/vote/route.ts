import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const guestId = body?.guestId as string | undefined;
    const proposalId = body?.proposalId as string | undefined;

    if (!guestId || !proposalId) {
      return NextResponse.json({ error: "guestId and proposalId are required" }, { status: 400 });
    }

    const participant = await prisma.guestParticipant.findFirst({
      where: { id: guestId, eventId },
    });

    if (!participant) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId },
      select: { id: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const existingVote = await prisma.guestVote.findFirst({
      where: { guestId, proposalId },
    });

    if (existingVote) {
      return NextResponse.json({ error: "Guest already voted" }, { status: 400 });
    }

    await prisma.guestVote.create({
      data: {
        guestId,
        proposalId,
      },
    });

    const counts = await prisma.gameProposal.findUnique({
      where: { id: proposalId },
      select: {
        _count: { select: { votes: true, guestVotes: true } },
      },
    });

    return NextResponse.json({
      message: "Vote recorded",
      totalVotes: (counts?._count.votes ?? 0) + (counts?._count.guestVotes ?? 0),
      voteCounts: counts?._count ?? { votes: 0, guestVotes: 0 },
    });
  } catch (error) {
    console.error("Error creating guest vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");
    const proposalId = searchParams.get("proposalId");

    if (!guestId || !proposalId) {
      return NextResponse.json({ error: "guestId and proposalId are required" }, { status: 400 });
    }

    const participant = await prisma.guestParticipant.findFirst({
      where: { id: guestId, eventId },
    });

    if (!participant) {
      return NextResponse.json({ error: "Guest not found" }, { status: 404 });
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId },
      select: { id: true },
    });

    if (!proposal) {
      return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
    }

    const deleted = await prisma.guestVote.deleteMany({
      where: { guestId, proposalId },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Vote not found" }, { status: 404 });
    }

    const counts = await prisma.gameProposal.findUnique({
      where: { id: proposalId },
      select: {
        _count: { select: { votes: true, guestVotes: true } },
      },
    });

    return NextResponse.json({
      message: "Vote removed",
      totalVotes: (counts?._count.votes ?? 0) + (counts?._count.guestVotes ?? 0),
      voteCounts: counts?._count ?? { votes: 0, guestVotes: 0 },
    });
  } catch (error) {
    console.error("Error removing guest vote:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
