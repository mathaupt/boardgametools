import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";

export const GET = withApiLogging(async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tags = await prisma.tag.findMany({
    where: { ownerId: session.user.id },
    include: { _count: { select: { games: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(tags);
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name } = body;

    const error = validateString(name, "Name", { max: 50 });
    if (error) {
      return NextResponse.json({ error }, { status: 400 });
    }

    const trimmed = name.trim();

    const existing = await prisma.tag.findUnique({
      where: { name_ownerId: { name: trimmed, ownerId: session.user.id } },
    });
    if (existing) {
      return NextResponse.json(existing);
    }

    const tag = await prisma.tag.create({
      data: { name: trimmed, ownerId: session.user.id, source: "manual" },
    });

    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Tag ID required" }, { status: 400 });
  }

  const tag = await prisma.tag.findFirst({
    where: { id, ownerId: session.user.id },
  });
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  await prisma.tag.delete({ where: { id } });

  return NextResponse.json({ message: "Tag deleted" });
});
