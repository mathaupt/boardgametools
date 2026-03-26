import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail, sendInviteResponseEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";
import logger from "@/lib/logger";

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
  const { userId: authUserId, name: authName, email: authEmail } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { email: targetEmail, userId: targetUserId } = body;

    const validationError = firstError(
      validateString(targetEmail, "email", { required: false, max: 254 }),
      validateString(targetUserId, "userId", { required: false, max: 100 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    if (!targetEmail && !targetUserId) {
      return NextResponse.json({ 
        error: "Either email or userId is required" 
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: authUserId, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Ziel-User ermitteln (falls vorhanden)
    const targetUser = targetUserId
      ? await prisma.user.findUnique({ where: { id: targetUserId } })
      : targetEmail
        ? await prisma.user.findUnique({ where: { email: targetEmail } })
        : null;

    // Prüfe ob bereits eingeladen
    if (targetUser) {
      const existing = await prisma.eventInvite.findFirst({
        where: { eventId: id, userId: targetUser.id },
      });
      if (existing) {
        return NextResponse.json({ error: "User already invited" }, { status: 400 });
      }
    } else if (targetEmail) {
      const existing = await prisma.eventInvite.findFirst({
        where: { eventId: id, email: targetEmail },
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
        email: targetUser ? null : targetEmail,
        status: "pending",
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Sende Einladungs-Mail
    const recipientEmail = targetUser?.email || targetEmail;
    if (recipientEmail) {
      const eventUrl = await buildInviteUrl(invite, id);
      try {
        await sendEventInviteEmail({
          to: recipientEmail,
          eventTitle: event.title,
          eventDate: event.eventDate,
          location: event.location,
          inviterName: authName || authEmail || "Jemand",
          eventUrl,
        });
      } catch (mailErr) {
        logger.error({ err: mailErr }, "Failed to send invite email");
      }
    }

    invalidateTag(CacheTags.userEvents(authUserId));

    return NextResponse.json(invite, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});

// Einladung annehmen oder ablehnen (für eingeloggte User)
export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId, name, email } = await requireAuth();

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
      where: { eventId: id, userId: userId },
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
      include: { user: { select: { id: true, name: true, email: true } } },
    });

    // Benachrichtige Organisator per Mail
    const event = await prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: { createdBy: { select: { email: true, name: true } } },
    });

    if (event && event.createdById !== userId) {
      const eventUrl = `${await getPublicBaseUrl()}/dashboard/events/${id}`;
      try {
        await sendInviteResponseEmail({
          to: event.createdBy.email,
          eventTitle: event.title,
          responderName: name || email || "Jemand",
          response: status,
          eventUrl,
        });
      } catch (mailErr) {
        logger.error({ err: mailErr }, "Failed to send invite response email");
      }
    }

    return NextResponse.json(updatedInvite);
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

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
      where: { id, createdById: userId, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Lösche Einladung (nur wenn sie zu diesem Event gehört → IDOR-Schutz)
    const invite = await prisma.eventInvite.findFirst({
      where: { id: inviteId, eventId: id },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    await prisma.eventInvite.delete({
      where: { id: invite.id }
    });

    return NextResponse.json({ message: "Invite deleted" });
  } catch (error) {
    return handleApiError(error);
  }
});
