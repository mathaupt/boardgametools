import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import GamesListClient from "./games-list-client";

export default async function GamesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const games = await cachedQuery(
    () => prisma.game.findMany({
      where: { ownerId: userId, deletedAt: null },
      orderBy: { name: "asc" },
      include: {
        _count: { select: { sessions: true } },
      },
    }),
    ["user-games-list", userId!],
    { revalidate: 60, tags: [CacheTags.userGames(userId!)] }
  );

  return (
    <div className="space-y-6">
      <GamesListClient games={games} />
    </div>
  );
}
