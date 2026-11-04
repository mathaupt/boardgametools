import { afterAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import prisma from "@/lib/db";
import { aggregateChallengeProgress } from "@/lib/gamification/challenge-progress";

describe("gamification schema migration", () => {
  const marker = `gamification-test-${Date.now()}`;
  let userId: string;

  afterAll(async () => {
    if (userId) await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it("keeps the FEAT-025 series-entry table untouched", () => {
    const sql = readFileSync(join(process.cwd(), "prisma/migrations/20261104130000_gamification_profiles_and_challenges/migration.sql"), "utf8");
    expect(sql).not.toMatch(/GameSeriesEntry|DROP\s+TABLE/i);
  });

  it("defaults public profile sharing to private and retains collection-backed series entries", async () => {
    const user = await prisma.user.create({ data: { email: `${marker}@example.invalid`, name: "Testnutzer", passwordHash: "test-only" }, select: { id: true, publicProfileEnabled: true } });
    userId = user.id;
    expect(user.publicProfileEnabled).toBe(false);

    const game = await prisma.game.create({ data: { ownerId: user.id, name: "Testspiel", minPlayers: 1, maxPlayers: 4 } });
    const series = await prisma.gameSeries.create({ data: { ownerId: user.id, name: "Testreihe" } });
    const entry = await prisma.gameSeriesEntry.create({ data: { seriesId: series.id, gameId: game.id, gameName: game.name, gameImageUrl: "https://example.invalid/cover.jpg", sortOrder: 3, played: true } });
    const persisted = await prisma.gameSeriesEntry.findUniqueOrThrow({ where: { id: entry.id }, select: { gameId: true, gameName: true, gameImageUrl: true, sortOrder: true, played: true } });
    expect(persisted).toEqual({ gameId: game.id, gameName: "Testspiel", gameImageUrl: "https://example.invalid/cover.jpg", sortOrder: 3, played: true });

    const group = await prisma.group.create({ data: { name: "Testgruppe", ownerId: user.id, members: { create: { userId: user.id, role: "owner" } } }, select: { id: true } });
    const challenge = await prisma.groupChallenge.create({ data: { groupId: group.id, createdById: user.id, title: "Gemeinsame Runden", kind: "sessions", target: 10 } });
    const participant = await prisma.groupChallengeParticipant.create({ data: { challengeId: challenge.id, userId: user.id }, select: { joinedAt: true, leftAt: true } });
    expect(participant.joinedAt).toBeInstanceOf(Date);
    expect(participant.leftAt).toBeNull();
    await prisma.gameSession.create({ data: { createdById: user.id, gameId: game.id, createdAt: new Date(Date.now() + 1) } });
    const sessions = await prisma.gameSession.findMany({ where: { deletedAt: null, createdAt: { gte: challenge.startsAt }, OR: [{ createdById: user.id }, { players: { some: { userId: user.id } } }] }, select: { id: true, gameId: true, createdById: true, createdAt: true, players: { select: { userId: true } } } });
    const current = aggregateChallengeProgress(sessions.map(({ id, gameId, createdById, createdAt, players }) => ({ id, gameId, createdById, createdAt, playerIds: players.map(({ userId: playerId }) => playerId) })), [{ userId: user.id, joinedAt: participant.joinedAt, leftAt: participant.leftAt }], challenge.startsAt, null, "sessions");
    expect(current).toBe(1);
  });
});
