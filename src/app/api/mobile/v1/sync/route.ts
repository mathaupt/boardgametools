import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { buildSyncPayload } from "@/lib/sync-response";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    const payload = await buildSyncPayload(session.user.id);
    return NextResponse.json(payload);
  } catch (error) {
    return handleApiError(error);
  }
});
