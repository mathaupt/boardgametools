import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { notFound } from "next/navigation";
import SessionDetailClient from "./session-detail-client";

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const { id } = await params;

  const gameSession = await prisma.gameSession.findFirst({
    where: { id, deletedAt: null },
    include: {
      game: { select: { id: true, name: true, imageUrl: true } },
      createdBy: { select: { id: true, name: true, email: true } },
      players: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      ratings: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!gameSession || gameSession.createdById !== userId) {
    notFound();
  }

  const serialized = {
    ...gameSession,
    playedAt: gameSession.playedAt.toISOString(),
    createdAt: gameSession.createdAt.toISOString(),
    ratings: gameSession.ratings.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  return <SessionDetailClient session={serialized} />;
}
