import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { validateString } from "@/lib/validation";
import prisma from "@/lib/db";
import { toGroupPollDto } from "@/lib/dto-mappers";

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

    const polls = await prisma.groupPoll.findMany({
      where: { groupId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
        options: {
          include: {
            votes: true,
            _count: { select: { votes: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(polls.map(toGroupPollDto));
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
    const { title, description, type, options } = body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { error: Errors.TITLE_AND_OPTIONS_REQUIRED },
        { status: 400 }
      );
    }

    const titleError = validateString(title, "Titel", { max: 200 });
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 });
    }

    for (const text of options) {
      const optionError = validateString(text, "Option", { max: 500 });
      if (optionError) {
        return NextResponse.json({ error: optionError }, { status: 400 });
      }
    }

    const poll = await prisma.groupPoll.create({
      data: {
        groupId: id,
        title,
        description: description || null,
        type: type || "single",
        createdById: session.user.id,
        options: {
          create: (options as string[]).map((text, index) => ({
            text,
            sortOrder: index,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        options: {
          include: {
            votes: true,
            _count: { select: { votes: true } },
          },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(toGroupPollDto(poll), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
