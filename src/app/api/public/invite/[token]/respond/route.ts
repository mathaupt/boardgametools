import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import prisma from "@/lib/db";
import { decryptId } from "@/lib/crypto";
import { sendInviteResponseEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { CacheTags } from "@/lib/cache-tags";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-invite-respond:${ip}`, 5, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

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

    const nameError = validateString(name, "name", { required: false, max: 100 });
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });

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
          include: { createdBy: { select: { email: true, name: true } } },
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
    const eventUrl = `${await getPublicBaseUrl()}/dashboard/events/${event.id}`;

    try {
      await sendInviteResponseEmail({
        to: event.createdBy.email,
        eventTitle: event.title,
        responderName,
        response: status,
        eventUrl,
      });
    } catch (mailErr) {
      logger.error({ err: mailErr }, "Failed to send invite response email");
    }

    // Invalidate caches for the responding user (if registered)
    if (invite.userId) {
      invalidateTag(CacheTags.pendingInvites(invite.userId));
      invalidateTag(CacheTags.userEvents(invite.userId));
    }
    // Also invalidate the event creator's events
    invalidateTag(CacheTags.userEvents(invite.event.createdById));

    return NextResponse.json({
      message: status === "accepted" ? "Einladung angenommen!" : "Einladung abgelehnt.",
      status: updatedInvite.status,
    });
  } catch (error) {
    logger.error({ err: error }, "Error responding to invite");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});

// GET - Invite-Details laden (ohne Auth)
export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
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
        gameName: p.game?.name ?? p.bggName ?? "Unbekannt",
        imageUrl: p.game?.imageUrl ?? p.bggImageUrl ?? null,
        minPlayers: p.game?.minPlayers ?? p.bggMinPlayers ?? null,
        maxPlayers: p.game?.maxPlayers ?? p.bggMaxPlayers ?? null,
        totalVotes: p._count.votes + p._count.guestVotes,
      })),
    },
  });
});
