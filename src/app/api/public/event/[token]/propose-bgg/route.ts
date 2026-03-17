import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { resolveEventIdFromToken } from "@/lib/event-share";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ token: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  const { token } = await params;
  const eventId = await resolveEventIdFromToken(token);

  if (!eventId) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { bggId, guestId } = body ?? {};

    if (!bggId) {
      return NextResponse.json(
        { error: "Missing required field: bggId" },
        { status: 400 }
      );
    }

    // Must be either a logged-in user or a registered guest
    if (!session?.user?.id && !guestId) {
      return NextResponse.json(
        { error: "Bitte als Gast registrieren oder einloggen" },
        { status: 401 }
      );
    }

    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event || !event.isPublic) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    if (event.status === "closed") {
      return NextResponse.json(
        { error: "Event ist bereits abgeschlossen" },
        { status: 400 }
      );
    }

    // Validate guest if provided
    if (guestId) {
      const guest = await prisma.guestParticipant.findFirst({
        where: { id: guestId, eventId },
      });
      if (!guest) {
        return NextResponse.json(
          { error: "Gast nicht gefunden" },
          { status: 404 }
        );
      }
    }

    // Check for duplicate BGG proposal on this event
    const existingBggProposal = await prisma.gameProposal.findFirst({
      where: { eventId, bggId: String(bggId) },
    });

    if (existingBggProposal) {
      return NextResponse.json(
        { error: "Dieses Spiel wurde bereits vorgeschlagen" },
        { status: 400 }
      );
    }

    // Also check if the same BGG game exists as a collection game proposal
    const existingCollectionProposal = await prisma.gameProposal.findFirst({
      where: {
        eventId,
        game: { bggId: String(bggId) },
      },
    });

    if (existingCollectionProposal) {
      return NextResponse.json(
        { error: "Dieses Spiel wurde bereits vorgeschlagen" },
        { status: 400 }
      );
    }

    // Fetch game data from BGG
    const bggResponse = await fetch(
      `https://boardgamegeek.com/xmlapi2/thing?id=${encodeURIComponent(bggId)}&stats=1`,
      {
        headers: {
          "User-Agent":
            "BoardGameTools/1.0 (https://boardgametools.example.com)",
          Accept: "application/xml",
        },
      }
    );

    if (!bggResponse.ok) {
      return NextResponse.json(
        { error: "Konnte BGG-Daten nicht laden" },
        { status: 502 }
      );
    }

    const xmlText = await bggResponse.text();

    const nameMatch = xmlText.match(/<name[^>]*type="primary"[^>]*value="([^"]*)"/);
    const minPlayersMatch = xmlText.match(
      /<minplayers[^>]*value="([^"]*)"/
    );
    const maxPlayersMatch = xmlText.match(
      /<maxplayers[^>]*value="([^"]*)"/
    );
    const playTimeMatch = xmlText.match(
      /<playingtime[^>]*value="([^"]*)"/
    );
    const imageMatch = xmlText.match(/<image[^>]*>([^<]*)<\/image>/);

    const bggName = nameMatch?.[1] || `BGG #${bggId}`;
    const bggImageUrl = imageMatch?.[1] || null;
    const bggMinPlayers = minPlayersMatch?.[1]
      ? parseInt(minPlayersMatch[1], 10)
      : null;
    const bggMaxPlayers = maxPlayersMatch?.[1]
      ? parseInt(maxPlayersMatch[1], 10)
      : null;
    const bggPlayTimeMinutes = playTimeMatch?.[1]
      ? parseInt(playTimeMatch[1], 10)
      : null;

    const proposal = await prisma.gameProposal.create({
      data: {
        eventId,
        proposedById: session?.user?.id ?? null,
        guestId: guestId ?? null,
        bggId: String(bggId),
        bggName,
        bggImageUrl,
        bggMinPlayers,
        bggMaxPlayers,
        bggPlayTimeMinutes,
      },
      include: {
        game: true,
        proposedBy: { select: { id: true, name: true } },
        guest: { select: { id: true, nickname: true } },
        _count: { select: { votes: true, guestVotes: true } },
      },
    });

    // Build a unified response matching the serialized proposal format
    const gameData = {
      id: `bgg-${proposal.bggId}`,
      name: proposal.bggName!,
      imageUrl: proposal.bggImageUrl,
      minPlayers: proposal.bggMinPlayers,
      maxPlayers: proposal.bggMaxPlayers,
      playTimeMinutes: proposal.bggPlayTimeMinutes,
    };

    const proposedByData = proposal.proposedBy
      ? { id: proposal.proposedBy.id, name: proposal.proposedBy.name }
      : proposal.guest
        ? { id: proposal.guest.id, name: proposal.guest.nickname }
        : null;

    return NextResponse.json(
      {
        id: proposal.id,
        game: gameData,
        proposedBy: proposedByData,
        totalVotes: 0,
        voteCounts: { registered: 0, guests: 0 },
        userHasVoted: false,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error proposing BGG game via public link:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
