/**
 * Centralized cache tag definitions for cachedQuery / revalidateTag.
 * Every tag MUST include the userId or entityId to prevent cross-user leaks.
 */
export const CacheTags = {
  userStats: (userId: string) => `user-stats-${userId}`,
  userGames: (userId: string) => `user-games-${userId}`,
  userSessions: (userId: string) => `user-sessions-${userId}`,
  userEvents: (userId: string) => `user-events-${userId}`,
  userGroups: (userId: string) => `user-groups-${userId}`,
  userTags: (userId: string) => `user-tags-${userId}`,
  userSeries: (userId: string) => `user-series-${userId}`,
  userDashboard: (userId: string) => `dashboard-${userId}`,
  pendingInvites: (userId: string) => `pending-invites-${userId}`,
  groupStats: (groupId: string) => `group-stats-${groupId}`,
} as const;
