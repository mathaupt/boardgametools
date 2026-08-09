export interface SyncChanges<T> {
  created: T[];
  updated: T[];
  deleted: string[];
}

export interface SyncPayload {
  syncedAt: string;
  games: SyncChanges<GameDTO>;
  sessions: SyncChanges<SessionDTO>;
  events: SyncChanges<EventDTO>;
  dateProposals: SyncChanges<DateProposalDTO>;
  groups: SyncChanges<GroupDTO>;
  groupPolls: SyncChanges<GroupPollDTO>;
  groupComments: SyncChanges<GroupCommentDTO>;
  eventProposals: SyncChanges<EventProposalDTO>;
  votes: SyncChanges<VoteDTO>;
  dateVotes: SyncChanges<DateVoteDTO>;
  groupPollVotes: SyncChanges<GroupPollVoteDTO>;
  groupMembers: SyncChanges<GroupMemberDTO>;
}

export interface GameDTO {
  id: string;
  name: string;
  description?: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes?: number | null;
  complexity?: number | null;
  bggId?: string | null;
  ean?: string | null;
  imageUrl?: string | null;
  ownerId?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  tagNames?: string[];
}

export interface SessionPlayerDTO {
  id?: string | null;
  userId: string;
  score?: number | null;
  isWinner: boolean;
  placement?: number | null;
}

export interface SessionDTO {
  id: string;
  gameId: string;
  playedAt: string;
  durationMinutes?: number | null;
  notes?: string | null;
  players: SessionPlayerDTO[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface VoteDTO {
  id: string;
  proposalId: string;
  userId: string;
  createdAt: string;
}

export interface DateVoteDTO {
  id: string;
  dateProposalId: string;
  userId: string;
  availability: string;
  createdAt: string;
}

export interface EventProposalDTO {
  id: string;
  eventId: string;
  gameId?: string | null;
  proposedById?: string | null;
  bggId?: string | null;
  bggName?: string | null;
  bggImageUrl?: string | null;
  bggMinPlayers?: number | null;
  bggMaxPlayers?: number | null;
  bggPlayTimeMinutes?: number | null;
  voteCount?: number | null;
  createdAt: string;
}

export interface DateProposalDTO {
  id: string;
  eventId: string;
  date: string;
  votes?: DateVoteDTO[];
  createdAt: string;
}

export interface EventDTO {
  id: string;
  title: string;
  description?: string | null;
  eventDate: string;
  location?: string | null;
  status: string;
  groupId?: string | null;
  selectedGameId?: string | null;
  winningProposalId?: string | null;
  isPublic?: boolean | null;
  shareToken?: string | null;
  proposals?: EventProposalDTO[];
  dateProposals?: DateProposalDTO[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

export interface GroupMemberDTO {
  id: string;
  groupId: string;
  userId: string;
  role: string;
  joinedAt: string;
}

export interface GroupPollVoteDTO {
  id: string;
  optionId: string;
  voterName: string;
  userId?: string | null;
  createdAt: string;
}

export interface GroupPollOptionDTO {
  id: string;
  pollId: string;
  text: string;
  sortOrder: number;
  votes?: GroupPollVoteDTO[];
}

export interface GroupPollDTO {
  id: string;
  groupId: string;
  title: string;
  description?: string | null;
  type: string;
  status: string;
  createdById: string;
  closedAt?: string | null;
  options?: GroupPollOptionDTO[];
  createdAt: string;
}

export interface GroupCommentDTO {
  id: string;
  groupId: string;
  pollId?: string | null;
  authorName: string;
  userId?: string | null;
  content: string;
  createdAt: string;
}

export interface GroupDTO {
  id: string;
  name: string;
  description?: string | null;
  ownerId: string;
  isPublic: boolean;
  shareToken?: string | null;
  members?: GroupMemberDTO[];
  events?: EventDTO[];
  polls?: GroupPollDTO[];
  comments?: GroupCommentDTO[];
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
