import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import prisma from "@/lib/db";
import { toGroupMemberDto } from "@/lib/dto-mappers";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = await request.json();

    const group = await prisma.group.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, shareToken: true, isPublic: true },
    });

    if (!group) {
      return NextResponse.json({ error: Errors.GROUP_NOT_FOUND }, { status: 404 });
    }

    const token = body.shareToken ?? group.shareToken;
    if (!group.isPublic && (!token || token !== group.shareToken)) {
      return NextResponse.json({ error: Errors.ACCESS_DENIED }, { status: 403 });
    }

    const existing = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (existing) {
      return NextResponse.json({ error: Errors.USER_ALREADY_MEMBER }, { status: 409 });
    }

    const member = await prisma.groupMember.create({
      data: {
        groupId: id,
        userId: session.user.id,
        role: "member",
      },
    });

    return NextResponse.json(toGroupMemberDto(member), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
