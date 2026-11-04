export interface SeriesEntryIdentitySource {
  gameId: string | null;
  bggId: string | null;
}

export function getSeriesEntryIdentity(entry: SeriesEntryIdentitySource): string {
  if (entry.gameId) return `collection:${entry.gameId}`;
  if (entry.bggId) return `bgg:${entry.bggId}`;
  return "unknown";
}

export function hasSeriesEntryIdentity(
  entries: SeriesEntryIdentitySource[],
  candidate: SeriesEntryIdentitySource,
): boolean {
  const identity = getSeriesEntryIdentity(candidate);
  return entries.some((entry) =>
    getSeriesEntryIdentity(entry) === identity ||
    Boolean(candidate.bggId && entry.bggId && candidate.bggId === entry.bggId)
  );
}
