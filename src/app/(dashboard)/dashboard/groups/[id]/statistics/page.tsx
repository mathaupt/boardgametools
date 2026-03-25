import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  MessageCircle,
  CalendarDays,
  ArrowLeft,
  Vote,
  BarChart3,
} from "lucide-react";
import { cachedQuery } from "@/lib/cache";
import { CacheTags } from "@/lib/cache-tags";
import { GroupStatisticsCharts } from "./group-statistics-charts";

export default async function GroupStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;

  // Check membership
  const group = await prisma.group.findFirst({
    where: {
      id,
      OR: [
        { ownerId: session.user.id },
        { members: { some: { userId: session.user.id } } },
      ],
    },
    select: { id: true, name: true },
  });

  if (!group) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Gruppe nicht gefunden
          </h1>
          <p className="text-muted-foreground mb-4">
            Die Gruppe existiert nicht oder du bist kein Mitglied.
          </p>
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

  // Parallel queries for all stats
  const [
    memberCount,
    polls,
    commentCount,
    eventCount,
    topCommenters,
    monthlyActivity,
  ] = await cachedQuery(
    () => Promise.all([
      prisma.groupMember.count({ where: { groupId: id } }),
      prisma.groupPoll.findMany({
        where: { groupId: id },
        include: {
          options: { include: { _count: { select: { votes: true } } } },
        },
      }),
      prisma.groupComment.count({ where: { groupId: id } }),
      prisma.event.count({ where: { groupId: id } }),
      prisma.groupComment.groupBy({
        by: ["authorName"],
        where: { groupId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      prisma.groupComment.findMany({
        where: {
          groupId: id,
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),
    ]),
    ["group-statistics", id],
    { revalidate: 120, tags: [CacheTags.groupStats(id)] }
  );

  // Calculate poll stats
  const openPolls = polls.filter((p) => p.status === "open").length;
  const closedPolls = polls.filter((p) => p.status === "closed").length;
  const totalVotes = polls.reduce(
    (sum, p) => sum + p.options.reduce((s, o) => s + o._count.votes, 0),
    0
  );

  // Monthly activity aggregation
  const monthMap = new Map<string, number>();
  for (const c of monthlyActivity) {
    const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
    monthMap.set(key, (monthMap.get(key) || 0) + 1);
  }
  const monthlyData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, count]) => ({ month, comments: count }));

  const topCommentersData = topCommenters.map((c) => ({
    name: c.authorName,
    count: c._count.id,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/groups/${id}`}
          className="text-muted-foreground hover:text-foreground flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Gruppe
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Gruppen-Statistiken
        </h1>
        <p className="text-muted-foreground">
          Auswertungen für {group.name}
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mitglieder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
            <p className="text-xs text-muted-foreground">in dieser Gruppe</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Umfragen</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{polls.length}</div>
            <p className="text-xs text-muted-foreground">
              {openPolls} offen · {closedPolls} geschlossen
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Kommentare</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{commentCount}</div>
            <p className="text-xs text-muted-foreground">
              {totalVotes} Stimmen abgegeben
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventCount}</div>
            <p className="text-xs text-muted-foreground">geplante Events</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts & Leaderboard */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GroupStatisticsCharts monthlyActivity={monthlyData} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-4 w-4" />
              Top Kommentierer
            </CardTitle>
            <CardDescription>
              Die aktivsten Mitglieder nach Kommentaren
            </CardDescription>
          </CardHeader>
          <CardContent>
            {topCommentersData.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Noch keine Kommentare vorhanden.
              </p>
            ) : (
              <div className="space-y-3">
                {topCommentersData.map((commenter, index) => (
                  <div
                    key={commenter.name}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-medium text-muted-foreground w-5 text-right">
                        {index + 1}.
                      </span>
                      <p className="text-sm font-medium truncate">
                        {commenter.name}
                      </p>
                    </div>
                    <span className="text-sm font-semibold whitespace-nowrap ml-2">
                      {commenter.count}{" "}
                      {commenter.count === 1 ? "Kommentar" : "Kommentare"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
