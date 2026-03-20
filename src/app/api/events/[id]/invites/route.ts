import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail, sendInviteResponseEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

async function buildInviteUrl(invite: { id: string; userId: string | null }, eventId: string) {
  const base = await getPublicBaseUrl();
  // Registrierte User → Dashboard, externe → öffentliche Invite-Seite
  if (invite.userId) {
    return `${base}/dashboard/events/${eventId}`;
  }
  const token = encryptId(invite.id);
  return `${base}/public/invite/${token}`;
}

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

    // Ziel-User ermitteln (falls vorhanden)
    const targetUser = userId
      ? await prisma.user.findUnique({ where: { id: userId } })
      : email
        ? await prisma.user.findUnique({ where: { email } })
        : null;

    // Prüfe ob bereits eingeladen
    if (targetUser) {
      const existing = await prisma.eventInvite.findFirst({
        where: { eventId: id, userId: targetUser.id },
      });
      if (existing) {
        return NextResponse.json({ error: "User already invited" }, { status: 400 });
      }
    } else if (email) {
      const existing = await prisma.eventInvite.findFirst({
        where: { eventId: id, email },
      });
      if (existing) {
        return NextResponse.json({ error: "Email already invited" }, { status: 400 });
      }
    }

    // Erstelle Einladung (mit User-Verknüpfung oder nur E-Mail)
    const invite = await prisma.eventInvite.create({
      data: {
        eventId: id,
        userId: targetUser?.id || null,
        email: targetUser ? null : email,
        status: "pending",
      },
      include: { user: true },
    });

    // Sende Einladungs-Mail
    const recipientEmail = targetUser?.email || email;
    if (recipientEmail) {
      const eventUrl = await buildInviteUrl(invite, id);
      try {
        await sendEventInviteEmail({
          to: recipientEmail,
          eventTitle: event.title,
          eventDate: event.eventDate,
          location: event.location,
          inviterName: session.user.name || session.user.email || "Jemand",
          eventUrl,
        });
      } catch (mailErr) {
        console.error("Failed to send invite email:", mailErr);
      }
    }

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    console.error("Error creating invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// Einladung annehmen oder ablehnen (für eingeloggte User)
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
      include: { createdBy: { select: { email: true, name: true } } },
    });

    if (event && event.createdById !== session.user.id) {
      const eventUrl = `${await getPublicBaseUrl()}/dashboard/events/${id}`;
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
});
