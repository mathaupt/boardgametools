import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { auth } from "@/lib/auth";
import { withApiLogging } from "@/lib/api-logger";

export const POST = withApiLogging(async function POST() {
  // Only allow in development or for authenticated admins
  const session = await auth();
  if (process.env.NODE_ENV !== "development" && session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }

  try {
    if (!process.env.SQL_DATABASE_URL) {
      return NextResponse.json(
        { error: "SQL_DATABASE_URL environment variable is not set" },
        { status: 500 }
      );
    }

    const userCount = await prisma.user.count();

    return NextResponse.json({
      status: userCount > 0 ? "exists" : "empty",
      message: userCount > 0 ? "Database already initialized" : "Database is empty",
      userCount
    });

  } catch (error) {
    console.error("Database check failed:", error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : "Unknown error",
        details: "Check SQL_DATABASE_URL and database permissions"
      },
      { status: 500 }
    );
  }
});
