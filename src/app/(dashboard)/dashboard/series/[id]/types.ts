export interface GameData {
  id: string;
  name: string;
  description?: string | null;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
}

export interface SeriesEntry {
  id: string;
  seriesId: string;
  gameId: string;
  sortOrder: number;
  played: boolean;
  playedAt: string | null;
  rating: number | null;
  difficulty: string | null;
  playTimeMinutes: number | null;
  successful: boolean | null;
  playerCount: number | null;
  score: number | null;
  game: GameData;
}

export interface GameSeries {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  entries: SeriesEntry[];
}

export type PlayedFilter = "alle" | "gespielt" | "offen";
export type DifficultyFilter = "alle" | "einsteiger" | "fortgeschritten" | "profi";
export type EntrySortOption = "sortOrder" | "name_asc" | "name_desc" | "rating_desc" | "difficulty";

export const DIFFICULTY_ORDER: Record<string, number> = { einsteiger: 1, fortgeschritten: 2, profi: 3 };
