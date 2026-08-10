import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

function extractBearerToken(request: NextRequest): string | undefined {
  const authHeader = request.headers.get("authorization");
  return authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
}

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    let accessToken: string | undefined;

    // Try JSON body first (legacy clients), fall back to Authorization header
    try {
      const body = await request.json();
      accessToken = body?.accessToken;
    } catch {
      // Empty or invalid body is fine – token can be in Authorization header
    }

    if (!accessToken) {
      accessToken = extractBearerToken(request);
    }

    if (!accessToken) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    await revokeToken(accessToken);
    return NextResponse.json({ message: "Ausgeloggt" });
  } catch (error) {
    return handleApiError(error);
  }
});
