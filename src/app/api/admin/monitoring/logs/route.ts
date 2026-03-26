import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import logger from "@/lib/logger";

// GET /api/admin/monitoring/logs — Paginated API logs with optional filters
export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAdmin()

    const { searchParams } = new URL(request.url);

    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
    const method = searchParams.get("method");
    const path = searchParams.get("path");
    const statusCode = searchParams.get("statusCode");
    const filterUserId = searchParams.get("userId");
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

    if (filterUserId) {
      where.userId = filterUserId;
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
    logger.error({ err: error }, "Error fetching API logs");
    return NextResponse.json(
      { error: "Interner Serverfehler beim Abrufen der Logs" },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/monitoring/logs — Purge old logs
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAdmin()

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
    logger.error({ err: error }, "Error purging API logs");
    return NextResponse.json(
      { error: "Interner Serverfehler beim Löschen der Logs" },
      { status: 500 }
    );
  }
}
