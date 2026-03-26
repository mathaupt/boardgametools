import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { findPublicGroupByToken } from "@/lib/group-share";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-group-vote:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;

  try {
    const group = await findPublicGroupByToken(token, {});

    if (!group) {
      return NextResponse.json({ error: Errors.GROUP_NOT_FOUND }, { status: 404 });
    }

    const body = await request.json();
    const { pollId, optionIds, voterName, password } = body;

    const validationError = firstError(
      validateString(voterName, "voterName", { min: 1, max: 80 }),
      validateString(pollId, "pollId", { min: 1, max: 100 }),
      validateString(password, "password", { required: false, max: 100 })
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check password if set
    if (group.password && (!password || !(await compare(password, group.password)))) {
      return NextResponse.json({ error: Errors.INVALID_PASSWORD }, { status: 403 });
    }

    if (!pollId || !optionIds || !Array.isArray(optionIds) || optionIds.length === 0 || !voterName) {
      return NextResponse.json({ 
        error: Errors.POLL_VOTE_FIELDS_REQUIRED 
      }, { status: 400 });
    }

    if (optionIds.length > 50) {
      return NextResponse.json({ error: "Too many options" }, { status: 400 });
    }

    // Check poll exists and is open
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: group.id, status: "open" },
    });

    if (!poll) {
      return NextResponse.json({ error: Errors.POLL_NOT_FOUND_OR_CLOSED }, { status: 404 });
    }

    // For single-choice, only one option
    if (poll.type === "single" && optionIds.length > 1) {
      return NextResponse.json({ error: Errors.SINGLE_CHOICE_ONLY_ONE }, { status: 400 });
    }

    const trimmedVoterName = voterName.trim();

    // Atomically replace votes in a single transaction
    const votes = await prisma.$transaction(async (tx) => {
      await tx.groupPollVote.deleteMany({
        where: {
          option: { pollId },
          voterName: trimmedVoterName,
          userId: null,
        },
      });

      const created = await Promise.all(
        optionIds.map((optionId: string) =>
          tx.groupPollVote.create({
            data: {
              optionId,
              voterName: trimmedVoterName,
            },
          })
        )
      );

      return created;
    });

    return NextResponse.json(votes, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error voting");
    return NextResponse.json({ error: Errors.INTERNAL_SERVER_ERROR }, { status: 500 });
  }
});
