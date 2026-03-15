import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; pollId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, pollId } = await params;

  try {
    // Check membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    // Check poll is open
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id, status: "open" },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found or closed" }, { status: 404 });
    }

    const body = await request.json();
    const { optionIds } = body;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: "optionIds array is required" }, { status: 400 });
    }

    // For single-choice polls, only allow one option
    if (poll.type === "single" && optionIds.length > 1) {
      return NextResponse.json({ error: "Single-choice poll: only one option allowed" }, { status: 400 });
    }

    // Get the user's display name
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const voterName = user?.name || "Unbekannt";

    // Remove existing votes by this user for this poll
    await prisma.groupPollVote.deleteMany({
      where: {
        option: { pollId },
        userId: session.user.id,
      },
    });

    // Create new votes
    const votes = await Promise.all(
      optionIds.map((optionId: string) =>
        prisma.groupPollVote.create({
          data: {
            optionId,
            voterName,
            userId: session.user.id,
          },
        })
      )
    );

    return NextResponse.json(votes, { status: 201 });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
