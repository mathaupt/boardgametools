import prisma from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { ApiError } from "@/lib/require-auth";
import { aggregateChallengeProgress, type ChallengeParticipantInterval, type ChallengeSessionRecord } from "@/lib/gamification/challenge-progress";

const TARGETS = { sessions: [10, 25], games: [5, 10] } as const;
type ChallengeKind = keyof typeof TARGETS;

type ChallengeDb = typeof prisma | Prisma.TransactionClient;

async function assertMember(groupId: string, userId: string, db: ChallengeDb = prisma) {
  const membership = await db.groupMember.findUnique({ where: { groupId_userId: { groupId, userId } }, select: { role: true } });
  if (!membership) throw new ApiError(404, "Gruppe nicht gefunden.");
  const group = await db.group.findFirst({ where: { id: groupId, deletedAt: null }, select: { id: true } });
  if (!group) throw new ApiError(404, "Gruppe nicht gefunden.");
  return membership;
}

export const GroupChallengeService = {
  async list(groupId: string, userId: string) {
    await assertMember(groupId, userId);
    const challenges = await prisma.groupChallenge.findMany({
      where: { groupId, status: "active" },
      select: { id: true, title: true, kind: true, target: true, startsAt: true, endsAt: true, participants: { select: { userId: true, joinedAt: true, leftAt: true } } },
      orderBy: { createdAt: "desc" },
    });
    const participantIds = [...new Set(challenges.flatMap((challenge) => challenge.participants.map(({ userId: id }) => id)))];
    const intervals = challenges.flatMap((challenge) => challenge.participants.map((participant) => ({ challenge, participant })));
    const clauses = intervals.map(({ challenge, participant }) => ({
      createdAt: {
        gte: challenge.startsAt > participant.joinedAt ? challenge.startsAt : participant.joinedAt,
        ...(challenge.endsAt || participant.leftAt ? { lte: !challenge.endsAt ? participant.leftAt! : !participant.leftAt ? challenge.endsAt : challenge.endsAt < participant.leftAt ? challenge.endsAt : participant.leftAt } : {}),
      },
      OR: [{ createdById: participant.userId }, { players: { some: { userId: participant.userId } } }],
    }));
    const sessions = participantIds.length ? await prisma.gameSession.findMany({
      where: { deletedAt: null, OR: clauses },
      select: { id: true, gameId: true, gameNameSnapshot: true, createdById: true, createdAt: true, players: { select: { userId: true } } },
    }) : [];
    return challenges.map((challenge) => {
      const members: ChallengeParticipantInterval[] = challenge.participants.map(({ userId: participantId, joinedAt, leftAt }) => ({ userId: participantId, joinedAt, leftAt }));
      const records: ChallengeSessionRecord[] = sessions.map(({ id, gameId, gameNameSnapshot, createdById, createdAt, players }) => ({ id, gameId, gameNameSnapshot, createdById, createdAt, playerIds: players.map(({ userId: id }) => id) }));
      const current = aggregateChallengeProgress(records, members, challenge.startsAt, challenge.endsAt, challenge.kind === "games" ? "games" : "sessions");
      return { id: challenge.id, title: challenge.title, kind: challenge.kind, target: challenge.target, startsAt: challenge.startsAt.toISOString(), endsAt: challenge.endsAt?.toISOString() ?? null, current: Math.min(current, challenge.target), completed: current >= challenge.target, joined: challenge.participants.some(({ userId: id, leftAt }) => id === userId && !leftAt) };
    });
  },

  async create(groupId: string, userId: string, input: { title: string; kind: ChallengeKind; target: number; endsAt?: Date | null }) {
    if (!input.title.trim() || input.title.length > 80 || !(TARGETS[input.kind] as readonly number[]).includes(input.target)) throw new ApiError(400, "Ungültiges Gruppenziel.");
    if (input.endsAt && input.endsAt <= new Date()) throw new ApiError(400, "Das Enddatum muss in der Zukunft liegen.");
    return prisma.$transaction(async (tx) => {
      const membership = await assertMember(groupId, userId, tx);
      if (!new Set(["owner", "admin"]).has(membership.role)) throw new ApiError(403, "Nur Gruppenadmins können ein Ziel erstellen.");
      return tx.groupChallenge.create({ data: { groupId, createdById: userId, title: input.title.trim(), kind: input.kind, target: input.target, endsAt: input.endsAt ?? null }, select: { id: true } });
    });
  },

  async join(groupId: string, challengeId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await assertMember(groupId, userId, tx);
      const challenge = await tx.groupChallenge.findFirst({ where: { id: challengeId, groupId, status: "active" }, select: { id: true } });
      if (!challenge) throw new ApiError(404, "Gruppenziel nicht gefunden.");
      const existing = await tx.groupChallengeParticipant.findUnique({ where: { challengeId_userId: { challengeId, userId } }, select: { leftAt: true } });
      if (existing) {
        if (existing.leftAt) throw new ApiError(409, "Du hast deine Teilnahme bereits beendet.");
        return { joined: true };
      }
      await tx.groupChallengeParticipant.create({ data: { challengeId, userId } });
      return { joined: true };
    });
  },

  async leave(groupId: string, challengeId: string, userId: string) {
    return prisma.$transaction(async (tx) => {
      await assertMember(groupId, userId, tx);
      const participant = await tx.groupChallengeParticipant.findFirst({ where: { challengeId, userId, challenge: { groupId, status: "active" }, leftAt: null }, select: { id: true } });
      if (!participant) throw new ApiError(404, "Aktive Teilnahme nicht gefunden.");
      await tx.groupChallengeParticipant.update({ where: { id: participant.id }, data: { leftAt: new Date() } });
      return { joined: false };
    });
  },
};
