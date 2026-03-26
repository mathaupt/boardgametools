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
  const { allowed, retryAfterMs } = checkRateLimit(`pub-group-comment:${ip}`, 10, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;

  try {
    const group = await findPublicGroupByToken(token, {});

    if (!group) {
      return NextResponse.json({ error: Errors.GROUP_NOT_FOUND }, { status: 404 });
    }

    const body = await request.json();
    const { content, pollId, authorName, password } = body;

    const validationError = firstError(
      validateString(content, "content", { min: 1, max: 2000 }),
      validateString(authorName, "authorName", { min: 1, max: 80 }),
      validateString(pollId, "pollId", { required: false, max: 100 }),
      validateString(password, "password", { required: false, max: 100 })
    );
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    // Check password if set
    if (group.password && (!password || !(await compare(password, group.password)))) {
      return NextResponse.json({ error: Errors.INVALID_PASSWORD }, { status: 403 });
    }

    const comment = await prisma.groupComment.create({
      data: {
        groupId: group.id,
        pollId: pollId || null,
        authorName: authorName.trim(),
        content: content.trim(),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    logger.error({ err: error }, "Error creating comment");
    return NextResponse.json({ error: Errors.INTERNAL_SERVER_ERROR }, { status: 500 });
  }
});
