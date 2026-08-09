import prisma from "@/lib/db";
import { NOT_DELETED } from "@/lib/services/shared";
import type {
  GameDTO,
  SessionDTO,
  EventDTO,
  DateProposalDTO,
  EventProposalDTO,
  VoteDTO,
  DateVoteDTO,
  GroupDTO,
  GroupMemberDTO,
  GroupPollDTO,
  GroupPollVoteDTO,
  GroupCommentDTO,
  SyncPayload,
  SyncChanges,
} from "@/lib/sync-types";

function iso(date: Date): string { return date.toISOString(); }

function asCreated<T>(items: T[]): SyncChanges<T> { return { created: items, updated: [], deleted: [] }; }

export async function buildSyncPayload(userId: string): Promise<SyncPayload> {
  const groupMembers = await prisma.groupMember.findMany({
    where: { userId },
    select: { groupId: true },
  });
  const memberGroupIds = groupMembers.map((m) => m.groupId);

  const ownedGroups = await prisma.group.findMany({
    where: { ownerId: userId, ...NOT_DELETED },
    select: { id: true },
  });
  const groupIds = Array.from(new Set([...memberGroupIds, ...ownedGroups.map((g) => g.id)]));

  const invitedEventIds = await prisma.eventInvite.findMany({
    where: { userId },
    select: { eventId: true },
  });

  const eventWhere = {
    ...NOT_DELETED,
    OR: [{ createdById: userId }, { groupId: { in: groupIds } }, { id: { in: invitedEventIds.map((i) => i.eventId) } }],
  };

  const eventIds = await prisma.event.findMany({ where: eventWhere, select: { id: true } });
  const eventIdList = eventIds.map((e) => e.id);

  const [games, sessions, events, dateProposalsRaw, eventProposalsRaw, votes, dateVotes, groups, groupMembersAll, groupPollsRaw, groupComments] = await Promise.all([
    prisma.game.findMany({
      where: { ownerId: userId, ...NOT_DELETED },
      include: { tags: { include: { tag: { select: { name: true } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.gameSession.findMany({
      where: { createdById: userId, ...NOT_DELETED },
      include: { players: { select: { id: true, userId: true, score: true, isWinner: true, placement: true } } },
      orderBy: { playedAt: "desc" },
    }),
    prisma.event.findMany({ where: eventWhere, orderBy: { eventDate: "desc" } }),
    prisma.dateProposal.findMany({
      where: { eventId: { in: eventIdList } },
      include: { votes: { select: { id: true, dateProposalId: true, userId: true, availability: true, createdAt: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.gameProposal.findMany({
      where: { eventId: { in: eventIdList } },
      include: { votes: true, guestVotes: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.vote.findMany({ where: { proposal: { eventId: { in: eventIdList } } }, orderBy: { createdAt: "asc" } }),
    prisma.dateVote.findMany({ where: { dateProposal: { eventId: { in: eventIdList } } }, orderBy: { createdAt: "asc" } }),
    prisma.group.findMany({ where: { id: { in: groupIds }, ...NOT_DELETED }, orderBy: { updatedAt: "desc" } }),
    prisma.groupMember.findMany({ where: { groupId: { in: groupIds } }, orderBy: { joinedAt: "asc" } }),
    prisma.groupPoll.findMany({
      where: { groupId: { in: groupIds } },
      include: { options: { include: { votes: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupComment.findMany({ where: { groupId: { in: groupIds } }, orderBy: { createdAt: "desc" } }),
  ]);

  const gameDtos: GameDTO[] = games.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    minPlayers: g.minPlayers,
    maxPlayers: g.maxPlayers,
    playTimeMinutes: g.playTimeMinutes,
    complexity: g.complexity,
    bggId: g.bggId,
    ean: g.ean,
    imageUrl: g.imageUrl,
    ownerId: g.ownerId,
    createdAt: iso(g.createdAt),
    updatedAt: iso(g.updatedAt),
    deletedAt: g.deletedAt ? iso(g.deletedAt) : null,
    tagNames: g.tags.map((t) => t.tag.name),
  }));

  const sessionDtos: SessionDTO[] = sessions.map((s) => ({
    id: s.id,
    gameId: s.gameId,
    playedAt: iso(s.playedAt),
    durationMinutes: s.durationMinutes,
    notes: s.notes,
    players: s.players.map((p) => ({
      id: p.id,
      userId: p.userId,
      score: p.score,
      isWinner: p.isWinner,
      placement: p.placement,
    })),
    createdAt: iso(s.createdAt),
    updatedAt: iso(s.createdAt),
    deletedAt: s.deletedAt ? iso(s.deletedAt) : null,
  }));

  const eventDtos: EventDTO[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    eventDate: iso(e.eventDate),
    location: e.location,
    status: e.status,
    groupId: e.groupId,
    selectedGameId: e.selectedGameId,
    winningProposalId: e.winningProposalId,
    isPublic: e.isPublic,
    shareToken: e.shareToken,
    createdAt: iso(e.createdAt),
    updatedAt: iso(e.updatedAt),
    deletedAt: e.deletedAt ? iso(e.deletedAt) : null,
  }));

  const dateProposalDtos: DateProposalDTO[] = dateProposalsRaw.map((dp) => ({
    id: dp.id,
    eventId: dp.eventId,
    date: iso(dp.date),
    votes: dp.votes.map((v) => ({
      id: v.id,
      dateProposalId: v.dateProposalId,
      userId: v.userId,
      availability: v.availability,
      createdAt: iso(v.createdAt),
    })),
    createdAt: iso(dp.createdAt),
  }));

  const eventProposalDtos: EventProposalDTO[] = eventProposalsRaw.map((ep) => ({
    id: ep.id,
    eventId: ep.eventId,
    gameId: ep.gameId,
    proposedById: ep.proposedById,
    bggId: ep.bggId,
    bggName: ep.bggName,
    bggImageUrl: ep.bggImageUrl,
    bggMinPlayers: ep.bggMinPlayers,
    bggMaxPlayers: ep.bggMaxPlayers,
    bggPlayTimeMinutes: ep.bggPlayTimeMinutes,
    voteCount: ep.votes.length + ep.guestVotes.length,
    createdAt: iso(ep.createdAt),
  }));

  const voteDtos: VoteDTO[] = votes.map((v) => ({
    id: v.id,
    proposalId: v.proposalId,
    userId: v.userId,
    createdAt: iso(v.createdAt),
  }));

  const dateVoteDtos: DateVoteDTO[] = dateVotes.map((v) => ({
    id: v.id,
    dateProposalId: v.dateProposalId,
    userId: v.userId,
    availability: v.availability,
    createdAt: iso(v.createdAt),
  }));

  const groupDtos: GroupDTO[] = groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    ownerId: g.ownerId,
    isPublic: g.isPublic,
    shareToken: g.shareToken,
    createdAt: iso(g.createdAt),
    updatedAt: iso(g.updatedAt),
    deletedAt: g.deletedAt ? iso(g.deletedAt) : null,
  }));

  const groupMemberDtos: GroupMemberDTO[] = groupMembersAll.map((m) => ({
    id: m.id,
    groupId: m.groupId,
    userId: m.userId,
    role: m.role,
    joinedAt: iso(m.joinedAt),
  }));

  const groupPollDtos: GroupPollDTO[] = groupPollsRaw.map((p) => ({
    id: p.id,
    groupId: p.groupId,
    title: p.title,
    description: p.description,
    type: p.type,
    status: p.status,
    createdById: p.createdById,
    closedAt: p.closedAt ? iso(p.closedAt) : null,
    options: p.options.map((o) => ({
      id: o.id,
      pollId: o.pollId,
      text: o.text,
      sortOrder: o.sortOrder,
      votes: o.votes.map((v) => ({
        id: v.id,
        optionId: v.optionId,
        voterName: v.voterName,
        userId: v.userId,
        createdAt: iso(v.createdAt),
      })),
    })),
    createdAt: iso(p.createdAt),
  }));

  const groupPollVoteDtos: GroupPollVoteDTO[] = groupPollsRaw.flatMap((p) =>
    p.options.flatMap((o) =>
      o.votes.map((v) => ({
        id: v.id,
        optionId: v.optionId,
        voterName: v.voterName,
        userId: v.userId,
        createdAt: iso(v.createdAt),
      }))
    )
  );

  const groupCommentDtos: GroupCommentDTO[] = groupComments.map((c) => ({
    id: c.id,
    groupId: c.groupId,
    pollId: c.pollId,
    authorName: c.authorName,
    userId: c.userId,
    content: c.content,
    createdAt: iso(c.createdAt),
  }));

  return {
    syncedAt: new Date().toISOString(),
    games: asCreated(gameDtos),
    sessions: asCreated(sessionDtos),
    events: asCreated(eventDtos),
    dateProposals: asCreated(dateProposalDtos),
    groups: asCreated(groupDtos),
    groupPolls: asCreated(groupPollDtos),
    groupComments: asCreated(groupCommentDtos),
    eventProposals: asCreated(eventProposalDtos),
    votes: asCreated(voteDtos),
    dateVotes: asCreated(dateVoteDtos),
    groupPollVotes: asCreated(groupPollVoteDtos),
    groupMembers: asCreated(groupMemberDtos),
  };
}
