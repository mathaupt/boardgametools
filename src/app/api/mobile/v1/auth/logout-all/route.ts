import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    await prisma.apiToken.updateMany({
      where: { userId: session.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });

    return NextResponse.json({ message: "Alle Sitzungen beendet" });
  } catch (error) {
    return handleApiError(error);
  }
});
