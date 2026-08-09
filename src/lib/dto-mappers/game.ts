import type { GameDTO } from "@/lib/sync-types";
import { iso } from "./utils";

export function toGameDto(game: {
  id: string;
  name: string;
  description: string | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  complexity: number | null;
  bggId: string | null;
  ean: string | null;
  imageUrl: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  tags?: { tag: { name: string } }[];
}): GameDTO {
  return {
    id: game.id,
    name: game.name,
    description: game.description,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    playTimeMinutes: game.playTimeMinutes,
    complexity: game.complexity,
    bggId: game.bggId,
    ean: game.ean,
    imageUrl: game.imageUrl,
    ownerId: game.ownerId,
    createdAt: iso(game.createdAt) as string,
    updatedAt: iso(game.updatedAt) as string,
    deletedAt: iso(game.deletedAt),
    tagNames: game.tags?.map((t) => t.tag.name),
  };
}
