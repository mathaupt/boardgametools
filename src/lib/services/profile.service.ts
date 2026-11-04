import prisma from "@/lib/db";
import { BADGES, evaluateBadgeProgress } from "@/lib/gamification/badges";
import { createProfileNonce, deriveProfileToken, hashProfileToken, isValidProfileToken } from "@/lib/gamification/profile-token";
import { env } from "@/lib/env";

const publicUrl = (token: string) => `${(env.NEXT_PUBLIC_APP_URL ?? env.NEXTAUTH_URL).replace(/\/$/, "")}/public/profile#${token}`;

export const ProfileService = {
  async getSharingSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, publicProfileEnabled: true, publicProfileTokenNonce: true, publicProfileTokenHash: true, publicProfileFeaturedBadgeIds: true },
    });
    if (!user) throw new Error("Profil nicht gefunden.");
    let shareUrl: string | null = null;
    if (user.publicProfileEnabled && user.publicProfileTokenNonce && user.publicProfileTokenHash) {
      const token = deriveProfileToken(user.id, user.publicProfileTokenNonce);
      if (hashProfileToken(token) === user.publicProfileTokenHash) shareUrl = publicUrl(token);
    }
    const stats = await this.getPublicStats(userId);
    const earnedBadges = evaluateBadgeProgress(stats).filter(({ earned }) => earned).map(({ id, title, description, altText, icon }) => ({ id, title, description, altText, icon }));
    return { enabled: user.publicProfileEnabled, featuredBadgeIds: user.publicProfileFeaturedBadgeIds, shareUrl, earnedBadges };
  },

  async updateSharingSettings(userId: string, input: { enabled: boolean; featuredBadgeIds: string[]; rotate?: boolean }) {
    const earned = await this.getEarnedBadgeIds(userId);
    const featuredBadgeIds = [...new Set(input.featuredBadgeIds)].filter((id) => earned.has(id)).slice(0, BADGES.length);
    if (!input.enabled) {
      await prisma.user.update({ where: { id: userId }, data: { publicProfileEnabled: false, publicProfileTokenHash: null, publicProfileTokenNonce: null, publicProfileFeaturedBadgeIds: [] } });
      return { enabled: false, featuredBadgeIds: [], shareUrl: null };
    }
    const current = await prisma.user.findUnique({ where: { id: userId }, select: { publicProfileTokenNonce: true, publicProfileTokenHash: true } });
    const createToken = input.rotate || !current?.publicProfileTokenHash || !current.publicProfileTokenNonce;
    const nonce = createToken ? createProfileNonce() : current!.publicProfileTokenNonce!;
    const token = deriveProfileToken(userId, nonce);
    await prisma.user.update({
      where: { id: userId },
      data: {
        publicProfileEnabled: true,
        publicProfileTokenHash: hashProfileToken(token),
        publicProfileTokenNonce: nonce,
        publicProfileFeaturedBadgeIds: featuredBadgeIds,
      },
    });
    return { enabled: true, featuredBadgeIds, shareUrl: publicUrl(token) };
  },

  async getEarnedBadgeIds(userId: string): Promise<Set<string>> {
    const stats = await this.getPublicStats(userId);
    return new Set(evaluateBadgeProgress(stats).filter(({ earned }) => earned).map(({ id }) => id));
  },

  async getPublicProfile(token: string) {
    if (!isValidProfileToken(token)) return null;
    const user = await prisma.user.findFirst({
      where: { publicProfileTokenHash: hashProfileToken(token), publicProfileEnabled: true },
      select: { id: true, name: true, publicProfileFeaturedBadgeIds: true },
    });
    if (!user) return null;
    const stats = await this.getPublicStats(user.id);
    const earned = evaluateBadgeProgress(stats).filter(({ earned }) => earned);
    const featured = new Set(user.publicProfileFeaturedBadgeIds);
    return {
      name: user.name,
      badges: earned.filter(({ id }) => featured.has(id)).map(({ id, title, description, altText, icon }) => ({ id, title, description, altText, icon })),
      totals: { sessions: stats.createdSessions, gamesPlayed: stats.distinctGamesPlayed, seriesCompleted: stats.completedSeries },
    };
  },

  async getPublicStats(userId: string) {
    const [createdSessions, playedGames, ownedGamesPlayed, completedSeries] = await Promise.all([
      prisma.gameSession.count({ where: { createdById: userId, deletedAt: null } }),
      prisma.gameSession.groupBy({ by: ["gameId"], where: { deletedAt: null, players: { some: { userId } } } }),
      prisma.gameSession.groupBy({ by: ["gameId"], where: { deletedAt: null, game: { ownerId: userId, deletedAt: null }, players: { some: { userId } } } }),
      prisma.gameSeries.count({ where: { ownerId: userId, deletedAt: null, entries: { some: {}, every: { played: true } } } }),
    ]);
    return { createdSessions, distinctGamesPlayed: playedGames.length, ownedGamesPlayed: ownedGamesPlayed.length, completedSeries };
  },
};
