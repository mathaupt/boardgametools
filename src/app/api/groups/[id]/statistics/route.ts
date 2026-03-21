import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Check membership
    const group = await prisma.group.findFirst({
      where: {
        id,
        OR: [
          { ownerId: session.user.id },
          { members: { some: { userId: session.user.id } } },
        ],
      },
      select: { id: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Parallel queries for all stats
    const [
      memberCount,
      polls,
      commentCount,
      eventCount,
      members,
      topCommenters,
      monthlyActivity,
    ] = await Promise.all([
      prisma.groupMember.count({ where: { groupId: id } }),
      prisma.groupPoll.findMany({
        where: { groupId: id },
        include: {
          options: { include: { _count: { select: { votes: true } } } },
        },
      }),
      prisma.groupComment.count({ where: { groupId: id } }),
      prisma.event.count({ where: { groupId: id } }),
      prisma.groupMember.findMany({
        where: { groupId: id },
        include: {
          user: { select: { id: true, name: true } },
        },
        orderBy: { joinedAt: "asc" },
      }),
      // Top commenters
      prisma.groupComment.groupBy({
        by: ["authorName"],
        where: { groupId: id },
        _count: { id: true },
        orderBy: { _count: { id: "desc" } },
        take: 10,
      }),
      // Monthly activity (last 12 months of comments)
      prisma.groupComment.findMany({
        where: {
          groupId: id,
          createdAt: {
            gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
          },
        },
        select: { createdAt: true },
      }),
    ]);

    // Calculate poll stats
    const openPolls = polls.filter((p) => p.status === "open").length;
    const closedPolls = polls.filter((p) => p.status === "closed").length;
    const totalVotes = polls.reduce(
      (sum, p) =>
        sum + p.options.reduce((s, o) => s + o._count.votes, 0),
      0
    );
    const avgParticipation =
      polls.length > 0
        ? Math.round((totalVotes / polls.length) * 10) / 10
        : 0;

    // Monthly activity aggregation
    const monthMap = new Map<string, number>();
    for (const c of monthlyActivity) {
      const key = `${c.createdAt.getFullYear()}-${String(c.createdAt.getMonth() + 1).padStart(2, "0")}`;
      monthMap.set(key, (monthMap.get(key) || 0) + 1);
    }
    const monthlyData = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, count]) => ({ month, comments: count }));

    return NextResponse.json({
      overview: {
        memberCount,
        pollCount: polls.length,
        openPolls,
        closedPolls,
        commentCount,
        eventCount,
        totalVotes,
        avgParticipation,
      },
      members: members.map((m) => ({
        id: m.user.id,
        name: m.user.name,
        joinedAt: m.joinedAt,
        role: m.role,
      })),
      topCommenters: topCommenters.map((c) => ({
        name: c.authorName,
        count: c._count.id,
      })),
      monthlyActivity: monthlyData,
    });
  } catch (error) {
    console.error("Error fetching group statistics:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
});
