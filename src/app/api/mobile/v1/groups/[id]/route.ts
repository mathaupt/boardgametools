import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GroupService, UpdateGroupInput } from "@/lib/services/group.service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import {
  toGroupDto,
  toGroupMemberDto,
  toGroupPollDto,
  toGroupCommentDto,
  toEventDto,
} from "@/lib/dto-mappers";
import prisma from "@/lib/db";
import { NOT_DELETED, SAFE_USER_SELECT } from "@/lib/services/shared";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;

    const group = await prisma.group.findFirst({
      where: {
        id,
        ...NOT_DELETED,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
          { isPublic: true },
        ],
      },
      include: {
        owner: { select: SAFE_USER_SELECT },
        members: {
          include: { user: { select: SAFE_USER_SELECT } },
          orderBy: { joinedAt: "asc" },
        },
        events: {
          orderBy: { eventDate: "desc" },
          take: 10,
        },
        polls: {
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
        },
        comments: {
          where: { pollId: null },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: Errors.GROUP_NOT_FOUND }, { status: 404 });
    }

    const dto = {
      ...toGroupDto(group),
      members: group.members.map(toGroupMemberDto),
      events: group.events.map(toEventDto),
      polls: group.polls.map(toGroupPollDto),
      comments: group.comments.map(toGroupCommentDto),
    };

    return NextResponse.json(dto);
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = (await request.json()) as UpdateGroupInput;
    const updated = await GroupService.update(session.user.id, id, body);

    return NextResponse.json(toGroupDto(updated));
  } catch (error) {
    return handleApiError(error);
  }
});

export const PATCH = PUT;

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    await GroupService.delete(session.user.id, id);

    return NextResponse.json({ message: "Gruppe gelöscht" });
  } catch (error) {
    return handleApiError(error);
  }
});
