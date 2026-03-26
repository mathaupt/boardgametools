import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import SessionEditClient from "./session-edit-client";

export default async function EditSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const [gameSession, games, users] = await Promise.all([
    prisma.gameSession.findFirst({
      where: { id, createdById: session.user.id, deletedAt: null },
      include: {
        players: {
          select: { userId: true, score: true, isWinner: true, placement: true },
        },
      },
    }),
    prisma.game.findMany({
      where: { ownerId: session.user.id, deletedAt: null },
      select: { id: true, name: true, minPlayers: true, maxPlayers: true },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!gameSession) notFound();

  const serializedSession = {
    id: gameSession.id,
    gameId: gameSession.gameId,
    playedAt: gameSession.playedAt.toISOString(),
    durationMinutes: gameSession.durationMinutes,
    notes: gameSession.notes,
    players: gameSession.players,
  };

  return <SessionEditClient session={serializedSession} games={games} users={users} />;
}
