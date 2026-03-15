import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

// GET /api/admin/monitoring/logs — Paginated API logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const method = searchParams.get("method");
    const path = searchParams.get("path");
    const statusCode = searchParams.get("statusCode");
    const userId = searchParams.get("userId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Build filter conditions
    const where: Record<string, unknown> = {};

    if (method) {
      where.method = method.toUpperCase();
    }

    if (path) {
      where.path = { contains: path, mode: "insensitive" };
    }

    if (statusCode) {
      const parsed = parseInt(statusCode, 10);
      if (!isNaN(parsed)) {
        where.statusCode = parsed;
      }
    }

    if (userId) {
      where.userId = userId;
    }

    if (from || to) {
      const createdAt: Record<string, Date> = {};
      if (from) {
        const fromDate = new Date(from);
        if (!isNaN(fromDate.getTime())) {
          createdAt.gte = fromDate;
        }
      }
      if (to) {
        const toDate = new Date(to);
        if (!isNaN(toDate.getTime())) {
          createdAt.lte = toDate;
        }
      }
      if (Object.keys(createdAt).length > 0) {
        where.createdAt = createdAt;
      }
    }

    const [logs, total] = await Promise.all([
      prisma.apiLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.apiLog.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching API logs:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler beim Abrufen der Logs" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monitoring/logs — Purge old logs
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { olderThanDays } = body;

    if (typeof olderThanDays !== "number" || olderThanDays < 7) {
      return NextResponse.json(
        { error: "olderThanDays muss eine Zahl >= 7 sein" },
        { status: 400 }
      );
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await prisma.apiLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
      },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error purging API logs:", error);
    return NextResponse.json(
      { error: "Interner Serverfehler beim Löschen der Logs" },
      { status: 500 }
    );
  }
}
