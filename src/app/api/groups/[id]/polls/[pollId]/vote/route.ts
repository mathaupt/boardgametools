import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string; pollId: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id, pollId } = await params;

  try {
    // Check membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: userId },
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
      where: { id: userId },
      select: { name: true },
    });

    const voterName = user?.name || "Unbekannt";

    // Atomically replace votes in a single transaction
    const votes = await prisma.$transaction(async (tx) => {
      await tx.groupPollVote.deleteMany({
        where: {
          option: { pollId },
          userId: userId,
        },
      });

      const created = await Promise.all(
        optionIds.map((optionId: string) =>
          tx.groupPollVote.create({
            data: {
              optionId,
              voterName,
              userId: userId,
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json(votes, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
