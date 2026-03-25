import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const result = await GameService.bulkDelete(userId, body.gameIds);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
