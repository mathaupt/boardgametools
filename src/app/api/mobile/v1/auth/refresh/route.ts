import { NextRequest, NextResponse } from "next/server";
import { rotateTokenPair, hashToken } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();
    if (!refreshToken) {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    const tokens = await rotateTokenPair(refreshToken);
    if (!tokens) {
      // Optional: revoke all tokens for this refresh hash to limit abuse
      await prisma.apiToken.updateMany({
        where: { tokenHash: hashToken(refreshToken) },
        data: { revokedAt: new Date() },
      });
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }

    return NextResponse.json(tokens);
  } catch (error) {
    return handleApiError(error);
  }
});
