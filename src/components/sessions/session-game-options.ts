import { gameTextForRead } from "@/lib/game-text";

export interface SessionGameOption {
  id: string;
  name: string;
  imageUrl: string | null;
  minPlayers: number;
  maxPlayers: number;
}

export function filterSessionGames(games: SessionGameOption[], query: string): SessionGameOption[] {
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return games;

  return games.filter((game) => normalizeSearchText(gameTextForRead(game.name)).includes(normalizedQuery));
}

function normalizeSearchText(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ß", "ss");
}
