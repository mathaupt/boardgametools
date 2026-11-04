interface GameRelation {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
}

interface SeriesEntrySnapshot {
  id: string;
  gameId: string | null;
  gameName: string;
  gameDescription: string | null;
  gameImageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  gamePlayTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
  game: Partial<GameRelation> | null;
}

export function toSeriesEntryView<T extends SeriesEntrySnapshot>(entry: T): Omit<T, "game"> & { game: GameRelation } {
  return {
    ...entry,
    game: {
      id: entry.gameId ?? `temporary-${entry.id}`,
      name: entry.gameName || entry.game?.name || "Unbekanntes Spiel",
      description: entry.gameDescription ?? entry.game?.description ?? null,
      imageUrl: entry.gameImageUrl ?? entry.game?.imageUrl ?? null,
      minPlayers: entry.minPlayers ?? entry.game?.minPlayers ?? 1,
      maxPlayers: entry.maxPlayers ?? entry.game?.maxPlayers ?? 4,
      playTimeMinutes: entry.gamePlayTimeMinutes ?? entry.game?.playTimeMinutes ?? null,
      complexity: entry.complexity ?? entry.game?.complexity ?? null,
      bggId: entry.bggId ?? entry.game?.bggId ?? null,
    },
  };
}
