import { Prisma } from "@prisma/client";

interface PublicEventRaw {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  status: string;
  shareToken: string | null;
  isPublic: boolean;
  selectedDate: Date | null;
  createdBy: { id: string; name: string | null };
  invites: Array<{
    id: string;
    status: string;
    email: string | null;
    user: { name: string | null } | null;
  }>;
  selectedGame: {
    id: string;
    name: string;
    imageUrl: string | null;
    minPlayers: number | null;
    maxPlayers: number | null;
    playTimeMinutes: number | null;
  } | null;
  proposals: Array<{
    id: string;
    bggId: string | null;
    bggName: string | null;
    bggImageUrl: string | null;
    bggMinPlayers: number | null;
    bggMaxPlayers: number | null;
    bggPlayTimeMinutes: number | null;
    game: {
      id: string;
      name: string;
      imageUrl: string | null;
      minPlayers: number | null;
      maxPlayers: number | null;
      playTimeMinutes: number | null;
    } | null;
    proposedBy: { id: string; name: string | null } | null;
    guest: { id: string; nickname: string } | null;
    votes?: Array<{ id: string }>;
    _count: { votes: number; guestVotes: number };
  }>;
  guestParticipants: Array<{
    id: string;
    nickname: string;
    createdAt: Date;
    _count?: { votes: number };
  }>;
  dateProposals: Array<{
    id: string;
    date: Date;
    votes: Array<{
      id: string;
      availability: string;
      user: { id: string; name: string; email: string };
    }>;
    guestVotes: Array<{
      id: string;
      availability: string;
      guest: { id: string; nickname: string };
    }>;
  }>;
}

export const buildPublicEventInclude = (userId?: string | null): Prisma.EventInclude => ({
  createdBy: {
    select: { id: true, name: true },
  },
  invites: {
    select: {
      id: true,
      status: true,
      email: true,
      user: { select: { name: true } },
    },
    orderBy: { invitedAt: "asc" },
  },
  selectedGame: {
    select: {
      id: true,
      name: true,
      imageUrl: true,
      minPlayers: true,
      maxPlayers: true,
      playTimeMinutes: true,
    },
  },
  proposals: {
    include: {
      game: {
        select: {
          id: true,
          name: true,
          imageUrl: true,
          minPlayers: true,
          maxPlayers: true,
          playTimeMinutes: true,
        },
      },
      proposedBy: {
        select: { id: true, name: true },
      },
      guest: {
        select: { id: true, nickname: true },
      },
      votes: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : undefined,
      _count: {
        select: { votes: true, guestVotes: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  guestParticipants: {
    include: {
      _count: { select: { votes: true } },
    },
    orderBy: { createdAt: "asc" },
  },
  dateProposals: {
    include: {
      votes: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      guestVotes: {
        include: { guest: { select: { id: true, nickname: true } } },
      },
    },
    orderBy: { date: "asc" },
  },
});

export interface SerializedPublicEvent {
  id: string;
  title: string;
  description: string | null;
  eventDate: string;
  location: string | null;
  status: string;
  shareToken: string | null;
  isPublic: boolean;
  createdBy: { id: string; name: string | null };
  invites: Array<{
    name: string;
    status: string;
  }>;
  selectedGame: {
    id: string;
    name: string;
    imageUrl: string | null;
    minPlayers: number | null;
    maxPlayers: number | null;
    playTimeMinutes: number | null;
  } | null;
  proposals: Array<{
    id: string;
    game: {
      id: string;
      name: string;
      imageUrl: string | null;
      minPlayers: number | null;
      maxPlayers: number | null;
      playTimeMinutes: number | null;
    };
    proposedBy: { id: string; name: string | null } | null;
    totalVotes: number;
    voteCounts: { registered: number; guests: number };
    userHasVoted: boolean;
  }>;
  guestParticipants: Array<{
    id: string;
    nickname: string;
    votesCount: number;
    createdAt: string;
  }>;
  dateProposals: Array<{
    id: string;
    date: string;
    votes: Array<{
      id: string;
      availability: string;
      user: { id: string; name: string; email: string };
    }>;
    guestVotes: Array<{
      id: string;
      availability: string;
      guest: { id: string; nickname: string };
    }>;
  }>;
  selectedDate: string | null;
  currentUserId: string | null;
}

export function serializePublicEvent(
  event: PublicEventRaw,
  currentUserId: string | null
): SerializedPublicEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: event.eventDate.toISOString(),
    location: event.location,
    status: event.status,
    shareToken: event.shareToken,
    isPublic: event.isPublic,
    createdBy: event.createdBy,
    invites: (event.invites ?? []).map((invite: PublicEventRaw["invites"][number]) => ({
      name: invite.user?.name || (invite.email ? invite.email.replace(/(.{2}).*(@.*)/, "$1***$2") : "Gast"),
      status: invite.status,
    })),
    selectedGame: event.selectedGame,
    proposals: event.proposals.map((proposal: PublicEventRaw["proposals"][number]) => {
      const registeredVotes = proposal._count.votes;
      const guestVotes = proposal._count.guestVotes;
      const userHasVoted = currentUserId ? (proposal.votes?.length ?? 0) > 0 : false;

      // Merge game data: prefer DB game, fallback to inline BGG fields
      const gameData = proposal.game ?? {
        id: `bgg-${proposal.bggId}`,
        name: proposal.bggName ?? "Unbekanntes Spiel",
        imageUrl: proposal.bggImageUrl ?? null,
        minPlayers: proposal.bggMinPlayers ?? null,
        maxPlayers: proposal.bggMaxPlayers ?? null,
        playTimeMinutes: proposal.bggPlayTimeMinutes ?? null,
      };

      // Merge proposedBy: prefer DB user, fallback to guest
      const proposedByData = proposal.proposedBy ?? (proposal.guest
        ? { id: proposal.guest.id, name: proposal.guest.nickname }
        : null);

      return {
        id: proposal.id,
        game: gameData,
        proposedBy: proposedByData,
        totalVotes: registeredVotes + guestVotes,
        voteCounts: {
          registered: registeredVotes,
          guests: guestVotes,
        },
        userHasVoted,
      };
    }),
    guestParticipants: event.guestParticipants.map((guest: PublicEventRaw["guestParticipants"][number]) => ({
      id: guest.id,
      nickname: guest.nickname,
      votesCount: guest._count?.votes ?? 0,
      createdAt: guest.createdAt.toISOString(),
    })),
    dateProposals: (event.dateProposals ?? []).map((dp: PublicEventRaw["dateProposals"][number]) => ({
      id: dp.id,
      date: dp.date.toISOString(),
      votes: dp.votes.map((v: PublicEventRaw["dateProposals"][number]["votes"][number]) => ({
        id: v.id,
        availability: v.availability,
        user: v.user,
      })),
      guestVotes: dp.guestVotes.map((v: PublicEventRaw["dateProposals"][number]["guestVotes"][number]) => ({
        id: v.id,
        availability: v.availability,
        guest: v.guest,
      })),
    })),
    selectedDate: event.selectedDate?.toISOString() ?? null,
    currentUserId,
  };
}
