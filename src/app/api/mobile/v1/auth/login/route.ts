import { NextRequest, NextResponse } from "next/server";
import { compare } from "bcryptjs";
import prisma from "@/lib/db";
import { createTokenPair } from "@/lib/token-service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive) {
      throw new ApiError(401, Errors.INVALID_CREDENTIALS);
    }

    const valid = await compare(password, user.passwordHash);
    if (!valid) {
      throw new ApiError(401, Errors.INVALID_CREDENTIALS);
    }

    const tokens = await createTokenPair(user.id);
    return NextResponse.json({
      ...tokens,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (error) {
    return handleApiError(error);
  }
});
