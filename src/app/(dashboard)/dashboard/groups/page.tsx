import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Vote, MessageSquare } from "lucide-react";
import Link from "next/link";

export default async function GroupsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const groups = await cachedQuery(
    () => prisma.group.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { members: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, name: true } },
        members: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { joinedAt: "asc" },
          take: 5,
        },
        _count: { select: { members: true, polls: true, comments: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    ["user-groups-list", userId!],
    { revalidate: 60, tags: [CacheTags.userGroups(userId!)] }
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Gruppen</h1>
          <p className="text-muted-foreground">Spielergruppen mit Abstimmungen und Diskussionen</p>
        </div>
        <Link href="/dashboard/groups/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Gruppe erstellen
          </Button>
        </Link>
      </div>

      {groups.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold mb-2">Noch keine Gruppen</h3>
            <p className="text-muted-foreground mb-4 text-center">
              Erstelle eine Gruppe, um mit deinen Mitspieler:innen Abstimmungen durchzuführen.
            </p>
            <Link href="/dashboard/groups/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erste Gruppe erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link key={group.id} href={`/dashboard/groups/${group.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center">
                        👥
                      </div>
                      {group.name}
                    </CardTitle>
                    {group.ownerId === userId && (
                      <Badge variant="secondary">Owner</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {group._count.members}
                    </div>
                    <div className="flex items-center gap-1">
                      <Vote className="h-4 w-4" />
                      {group._count.polls}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="h-4 w-4" />
                      {group._count.comments}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {group.members.map((member) => (
                      <span
                        key={member.id}
                        className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs text-muted-foreground"
                      >
                        {member.user.name}
                      </span>
                    ))}
                    {group._count.members > 5 && (
                      <span className="text-xs text-muted-foreground">
                        +{group._count.members - 5} weitere
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
