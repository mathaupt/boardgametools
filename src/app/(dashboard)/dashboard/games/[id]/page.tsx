import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import GameDetailClient from "./game-detail-client";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, ownerId: session.user.id, deletedAt: null },
    include: { tags: { include: { tag: true } } },
  });

  if (!game) notFound();

  const serializedGame = {
    id: game.id,
    name: game.name,
    description: game.description,
    minPlayers: game.minPlayers,
    maxPlayers: game.maxPlayers,
    playTimeMinutes: game.playTimeMinutes,
    complexity: game.complexity,
    bggId: game.bggId,
    imageUrl: game.imageUrl,
    tags: game.tags.map((gt) => ({ tag: { id: gt.tag.id, name: gt.tag.name } })),
  };

  return <GameDetailClient game={serializedGame} />;
}
