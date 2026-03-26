import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { notFound, redirect } from "next/navigation";
import InviteClient from "./invite-client";

export default async function EventInvitePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const { id } = await params;

  const event = await prisma.event.findFirst({
    where: { id, deletedAt: null },
    select: {
      title: true,
      eventDate: true,
      createdById: true,
      invites: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!event) notFound();

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    orderBy: { name: "asc" },
  });

  const serializedEvent = JSON.parse(JSON.stringify({
    title: event.title,
    eventDate: event.eventDate,
    invites: event.invites,
  }));

  return <InviteClient initialEvent={serializedEvent} initialUsers={users} eventId={id} />;
}
