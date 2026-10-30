import prisma from "@/lib/db";
import { findPublicEventByToken } from "@/lib/event-share";
import { fetchBGGGame } from "@/lib/bgg";
import { ApiError } from "@/lib/require-auth";
import type { VotingGameDetail } from "@/lib/voting/types";

export type { VotingGameDetail };

export type EventProposalDetailScope =
  | { kind: "private"; eventId: string; userId: string }
  | { kind: "public"; token: string };

const gameSelect = {
  name: true,
  description: true,
  imageUrl: true,
  minPlayers: true,
  maxPlayers: true,
  playTimeMinutes: true,
  complexity: true,
  bggId: true,
  deletedAt: true,
} as const;

const proposalSelect = {
  id: true,
  eventId: true,
  bggId: true,
  bggName: true,
  bggImageUrl: true,
  bggMinPlayers: true,
  bggMaxPlayers: true,
  bggPlayTimeMinutes: true,
  game: { select: gameSelect },
} as const;

function safeImageUrl(value: string | null | undefined): string | null {
  if (!value || value.length > 2048) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export const EventProposalService = {
  async getGameDetail(scope: EventProposalDetailScope, proposalId: string): Promise<VotingGameDetail> {
    let eventId: string;
    let mayReadCollectionDescription = false;

    if (scope.kind === "private") {
      const event = await prisma.event.findFirst({
        where: { id: scope.eventId, deletedAt: null },
        select: {
          id: true,
          createdById: true,
          invites: { where: { userId: scope.userId }, select: { userId: true } },
        },
      });
      if (!event) throw new ApiError(404, "Event nicht gefunden.");
      if (event.createdById !== scope.userId && event.invites.length === 0) {
        throw new ApiError(403, "Du hast keinen Zugriff auf dieses Event.");
      }
      eventId = event.id;
      mayReadCollectionDescription = true;
    } else {
      const event = await findPublicEventByToken(scope.token);
      if (!event) throw new ApiError(404, "Event nicht gefunden oder nicht öffentlich.");
      eventId = event.id;
    }

    const proposal = await prisma.gameProposal.findFirst({
      where: { id: proposalId, eventId },
      select: proposalSelect,
    });
    if (!proposal) throw new ApiError(404, "Spielvorschlag nicht gefunden.");

    const game = proposal.game?.deletedAt ? null : proposal.game;
    if (proposal.game && !game && !proposal.bggId) {
      throw new ApiError(404, "Das Spiel ist nicht mehr verfügbar.");
    }
    if (!game && !proposal.bggName) {
      throw new ApiError(404, "Das Spiel ist nicht mehr verfügbar.");
    }

    const bggId = proposal.bggId ?? game?.bggId ?? null;
    const validBggId = bggId && /^\d{1,12}$/.test(bggId) ? bggId : null;
    const localDescription = mayReadCollectionDescription ? game?.description ?? null : null;

    let bggGame: Awaited<ReturnType<typeof fetchBGGGame>> = null;
    let detailsUnavailable = false;
    if (validBggId) {
      try {
        bggGame = await fetchBGGGame(validBggId, AbortSignal.timeout(10_000));
      } catch {
        bggGame = null;
      }
      detailsUnavailable = !bggGame;
    }

    const description = localDescription || bggGame?.description || null;
    const descriptionSource = localDescription
      ? "collection"
      : bggGame?.description
        ? "bgg"
        : null;

    return {
      proposalId: proposal.id,
      name: game?.name ?? proposal.bggName ?? bggGame?.name ?? "Unbekanntes Spiel",
      description,
      descriptionSource,
      imageUrl: safeImageUrl(game?.imageUrl ?? proposal.bggImageUrl ?? bggGame?.imageUrl),
      minPlayers: game?.minPlayers ?? proposal.bggMinPlayers ?? bggGame?.minPlayers ?? null,
      maxPlayers: game?.maxPlayers ?? proposal.bggMaxPlayers ?? bggGame?.maxPlayers ?? null,
      playTimeMinutes: game?.playTimeMinutes ?? proposal.bggPlayTimeMinutes ?? bggGame?.playTimeMinutes ?? null,
      complexity: game?.complexity ?? bggGame?.complexity ?? null,
      bggUrl: validBggId ? `https://boardgamegeek.com/boardgame/${validBggId}` : null,
      detailsUnavailable,
    };
  },
};
