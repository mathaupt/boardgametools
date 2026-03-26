import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { GameService } from "@/lib/services";
import { Errors } from "@/lib/error-messages";

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { ids } = body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return NextResponse.json({ error: Errors.IDS_REQUIRED }, { status: 400 });
    }
    const result = await GameService.bulkDelete(userId, ids);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
