import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { sendEventInviteEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId, name, email } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { userIds } = body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ 
        error: Errors.MISSING_USER_IDS 
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: userId, deletedAt: null }
    });

    if (!event) {
      return NextResponse.json({ error: Errors.EVENT_NOT_FOUND }, { status: 404 });
    }

    const eventUrl = `${await getPublicBaseUrl()}/dashboard/events/${id}`;
    const inviterName = name || email || "Jemand";

    // Erstelle Einladungen für alle User
    const invites = await Promise.all(
      userIds.map(async (userId: string) => {
        // Prüfe ob User bereits eingeladen ist
        const existingInvite = await prisma.eventInvite.findFirst({
          where: { 
            eventId: id,
            userId: userId
          }
        });

        if (existingInvite) {
          return existingInvite;
        }

        // Prüfe ob User existiert
        const user = await prisma.user.findUnique({
          where: { id: userId }
        });

        if (!user) {
          throw new Error(`User ${userId} not found`);
        }

        // Erstelle neue Einladung
        const invite = await prisma.eventInvite.create({
          data: {
            eventId: id,
            userId: userId,
            status: "pending"
          },
          include: {
            user: { select: { id: true, name: true, email: true } }
          }
        });

        // Sende Einladungs-Mail
        try {
          await sendEventInviteEmail({
            to: user.email,
            eventTitle: event.title,
            eventDate: event.eventDate,
            location: event.location,
            inviterName,
            eventUrl,
          });
        } catch (mailErr) {
          logger.error({ err: mailErr }, "Failed to send invite email");
        }

        return invite;
      })
    );

    return NextResponse.json({
      message: `Event shared with ${invites.length} users`,
      invites: invites
    });
  } catch (error) {
    return handleApiError(error);
  }
});
