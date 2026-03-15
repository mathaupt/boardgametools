import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Only owner or admin can add members
    const membership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id, role: { in: ["owner", "admin"] } },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not authorized to add members" }, { status: 403 });
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const existing = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: user.id },
    });

    if (existing) {
      return NextResponse.json({ error: "User is already a member" }, { status: 409 });
    }

    const member = await prisma.groupMember.create({
      data: { groupId: id, userId: user.id, role: "member" },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error("Error adding member:", error);
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
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // Owner can remove anyone, members can only remove themselves
    const myMembership = await prisma.groupMember.findFirst({
      where: { groupId: id, userId: session.user.id },
    });

    if (!myMembership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (userId !== session.user.id && myMembership.role !== "owner") {
      return NextResponse.json({ error: "Only owner can remove others" }, { status: 403 });
    }

    // Can't remove the owner
    const targetMember = await prisma.groupMember.findFirst({
      where: { groupId: id, userId },
    });

    if (!targetMember) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (targetMember.role === "owner") {
      return NextResponse.json({ error: "Cannot remove the owner" }, { status: 400 });
    }

    await prisma.groupMember.delete({ where: { id: targetMember.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing member:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
