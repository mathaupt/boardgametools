import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";
import { env } from "@/lib/env";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST() {
  // Block entirely in production
  if (env.NODE_ENV !== "development") {
    return NextResponse.json({ error: Errors.NOT_AVAILABLE }, { status: 404 });
  }
  // Require admin even in development
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: Errors.NOT_AVAILABLE }, { status: 404 });
  }

  try {
    if (!env.DATABASE_URL) {
      return NextResponse.json(
        { error: Errors.DB_URL_NOT_SET },
        { status: 500 }
      );
    }

    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: userCount > 0 ? "exists" : "empty",
      message: userCount > 0 ? Errors.DB_ALREADY_INITIALIZED : Errors.DB_EMPTY,
      userCount
    });

  } catch (error) {
    logger.error({ err: error }, "Database check failed");
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : Errors.UNKNOWN_ERROR,
        details: Errors.CHECK_DB_PERMISSIONS
      },
      { status: 500 }
    );
  }
});
