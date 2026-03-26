import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import EditGameForm from "./EditGameForm";

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  const game = await prisma.game.findFirst({
    where: { id, ownerId: session.user.id, deletedAt: null },
  });

  if (!game) notFound();

  return (
    <div>
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
          <Link href="/dashboard" className="hover:text-primary">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/games" className="hover:text-primary">Spiele</Link>
          <span>/</span>
          <Link href={`/dashboard/games/${id}`} className="hover:text-primary">{game.name}</Link>
          <span>/</span>
          <span className="text-foreground">Bearbeiten</span>
        </div>
      </div>
      <EditGameForm game={game} />
    </div>
  );
}
