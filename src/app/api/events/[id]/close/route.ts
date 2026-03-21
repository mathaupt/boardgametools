import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

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
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        proposals: {
          include: {
            _count: { select: { votes: true, guestVotes: true } },
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event nicht gefunden" },
        { status: 404 }
      );
    }

    if (event.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Nur der Ersteller kann die Abstimmung beenden" },
        { status: 403 }
      );
    }

    if (event.status === "closed") {
      return NextResponse.json(
        { error: "Abstimmung ist bereits beendet" },
        { status: 400 }
      );
    }

    if (event.status !== "voting") {
      return NextResponse.json(
        { error: "Abstimmung kann nur im Status 'voting' beendet werden" },
        { status: 400 }
      );
    }

    // Find the winning game (most total votes = user votes + guest votes)
    const sortedProposals = [...event.proposals].sort(
      (a, b) =>
        b._count.votes + b._count.guestVotes -
        (a._count.votes + a._count.guestVotes)
    );
    const winningProposal = sortedProposals[0];

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: "closed",
        selectedGameId: winningProposal?.gameId || null,
        winningProposalId: winningProposal?.id || null,
      },
      include: {
        selectedGame: true,
        winningProposal: true,
      },
    });

    return NextResponse.json(updatedEvent);
  } catch (error) {
    console.error("Error closing voting:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
