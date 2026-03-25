import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3 } from "lucide-react";
import Link from "next/link";
import { getPublicBaseUrl } from "@/lib/public-link";
import { GroupDetailClient } from "./group-detail-client";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const userId = session?.user?.id;
  const { id } = await params;

  const group = await prisma.group.findFirst({
    where: {
      id,
      deletedAt: null,
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { joinedAt: "asc" },
      },
      polls: {
        include: {
          createdBy: { select: { id: true, name: true } },
          options: {
            include: {
              votes: true,
              _count: { select: { votes: true } },
            },
            orderBy: { sortOrder: "asc" },
          },
          _count: { select: { comments: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { pollId: null },
        orderBy: { createdAt: "desc" },
        take: 50,
      },
    },
  });

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="text-6xl mb-4">👥</div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Gruppe nicht gefunden</h1>
          <p className="text-muted-foreground mb-4">Die Gruppe existiert nicht oder du bist kein Mitglied.</p>
          <Link href="/dashboard/groups">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zu Gruppen
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = group.ownerId === userId;
  const publicUrl = group.shareToken ? `${await getPublicBaseUrl()}/public/group/${group.shareToken}` : null;

  // Serialize dates for client component — strip password hash for security
  const { password: _pw, deletedAt: _da, ...safeGroup } = group;
  const serializedGroup = {
    ...safeGroup,
    password: null,
    createdAt: group.createdAt.toISOString(),
    updatedAt: group.updatedAt.toISOString(),
    members: group.members.map((m) => ({
      ...m,
      joinedAt: m.joinedAt.toISOString(),
    })),
    polls: group.polls.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
      closedAt: p.closedAt?.toISOString() ?? null,
      options: p.options.map((o) => ({
        ...o,
        votes: o.votes.map((v) => ({
          ...v,
          createdAt: v.createdAt.toISOString(),
        })),
      })),
    })),
    comments: group.comments.map((c) => ({
      ...c,
      createdAt: c.createdAt.toISOString(),
    })),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/groups" className="text-muted-foreground hover:text-foreground flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Zurück zu Gruppen
        </Link>
        <Link href={`/dashboard/groups/${id}/statistics`}>
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Statistiken
          </Button>
        </Link>
      </div>

      <GroupDetailClient
        group={serializedGroup}
        userId={userId || ""}
        isOwner={isOwner}
        initialPublicUrl={publicUrl}
      />
    </div>
  );
}
