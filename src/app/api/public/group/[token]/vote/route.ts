import { NextRequest, NextResponse } from "next/server";
import { findPublicGroupByToken } from "@/lib/group-share";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { token } = await params;

  try {
    const group = await findPublicGroupByToken(token, {});

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const body = await request.json();
    const { pollId, optionIds, voterName, password } = body;

    // Check password if set
    if (group.password && group.password !== password) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    if (!pollId || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0 || !voterName) {
      return NextResponse.json({ 
        error: "pollId, optionIds, and voterName are required" 
      }, { status: 400 });
    }

    // Check poll exists and is open
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: group.id, status: "open" },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found or closed" }, { status: 404 });
    }

    // For single-choice, only one option
    if (poll.type === "single" && optionIds.length > 1) {
      return NextResponse.json({ error: "Single-choice poll: only one option allowed" }, { status: 400 });
    }

    // Remove existing votes by this voter name for this poll
    await prisma.groupPollVote.deleteMany({
      where: {
        option: { pollId },
        voterName,
        userId: null, // Only delete anonymous votes with this name
      },
    });

    // Create new votes
    const votes = await Promise.all(
      optionIds.map((optionId: string) =>
        prisma.groupPollVote.create({
          data: {
            optionId,
            voterName: voterName.trim(),
          },
        })
      )
    );

    return NextResponse.json(votes, { status: 201 });
  } catch (error) {
    console.error("Error voting:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
