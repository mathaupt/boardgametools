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
    const body = await request.json();
    const { email, userId } = body;

    if (!email && !userId) {
      return NextResponse.json({ 
        error: "Either email or userId is required" 
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: session.user.id }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Ziel-User ermitteln (entweder über userId oder E-Mail)
    const targetUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : await prisma.user.findUnique({ where: { email } });

    if (!targetUser) {
      return NextResponse.json({ 
        error: "User not found - only existing users can be invited" 
      }, { status: 404 });
    }

    // Prüfe ob User bereits eingeladen ist
    const existingInvite = await prisma.eventInvite.findFirst({
      where: { 
        eventId: id,
        userId: targetUser.id,
      }
    });

    if (existingInvite) {
      return NextResponse.json({ 
        error: "User already invited" 
      }, { status: 400 });
    }

    // Erstelle Einladung
    const invite = await prisma.eventInvite.create({
      data: {
        eventId: id,
        userId: targetUser.id,
        status: "pending"
      },
      include: {
        user: true
      }
    });

    // TODO: Sende E-Mail (später implementieren)
    console.log(`Invite sent to ${email} for event ${event.title}`);

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
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
  const { searchParams } = new URL(request.url);
  const inviteId = searchParams.get("inviteId");

  if (!inviteId) {
    return NextResponse.json({ 
      error: "Missing required parameter: inviteId" 
    }, { status: 400 });
  }

  try {
    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: session.user.id }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Lösche Einladung
    await prisma.eventInvite.delete({
      where: { id: inviteId }
    });

    return NextResponse.json({ message: "Invite deleted" });
  } catch (error) {
    console.error("Error deleting invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
