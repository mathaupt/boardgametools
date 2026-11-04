import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { GameService } from "@/lib/services";
import { gameListQueryToSearchParams, parseGameListQuery, type GameListQuery } from "@/lib/game-list-query";
import GamesListClient, { type GameItem } from "./games-list-client";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function toURLSearchParams(values: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  return params;
}

export default async function GamesPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const query: GameListQuery = parseGameListQuery(toURLSearchParams(await searchParams));
  const [result, tags, collectionTotal] = await Promise.all([
    GameService.list(userId, query),
    prisma.tag.findMany({ where: { ownerId: userId }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.game.count({ where: { ownerId: userId, deletedAt: null } }),
  ]);
  if (Array.isArray(result)) throw new Error("Die paginierte Sammlung konnte nicht geladen werden.");

  if (result.page !== query.page) {
    const params = gameListQueryToSearchParams(query, result.page).toString();
    redirect(params ? `/dashboard/games?${params}` : "/dashboard/games");
  }

  const games = JSON.parse(JSON.stringify(result.data)) as GameItem[];
  return (
    <div className="space-y-6">
      <GamesListClient
        games={games}
        tags={tags}
        query={query}
        collectionTotal={collectionTotal}
        pageInfo={{ page: result.page, total: result.total, limit: result.limit, totalPages: result.totalPages }}
      />
    </div>
  );
}
