import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { sendEventReminderEmail } from "@/lib/mailer";
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
    const { inviteId } = body;

    if (!inviteId) {
      return NextResponse.json({ error: "Missing inviteId" }, { status: 400 });
    }

    // Prüfe ob Event existiert und User Berechtigung hat
    const event = await prisma.event.findFirst({
      where: { id, createdById: session.user.id },
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Lade Einladung mit User
    const invite = await prisma.eventInvite.findUnique({
      where: { id: inviteId },
      include: { user: true },
    });

    if (!invite || invite.eventId !== id) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({
        error: "Invite already responded to",
      }, { status: 400 });
    }

    const recipientEmail = invite.user?.email || invite.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "No email address for invite" }, { status: 400 });
    }

    const eventUrl = `${getPublicBaseUrl()}/dashboard/events/${id}`;

    await sendEventReminderEmail({
      to: recipientEmail,
      eventTitle: event.title,
      eventDate: event.eventDate,
      location: event.location,
      inviterName: session.user.name || session.user.email || "Jemand",
      eventUrl,
    });

    return NextResponse.json({ message: "Reminder sent" });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
