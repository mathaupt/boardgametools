import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import prisma from "@/lib/db";
import { toGroupPollVoteDto } from "@/lib/dto-mappers";

type RouteContext = { params: Promise<{ id: string; pollId: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id, pollId } = await params;

    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });
    if (!membership) {
      return NextResponse.json({ error: Errors.NOT_A_MEMBER }, { status: 403 });
    }

    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id, status: "open" },
    });
    if (!poll) {
      return NextResponse.json(
        { error: Errors.POLL_NOT_FOUND_OR_CLOSED },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { optionId, optionIds, voterName } = body;
    const ids: string[] = Array.isArray(optionIds)
      ? optionIds
      : optionId
        ? [optionId]
        : [];

    if (!ids.length) {
      return NextResponse.json({ error: "optionId ist erforderlich" }, { status: 400 });
    }
    if (ids.length > 50) {
      return NextResponse.json({ error: "Zu viele Optionen" }, { status: 400 });
    }
    if (poll.type === "single" && ids.length > 1) {
      return NextResponse.json(
        { error: Errors.SINGLE_CHOICE_ONLY_ONE },
        { status: 400 }
      );
    }

    const displayName = voterName ?? session.user.name ?? "Unbekannt";

    const votes = await prisma.$transaction(async (tx) => {
      await tx.groupPollVote.deleteMany({
        where: {
          option: { pollId },
          userId: session.user.id,
        },
      });

      return Promise.all(
        ids.map((oid) =>
          tx.groupPollVote.create({
            data: {
              optionId: oid,
              voterName: displayName,
              userId: session.user.id,
            },
          })
        )
      );
    });

    return NextResponse.json(votes.map(toGroupPollVoteDto), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
