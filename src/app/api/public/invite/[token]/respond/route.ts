import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { decryptId } from "@/lib/crypto";
import { sendInviteResponseEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let inviteId: string;
  try {
    inviteId = decryptId(token);
  } catch {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { status, name } = body;

    if (!status || !["accepted", "declined"].includes(status)) {
      return NextResponse.json({
        error: "Invalid status. Must be 'accepted' or 'declined'."
      }, { status: 400 });
    }

    // Lade Einladung
    const invite = await prisma.eventInvite.findUnique({
      where: { id: inviteId },
      include: {
        event: {
          include: { createdBy: true },
        },
      },
    });

    if (!invite) {
      return NextResponse.json({ error: "Invite not found" }, { status: 404 });
    }

    if (invite.status !== "pending") {
      return NextResponse.json({
        error: "Invite already responded to",
        currentStatus: invite.status,
      }, { status: 400 });
    }

    // Update Einladungsstatus
    const updatedInvite = await prisma.eventInvite.update({
      where: { id: inviteId },
      data: {
        status,
        respondedAt: new Date(),
      },
    });

    // Benachrichtige Organisator
    const event = invite.event;
    const responderName = name || invite.email || "Ein externer Gast";
    const eventUrl = `${getPublicBaseUrl()}/dashboard/events/${event.id}`;

    try {
      await sendInviteResponseEmail({
        to: event.createdBy.email,
        eventTitle: event.title,
        responderName,
        response: status,
        eventUrl,
      });
    } catch (mailErr) {
      console.error("Failed to send invite response email:", mailErr);
    }

    return NextResponse.json({
      message: status === "accepted" ? "Einladung angenommen!" : "Einladung abgelehnt.",
      status: updatedInvite.status,
    });
  } catch (error) {
    console.error("Error responding to invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET - Invite-Details laden (ohne Auth)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  let inviteId: string;
  try {
    inviteId = decryptId(token);
  } catch {
    return NextResponse.json({ error: "Invalid invite token" }, { status: 400 });
  }

  const invite = await prisma.eventInvite.findUnique({
    where: { id: inviteId },
    include: {
      event: {
        include: {
          createdBy: { select: { name: true } },
          proposals: {
            include: {
              game: {
                select: { name: true, imageUrl: true, minPlayers: true, maxPlayers: true },
              },
              _count: { select: { votes: true, guestVotes: true } },
            },
          },
          _count: { select: { invites: true } },
        },
      },
    },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invite not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: invite.id,
    status: invite.status,
    email: invite.email,
    respondedAt: invite.respondedAt,
    event: {
      title: invite.event.title,
      description: invite.event.description,
      eventDate: invite.event.eventDate,
      location: invite.event.location,
      status: invite.event.status,
      organizer: invite.event.createdBy.name,
      inviteCount: invite.event._count.invites,
      proposals: invite.event.proposals.map((p) => ({
        gameName: p.game.name,
        imageUrl: p.game.imageUrl,
        minPlayers: p.game.minPlayers,
        maxPlayers: p.game.maxPlayers,
        totalVotes: p._count.votes + p._count.guestVotes,
      })),
    },
  });
}
