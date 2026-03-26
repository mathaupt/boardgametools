import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import SessionFormClient from "./session-form-client";

export default async function NewSessionPage() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const [games, users] = await Promise.all([
    prisma.game.findMany({
      where: { ownerId: userId, deletedAt: null },
      select: {
        id: true,
        name: true,
        imageUrl: true,
        minPlayers: true,
        maxPlayers: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true, email: true },
    }),
  ]);

  return <SessionFormClient games={games} users={users} />;
}
