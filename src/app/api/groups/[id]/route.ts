import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { joinedAt: "asc" },
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
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json(group);
  } catch (error) {
    console.error("Error fetching group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, password } = body;

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...(password !== undefined && { password: password || null }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, polls: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: session.user.id },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    await prisma.group.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
