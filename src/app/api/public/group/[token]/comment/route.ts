import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import { findPublicGroupByToken } from "@/lib/group-share";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { token } = await params;

  try {
    const group = await findPublicGroupByToken(token, {});

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const body = await request.json();
    const { content, pollId, authorName, password } = body;

    // Check password if set
    if (group.password && (!password || !(await compare(password, group.password)))) {
      return NextResponse.json({ error: "Invalid password" }, { status: 403 });
    }

    if (!content || !content.trim() || !authorName || !authorName.trim()) {
      return NextResponse.json({ 
        error: "content and authorName are required" 
      }, { status: 400 });
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
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
