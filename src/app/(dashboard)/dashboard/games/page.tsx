import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import GamesListClient, { type GameItem } from "./games-list-client";

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const games = await cachedQuery(
    () => prisma.game.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sessions: true } },
        tags: { include: { tag: true } },
      },
    }),
    ["user-games-list", userId!],
    { revalidate: 60, tags: [CacheTags.userGames(userId!)] }
  );

  // Serialize Date objects to ISO strings for the client component
  const serializedGames = JSON.parse(JSON.stringify(games)) as GameItem[];

  return (
    <div className="space-y-6">
      <GamesListClient games={serializedGames} />
    </div>
  );
}
