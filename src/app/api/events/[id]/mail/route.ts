import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { sendCustomEventMessage, sendEventUpcomingReminder } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";
import { withApiLogging } from "@/lib/api-logger";
import { validateString, firstError } from "@/lib/validation";

type RouteContext = { params: Promise<{ id: string }> };

async function buildEventUrl(invite: { id: string; userId: string | null }, eventId: string) {
  const base = await getPublicBaseUrl();
  if (invite.userId) {
    return `${base}/dashboard/events/${eventId}`;
  }
  return `${base}/public/invite/${encryptId(invite.id)}`;
}

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId, name, email } = await requireAuth();

  const { id } = await params;

  try {
    const body = await request.json();
    const { type, message, subject } = body;

    const validationError = firstError(
      validateString(message, "message", { required: false, max: 5000 }),
      validateString(subject, "subject", { required: false, max: 200 })
    );
    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 });

    if (!type || !["custom", "reminder"].includes(type)) {
      return NextResponse.json({
        error: "Invalid type. Must be 'custom' or 'reminder'.",
      }, { status: 400 });
    }

    if (type === "custom" && (!message || !message.trim())) {
      return NextResponse.json({
        error: "Message is required for custom emails.",
      }, { status: 400 });
    }

    // Prüfe ob Event existiert und User der Organisator ist
    const event = await prisma.event.findFirst({
      where: { id, createdById: userId, deletedAt: null },
      include: {
        invites: { include: { user: { select: { id: true, name: true, email: true } } } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const senderName = name || email || "Der Organisator";
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Empfänger bestimmen
    const recipients = type === "reminder"
      ? event.invites.filter((inv) => inv.status === "accepted")
      : event.invites.filter((inv) => inv.userId !== userId);

    for (const invite of recipients) {
      const recipientEmail = invite.user?.email || invite.email;
      if (!recipientEmail) continue;

      const eventUrl = await buildEventUrl(invite, id);

      try {
        if (type === "custom") {
          await sendCustomEventMessage({
            to: recipientEmail,
            subject: subject?.trim() || undefined,
            eventTitle: event.title,
            eventDate: event.eventDate,
            location: event.location,
            senderName,
            message: message.trim(),
            eventUrl,
          });
        } else {
          await sendEventUpcomingReminder({
            to: recipientEmail,
            eventTitle: event.title,
            eventDate: event.eventDate,
            location: event.location,
            organizerName: senderName,
            eventUrl,
          });
        }
        sentCount++;
      } catch (mailErr) {
        const errMsg = mailErr instanceof Error ? mailErr.message : String(mailErr);
        console.error("Failed to send mail:", errMsg);
        errors.push(`${recipientEmail}: ${errMsg}`);
        failedCount++;
      }
    }

    const label = type === "custom" ? "Nachrichten" : "Erinnerungen";

    return NextResponse.json({
      message: `${sentCount} ${label} gesendet${failedCount > 0 ? `, ${failedCount} fehlgeschlagen` : ""}`,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
      ...(errors.length > 0 ? { errors } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
});
