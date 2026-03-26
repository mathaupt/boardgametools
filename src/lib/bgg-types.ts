/** BGG API type definitions */

export interface BGGGameData {
  bggId: string;
  name: string;
  description: string;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  complexity: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  rating: number | null;
  numRatings: number | null;
}

export interface BGGCollectionItem {
  bggId: string;
  name: string;
  yearPublished: number | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  rating: number | null;
  numPlays: number;
}

export interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: number | null;
}
