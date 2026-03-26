import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    // Check membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

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

    return NextResponse.json(polls);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    // Check membership
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: userId },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, type, options } = body;

    if (!title || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json({ 
        error: "Title and at least 2 options are required" 
      }, { status: 400 });
    }

    const validationError = validateString(title, "Titel", { max: 200 });
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const poll = await prisma.groupPoll.create({
      data: {
        groupId: id,
        title,
        description: description || null,
        type: type || "single",
        createdById: userId,
        options: {
          create: options.map((text: string, index: number) => ({
            text,
            sortOrder: index,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, name: true } },
        options: {
          include: { _count: { select: { votes: true } } },
          orderBy: { sortOrder: "asc" },
        },
        _count: { select: { comments: true } },
      },
    });

    return NextResponse.json(poll, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
