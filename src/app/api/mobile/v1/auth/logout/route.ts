import { NextRequest, NextResponse } from "next/server";
import { revokeToken } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { accessToken } = await request.json();
    if (!accessToken) {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    await revokeToken(accessToken);
    return NextResponse.json({ message: "Ausgeloggt" });
  } catch (error) {
    return handleApiError(error);
  }
});
