import prisma from "@/lib/db";
import { NOT_DELETED } from "@/lib/services/shared";
import type { SyncPayload, SyncChanges } from "@/lib/sync-types";
import {
  toGameDto,
  toSessionDto,
  toEventDto,
  toDateProposalDto,
  toEventProposalDto,
  toVoteDto,
  toDateVoteDto,
  toGroupDto,
  toGroupMemberDto,
  toGroupPollDto,
  toGroupPollVoteDto,
  toGroupCommentDto,
} from "@/lib/dto-mappers";

function asCreated<T>(items: T[]): SyncChanges<T> { return { created: items, updated: [], deleted: [] }; }

function toChanges<T>(active: T[], deletedIds: string[]): SyncChanges<T> {
  return { created: active, updated: [], deleted: deletedIds };
}

function deletedIdsOnly(items: { id: string }[]): string[] { return items.map((i) => i.id); }

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

  const activeEventWhere = {
    ...NOT_DELETED,
    OR: [{ createdById: userId }, { groupId: { in: groupIds } }, { id: { in: invitedEventIds.map((i) => i.eventId) } }],
  };

  const deletedEventWhere = {
    deletedAt: { not: null },
    OR: [{ createdById: userId }, { groupId: { in: groupIds } }, { id: { in: invitedEventIds.map((i) => i.eventId) } }],
  };

  const eventIds = await prisma.event.findMany({ where: activeEventWhere, select: { id: true } });
  const eventIdList = eventIds.map((e) => e.id);

  const [
    games,
    deletedGames,
    sessions,
    deletedSessions,
    events,
    deletedEvents,
    dateProposalsRaw,
    eventProposalsRaw,
    votes,
    dateVotes,
    groups,
    deletedGroups,
    groupMembersAll,
    groupPollsRaw,
    groupComments,
  ] = await Promise.all([
    prisma.game.findMany({
      where: { ownerId: userId, ...NOT_DELETED },
      include: { tags: { include: { tag: { select: { name: true } } } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.game.findMany({
      where: { ownerId: userId, deletedAt: { not: null } },
      select: { id: true },
    }),
    prisma.gameSession.findMany({
      where: { createdById: userId, ...NOT_DELETED },
      include: { players: { select: { id: true, userId: true, score: true, isWinner: true, placement: true } } },
      orderBy: { playedAt: "desc" },
    }),
    prisma.gameSession.findMany({
      where: { createdById: userId, deletedAt: { not: null } },
      select: { id: true },
    }),
    prisma.event.findMany({ where: activeEventWhere, orderBy: { eventDate: "desc" } }),
    prisma.event.findMany({ where: deletedEventWhere, select: { id: true } }),
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
    prisma.group.findMany({ where: { id: { in: groupIds }, deletedAt: { not: null } }, select: { id: true } }),
    prisma.groupMember.findMany({ where: { groupId: { in: groupIds } }, orderBy: { joinedAt: "asc" } }),
    prisma.groupPoll.findMany({
      where: { groupId: { in: groupIds } },
      include: { options: { include: { votes: true }, orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.groupComment.findMany({ where: { groupId: { in: groupIds } }, orderBy: { createdAt: "desc" } }),
  ]);

  return {
    syncedAt: new Date().toISOString(),
    games: toChanges(games.map(toGameDto), deletedIdsOnly(deletedGames)),
    sessions: toChanges(sessions.map(toSessionDto), deletedIdsOnly(deletedSessions)),
    events: toChanges(events.map(toEventDto), deletedIdsOnly(deletedEvents)),
    groups: toChanges(groups.map(toGroupDto), deletedIdsOnly(deletedGroups)),
    dateProposals: asCreated(dateProposalsRaw.map(toDateProposalDto)),
    groupPolls: asCreated(groupPollsRaw.map(toGroupPollDto)),
    groupComments: asCreated(groupComments.map(toGroupCommentDto)),
    eventProposals: asCreated(eventProposalsRaw.map(toEventProposalDto)),
    votes: asCreated(votes.map(toVoteDto)),
    dateVotes: asCreated(dateVotes.map(toDateVoteDto)),
    groupPollVotes: asCreated(groupPollsRaw.flatMap((p) => p.options.flatMap((o) => o.votes.map(toGroupPollVoteDto)))),
    groupMembers: asCreated(groupMembersAll.map(toGroupMemberDto)),
  };
}
