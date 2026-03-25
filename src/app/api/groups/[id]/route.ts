import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { auth } from "@/lib/auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";

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
    const group = await prisma.group.findFirst({
      where: {
        id,
        deletedAt: null,
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

    // Strip password hash from response
    const { password: _pw, ...safeGroup } = group;
    return NextResponse.json({ ...safeGroup, hasPassword: !!_pw });
  } catch (error) {
    console.error("Error fetching group:", error);
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

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: session.user.id, deletedAt: null },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, password } = body;

    const validationError = firstError(
      validateString(name, "name", { required: false, min: 1, max: 100 }),
      validateString(description, "description", { required: false, max: 1000 }),
      validateString(password, "password", { required: false, max: 100 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    // Hash password if provided, null to remove
    const passwordData = password !== undefined
      ? { password: password ? await hash(password, 12) : null }
      : {};

    const updated = await prisma.group.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description || null }),
        ...passwordData,
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { members: true, polls: true } },
      },
    });

    invalidateTag(CacheTags.userGroups(session.user.id));
    invalidateTag(CacheTags.userDashboard(session.user.id));

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating group:", error);
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

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: session.user.id, deletedAt: null },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found or not owner" }, { status: 404 });
    }

    await prisma.group.update({ where: { id }, data: { deletedAt: new Date() } });

    invalidateTag(CacheTags.userGroups(session.user.id));
    invalidateTag(CacheTags.userDashboard(session.user.id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
