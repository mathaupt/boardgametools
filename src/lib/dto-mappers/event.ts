import type {
  EventDTO,
  EventProposalDTO,
  DateProposalDTO,
  VoteDTO,
  DateVoteDTO,
} from "@/lib/sync-types";
import { iso } from "./utils";

export function toVoteDto(vote: { id: string; proposalId: string; userId: string; createdAt: Date }): VoteDTO {
  return {
    id: vote.id,
    proposalId: vote.proposalId,
    userId: vote.userId,
    createdAt: iso(vote.createdAt) as string,
  };
}

export function toDateVoteDto(vote: {
  id: string;
  dateProposalId: string;
  userId: string;
  availability: string;
  createdAt: Date;
}): DateVoteDTO {
  return {
    id: vote.id,
    dateProposalId: vote.dateProposalId,
    userId: vote.userId,
    availability: vote.availability,
    createdAt: iso(vote.createdAt) as string,
  };
}

export function toEventProposalDto(proposal: {
  id: string;
  eventId: string;
  gameId: string | null;
  proposedById: string | null;
  bggId: string | null;
  bggName: string | null;
  bggImageUrl: string | null;
  bggMinPlayers: number | null;
  bggMaxPlayers: number | null;
  bggPlayTimeMinutes: number | null;
  votes?: unknown[];
  guestVotes?: unknown[];
  createdAt: Date;
}): EventProposalDTO {
  return {
    id: proposal.id,
    eventId: proposal.eventId,
    gameId: proposal.gameId,
    proposedById: proposal.proposedById,
    bggId: proposal.bggId,
    bggName: proposal.bggName,
    bggImageUrl: proposal.bggImageUrl,
    bggMinPlayers: proposal.bggMinPlayers,
    bggMaxPlayers: proposal.bggMaxPlayers,
    bggPlayTimeMinutes: proposal.bggPlayTimeMinutes,
    voteCount: (proposal.votes?.length ?? 0) + (proposal.guestVotes?.length ?? 0),
    createdAt: iso(proposal.createdAt) as string,
  };
}

export function toDateProposalDto(proposal: {
  id: string;
  eventId: string;
  date: Date;
  votes?: { id: string; dateProposalId: string; userId: string; availability: string; createdAt: Date }[];
  createdAt: Date;
}): DateProposalDTO {
  return {
    id: proposal.id,
    eventId: proposal.eventId,
    date: iso(proposal.date) as string,
    votes: proposal.votes?.map(toDateVoteDto),
    createdAt: iso(proposal.createdAt) as string,
  };
}

export function toEventDto(event: {
  id: string;
  title: string;
  description: string | null;
  eventDate: Date;
  location: string | null;
  status: string;
  groupId: string | null;
  selectedGameId: string | null;
  winningProposalId: string | null;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): EventDTO {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    eventDate: iso(event.eventDate) as string,
    location: event.location,
    status: event.status,
    groupId: event.groupId,
    selectedGameId: event.selectedGameId,
    winningProposalId: event.winningProposalId,
    isPublic: event.isPublic,
    shareToken: event.shareToken,
    createdAt: iso(event.createdAt) as string,
    updatedAt: iso(event.updatedAt) as string,
    deletedAt: iso(event.deletedAt),
  };
}
