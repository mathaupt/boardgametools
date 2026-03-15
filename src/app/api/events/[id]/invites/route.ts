import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail, sendInviteResponseEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";

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

    // Sende Einladungs-Mail
    const eventUrl = `${getPublicBaseUrl()}/dashboard/events/${id}`;
    try {
      await sendEventInviteEmail({
        to: targetUser.email,
        eventTitle: event.title,
        eventDate: event.eventDate,
        location: event.location,
        inviterName: session.user.name || session.user.email || "Jemand",
        eventUrl,
      });
    } catch (mailErr) {
      console.error("Failed to send invite email:", mailErr);
      // Einladung wurde erstellt, Mail-Fehler nicht kritisch
    }

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Einladung annehmen oder ablehnen
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
    const body = await request.json();
    const { status } = body;

    if (!status || !["accepted", "declined"].includes(status)) {
      return NextResponse.json({
        error: "Invalid status. Must be 'accepted' or 'declined'."
      }, { status: 400 });
    }

    // Finde die Einladung des aktuellen Users
    const invite = await prisma.eventInvite.findFirst({
      where: { eventId: id, userId: session.user.id },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    // Update Status
    const updatedInvite = await prisma.eventInvite.update({
      where: { id: invite.id },
      data: {
        status,
        respondedAt: new Date(),
      },
      include: { user: true },
    });

    // Benachrichtige Organisator per Mail
    const event = await prisma.event.findUnique({
      where: { id },
      include: { createdBy: true },
    });

    if (event && event.createdById !== session.user.id) {
      const eventUrl = `${getPublicBaseUrl()}/dashboard/events/${id}`;
      try {
        await sendInviteResponseEmail({
          to: event.createdBy.email,
          eventTitle: event.title,
          responderName: session.user.name || session.user.email || "Jemand",
          response: status,
          eventUrl,
        });
      } catch (mailErr) {
        console.error("Failed to send invite response email:", mailErr);
      }
    }

    return NextResponse.json(updatedInvite);
  } catch (error) {
    console.error("Error updating invite:", error);
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
