const LONG_UNPLAYED_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface DiscoveryGame {
  id: string;
  name: string;
  imageUrl: string | null;
  lastPlayedAt: Date | null;
}

export interface CollectionDiscovery {
  neverPlayed: DiscoveryGame[];
  longUnplayed: DiscoveryGame[];
}

function byName(left: DiscoveryGame, right: DiscoveryGame): number {
  return left.name.localeCompare(right.name, "de") || left.id.localeCompare(right.id);
}

export function buildCollectionDiscovery(
  games: readonly DiscoveryGame[],
  dismissedGameIds: readonly string[],
  now: Date = new Date(),
): CollectionDiscovery {
  const dismissed = new Set(dismissedGameIds);
  const cutoff = now.getTime() - LONG_UNPLAYED_DAYS * DAY_MS;
  const visibleGames = games.filter((game) => !dismissed.has(game.id));

  return {
    neverPlayed: visibleGames.filter((game) => game.lastPlayedAt === null).sort(byName),
    longUnplayed: visibleGames
      .filter((game) => game.lastPlayedAt !== null && game.lastPlayedAt.getTime() <= cutoff)
      .sort(byName),
  };
}
