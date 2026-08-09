import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { validateString } from "@/lib/validation";
import prisma from "@/lib/db";
import { toGroupCommentDto } from "@/lib/dto-mappers";

type RouteContext = { params: Promise<{ id: string }> };

async function requireMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId },
  });
  if (!membership) throw new ApiError(403, Errors.NOT_A_MEMBER);
}

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    await requireMembership(id, session.user.id);

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get("pollId") || null;

    const comments = await prisma.groupComment.findMany({
      where: { groupId: id, pollId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments.map(toGroupCommentDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    await requireMembership(id, session.user.id);

    const body = await request.json();
    const { content, authorName, pollId } = body;

    const validationError = validateString(content, "Inhalt", { max: 2000 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const comment = await prisma.groupComment.create({
      data: {
        groupId: id,
        pollId: pollId || null,
        authorName: authorName ?? session.user.name ?? "Unbekannt",
        userId: session.user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json(toGroupCommentDto(comment), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
