import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { findPublicEventByToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";
import { validateString } from "@/lib/validation";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";

type RouteContext = { params: Promise<{ token: string }> };

// POST: Gast stimmt über Terminvorschläge ab
// Body: { guestId: string, votes: [{ dateProposalId: string, availability: "yes"|"maybe"|"no" }] }
export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`pub-date-vote:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { token } = await params;

  try {
    const event = await findPublicEventByToken(token);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const body = await request.json();
    const { guestId, votes } = body;

    const guestIdError = validateString(guestId, "guestId", { max: 100 });
    if (guestIdError) return NextResponse.json({ error: guestIdError }, { status: 400 });

    if (!guestId || !votes || !Array.isArray(votes) || votes.length === 0) {
      return NextResponse.json(
        { error: "Missing required fields: guestId, votes" },
        { status: 400 }
      );
    }

    if (votes.length > 366) {
      return NextResponse.json({ error: "Too many votes" }, { status: 400 });
    }

    const validAvailabilities = ["yes", "maybe", "no"];
    for (const v of votes) {
      if (!v.availability || !validAvailabilities.includes(v.availability)) {
        return NextResponse.json(
          { error: "availability must be 'yes', 'maybe', or 'no'" },
          { status: 400 }
        );
      }
    }

    // Prüfe ob Gast zum Event gehört
    const guest = await prisma.guestParticipant.findFirst({
      where: { id: guestId, eventId: event.id },
    });

    if (!guest) {
      return NextResponse.json(
        { error: "Guest not found for this event" },
        { status: 404 }
      );
    }

    // Bulk upsert in transaction
    const results = await prisma.$transaction(
      votes.map((v: { dateProposalId: string; availability: string }) =>
        prisma.guestDateVote.upsert({
          where: {
            dateProposalId_guestId: {
              dateProposalId: v.dateProposalId,
              guestId,
            },
          },
          update: { availability: v.availability },
          create: {
            dateProposalId: v.dateProposalId,
            guestId,
            availability: v.availability,
          },
        })
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    logger.error({ err: error }, "Error guest date voting");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
