import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

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
      return NextResponse.json({ error: Errors.NOT_A_MEMBER }, { status: 403 });
    }

    // Check poll is open
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id, status: "open" },
    });

    if (!poll) {
      return NextResponse.json({ error: Errors.POLL_NOT_FOUND_OR_CLOSED }, { status: 404 });
    }

    const body = await request.json();
    const { optionIds } = body;

    if (!optionIds || !Array.isArray(optionIds) || optionIds.length === 0) {
      return NextResponse.json({ error: Errors.OPTION_IDS_REQUIRED }, { status: 400 });
    }

    if (optionIds.length > 50) {
      return NextResponse.json({ error: "Zu viele Optionen" }, { status: 400 });
    }

    // For single-choice polls, only allow one option
    if (poll.type === "single" && optionIds.length > 1) {
      return NextResponse.json({ error: Errors.SINGLE_CHOICE_ONLY_ONE }, { status: 400 });
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
