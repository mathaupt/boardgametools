import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Event mit allen Details laden
    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        invites: {
          include: { user: { select: { id: true, name: true, email: true } } }
        },
        proposals: {
          include: {
            game: true,
            proposedBy: true,
            guest: { select: { id: true, nickname: true } },
            _count: { select: { votes: true, guestVotes: true } },
            votes: {
              where: { userId: session.user.id },
              select: { id: true },
            },
          }
        },
        selectedGame: true,
        guestParticipants: {
          include: {
            _count: { select: { votes: true } }
          },
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Prüfe ob User Berechtigung hat (Ersteller oder eingeladen)
    const isCreator = event.createdById === session.user.id;
    const isInvited = event.invites.some(invite => invite.userId === session.user.id);

    if (!isCreator && !isInvited) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const eventResponse = {
      ...event,
      proposals: event.proposals.map(proposal => {
        // Merge game data: prefer DB game, fallback to inline BGG fields
        const gameData = proposal.game ?? {
          id: `bgg-${proposal.bggId}`,
          name: proposal.bggName ?? "Unbekanntes Spiel",
          imageUrl: proposal.bggImageUrl ?? null,
          minPlayers: proposal.bggMinPlayers ?? null,
          maxPlayers: proposal.bggMaxPlayers ?? null,
          playTimeMinutes: proposal.bggPlayTimeMinutes ?? null,
          description: null,
          complexity: null,
          bggId: proposal.bggId,
          ean: null,
          ownerId: null,
          createdAt: proposal.createdAt,
          updatedAt: proposal.createdAt,
        };

        // Merge proposedBy: prefer DB user, fallback to guest
        const proposedByData = proposal.proposedBy ?? (proposal.guest
          ? { id: proposal.guest.id, name: proposal.guest.nickname, email: "", passwordHash: "", role: "GUEST", isActive: true, createdAt: proposal.createdAt, updatedAt: proposal.createdAt }
          : null);

        return {
          ...proposal,
          game: gameData,
          proposedBy: proposedByData,
          totalVotes: proposal._count.votes + proposal._count.guestVotes,
          userHasVoted: proposal.votes.length > 0,
          votes: undefined,
        };
      }),
      guestParticipants: event.guestParticipants.map((guest) => ({
        ...guest,
        votes: undefined,
      })),
      currentUserId: session.user.id,
      isCreator,
    };

    return NextResponse.json(eventResponse);
  } catch (error) {
    console.error("Error fetching event:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
