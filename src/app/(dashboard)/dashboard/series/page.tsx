import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import SeriesListClient from "./series-list-client";

export default async function SeriesPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const seriesList = await cachedQuery(
    async () => {
      const series = await prisma.gameSeries.findMany({
        where: { ownerId: userId, deletedAt: null },
        orderBy: { name: "asc" },
        include: {
          entries: {
            include: { game: { select: { imageUrl: true } } },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      return series.map((s) => ({
        ...s,
        createdAt: s.createdAt.toISOString(),
        _count: {
          entries: s.entries.length,
          played: s.entries.filter((e) => e.played).length,
        },
      }));
    },
    ["user-series-list", userId!],
    { revalidate: 120, tags: [CacheTags.userSeries(userId!)] }
  );

  return (
    <div className="space-y-6">
      <SeriesListClient seriesList={seriesList} />
    </div>
  );
}
