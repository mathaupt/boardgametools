import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

export const GET = withApiLogging(async function GET(_request: NextRequest) {
  const { userId } = await requireAuth();

  try {
    // Alle Users für Sharing (außer sich selbst)
    const users = await prisma.user.findMany({
      where: { 
        id: { not: userId }
      },
      select: {
        id: true,
        name: true,
        email: true
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(users);
  } catch (error) {
    return handleApiError(error);
  }
});
