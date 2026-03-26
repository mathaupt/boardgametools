import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import SeriesDetailClient from "./SeriesDetailClient";
import type { GameSeries } from "./types";

export default async function SeriesDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const series = await prisma.gameSeries.findFirst({
    where: { id, ownerId: session.user.id, deletedAt: null },
    include: {
      entries: {
        include: { game: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!series) notFound();

  const serializedSeries: GameSeries = {
    id: series.id,
    name: series.name,
    description: series.description,
    imageUrl: series.imageUrl,
    entries: series.entries.map((entry) => ({
      id: entry.id,
      seriesId: entry.seriesId,
      gameId: entry.gameId,
      sortOrder: entry.sortOrder,
      played: entry.played,
      playedAt: entry.playedAt?.toISOString() ?? null,
      rating: entry.rating,
      difficulty: entry.difficulty,
      playTimeMinutes: entry.playTimeMinutes,
      successful: entry.successful,
      playerCount: entry.playerCount,
      score: entry.score,
      game: {
        id: entry.game.id,
        name: entry.game.name,
        description: entry.game.description,
        imageUrl: entry.game.imageUrl,
        minPlayers: entry.game.minPlayers,
        maxPlayers: entry.game.maxPlayers,
        playTimeMinutes: entry.game.playTimeMinutes,
        complexity: entry.game.complexity,
        bggId: entry.game.bggId,
      },
    })),
  };

  return <SeriesDetailClient initialSeries={serializedSeries} seriesId={id} />;
}
