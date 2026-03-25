import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string; pollId: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, pollId } = await params;

  try {
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id },
      include: {
        createdBy: { select: { id: true, name: true } },
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
      },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    return NextResponse.json(poll);
  } catch (error) {
    console.error("Error fetching poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, pollId } = await params;

  try {
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    // Only poll creator or group owner can close
    const group = await prisma.group.findFirst({ where: { id, deletedAt: null } });
    if (poll.createdById !== session.user.id && group?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const { status } = body;

    const updated = await prisma.groupPoll.update({
      where: { id: pollId },
      data: {
        status: status || "closed",
        closedAt: status === "closed" ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, pollId } = await params;

  try {
    const poll = await prisma.groupPoll.findFirst({
      where: { id: pollId, groupId: id },
    });

    if (!poll) {
      return NextResponse.json({ error: "Poll not found" }, { status: 404 });
    }

    const group = await prisma.group.findFirst({ where: { id, deletedAt: null } });
    if (poll.createdById !== session.user.id && group?.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    await prisma.groupPoll.delete({ where: { id: pollId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting poll:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
