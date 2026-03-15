import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/db";
import { ProfileClient } from "./profile-client";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;

  const [user, invites, events, groups, comments, sessionsWithNotes] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }),

    // Offene + kürzliche Einladungen
    prisma.eventInvite.findMany({
      where: { userId },
      include: {
        event: {
          select: { id: true, title: true, eventDate: true, location: true },
        },
      },
      orderBy: { event: { eventDate: "desc" } },
      take: 10,
    }),

    // Events die ich erstellt habe oder zu denen ich eingeladen bin
    prisma.event.findMany({
      where: {
        OR: [
          { createdById: userId },
          { invites: { some: { userId } } },
        ],
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        location: true,
        createdById: true,
        _count: { select: { proposals: true, invites: true } },
      },
      orderBy: { eventDate: "desc" },
      take: 10,
    }),

    // Gruppen-Mitgliedschaften
    prisma.groupMember.findMany({
      where: { userId },
      include: {
        group: {
          select: {
            id: true,
            name: true,
            _count: { select: { members: true, polls: true } },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    }),

    // Meine Kommentare in Gruppen/Polls
    prisma.groupComment.findMany({
      where: { userId },
      include: {
        group: { select: { id: true, name: true } },
        poll: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),

    // Meine Sessions mit Notizen
    prisma.gameSession.findMany({
      where: { createdById: userId, notes: { not: null } },
      include: {
        game: { select: { id: true, name: true } },
      },
      orderBy: { playedAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <ProfileClient
      user={{
        ...user,
        createdAt: user.createdAt.toISOString(),
      }}
      invites={invites.map((inv) => ({
        id: inv.id,
        status: inv.status,
        eventId: inv.event.id,
        eventTitle: inv.event.title,
        eventDate: inv.event.eventDate.toISOString(),
        eventLocation: inv.event.location,
      }))}
      events={events.map((evt) => ({
        id: evt.id,
        title: evt.title,
        eventDate: evt.eventDate.toISOString(),
        location: evt.location,
        isCreator: evt.createdById === userId,
        proposalCount: evt._count.proposals,
        inviteCount: evt._count.invites,
      }))}
      groups={groups.map((gm) => ({
        id: gm.group.id,
        name: gm.group.name,
        role: gm.role,
        memberCount: gm.group._count.members,
        pollCount: gm.group._count.polls,
        joinedAt: gm.joinedAt.toISOString(),
      }))}
      comments={comments.map((c) => ({
        id: c.id,
        content: c.content,
        createdAt: c.createdAt.toISOString(),
        groupId: c.group.id,
        groupName: c.group.name,
        pollId: c.pollId,
        pollTitle: c.poll?.title ?? null,
      }))}
      sessionNotes={sessionsWithNotes
        .filter((s) => s.notes)
        .map((s) => ({
          id: s.id,
          notes: s.notes!,
          playedAt: s.playedAt.toISOString(),
          gameId: s.game.id,
          gameName: s.game.name,
        }))}
    />
  );
}
