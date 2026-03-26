import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { findPublicGroupByToken } from "@/lib/group-share";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { token } = await params;

  try {
    const group = await findPublicGroupByToken(token, {
      owner: { select: { name: true } },
      members: {
        include: { user: { select: { name: true } } },
        orderBy: { joinedAt: "asc" },
      },
      polls: {
        include: {
          createdBy: { select: { name: true } },
          options: {
            include: {
              votes: true,
              _count: { select: { votes: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          comments: {
            orderBy: { createdAt: "asc" },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { pollId: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    // Check password if set (accept from header or query param)
    const password = request.headers.get("x-group-password") || new URL(request.url).searchParams.get("password");

    if (group.password && (!password || !(await compare(password, group.password)))) {
      // Return minimal info without details
      return NextResponse.json({
        id: group.id,
        name: group.name,
        requiresPassword: true,
      }, { status: 403 });
    }

    // Strip password from response
    const { password: _pw, ...safeGroup } = group;
    return NextResponse.json({
      ...safeGroup,
      requiresPassword: false,
    });
  } catch (error) {
    logger.error({ err: error }, "Error fetching public group");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
