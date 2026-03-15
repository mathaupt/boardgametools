import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendCustomEventMessage, sendEventUpcomingReminder } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { encryptId } from "@/lib/crypto";

function buildEventUrl(invite: { id: string; userId: string | null }, eventId: string) {
  const base = getPublicBaseUrl();
  if (invite.userId) {
    return `${base}/dashboard/events/${eventId}`;
  }
  return `${base}/public/invite/${encryptId(invite.id)}`;
}

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
    const { type, message, subject } = body;

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
      where: { id, createdById: session.user.id },
      include: {
        invites: { include: { user: true } },
      },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const senderName = session.user.name || session.user.email || "Der Organisator";
    let sentCount = 0;
    let failedCount = 0;

    // Empfänger bestimmen
    const recipients = type === "reminder"
      ? event.invites.filter((inv) => inv.status === "accepted")
      : event.invites.filter((inv) => inv.userId !== session.user.id);

    for (const invite of recipients) {
      const recipientEmail = invite.user?.email || invite.email;
      if (!recipientEmail) continue;

      const eventUrl = buildEventUrl(invite, id);

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
        console.error(`Failed to send mail to ${recipientEmail}:`, mailErr);
        failedCount++;
      }
    }

    const label = type === "custom" ? "Nachrichten" : "Erinnerungen";

    return NextResponse.json({
      message: `${sentCount} ${label} gesendet${failedCount > 0 ? `, ${failedCount} fehlgeschlagen` : ""}`,
      sentCount,
      failedCount,
      totalRecipients: recipients.length,
    });
  } catch (error) {
    console.error("Error sending event mail:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
