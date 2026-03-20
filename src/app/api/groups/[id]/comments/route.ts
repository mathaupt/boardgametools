import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const pollId = searchParams.get("pollId");

    const comments = await prisma.groupComment.findMany({
      where: {
        groupId: id,
        pollId: pollId || null,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const { content, pollId } = body;

    const validationError = validateString(content, "Inhalt", { max: 2000 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    const comment = await prisma.groupComment.create({
      data: {
        groupId: id,
        pollId: pollId || null,
        authorName: user?.name || "Unbekannt",
        userId: session.user.id,
        content: content.trim(),
      },
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Error creating comment:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
