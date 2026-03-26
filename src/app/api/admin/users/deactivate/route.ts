import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import { validateString } from "@/lib/validation";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId: adminUserId } = await requireAdmin();

    const { userId: targetUserId, isActive } = await request.json();

    const userIdError = validateString(targetUserId, "userId", { max: 100 });
    if (userIdError) {
      return NextResponse.json({ error: userIdError }, { status: 400 });
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: Errors.MISSING_REQUIRED_FIELDS }, { status: 400 });
    }

    // Prevent admin from deactivating themselves
    if (targetUserId === adminUserId) {
      return NextResponse.json({ error: Errors.CANNOT_MODIFY_OWN_ACCOUNT }, { status: 400 });
    }

    // Update user active status
    await prisma.user.update({
      where: { id: targetUserId },
      data: { isActive },
    });

    return NextResponse.json({ message: Errors.USER_STATUS_CHANGED });
  } catch (error) {
    return handleApiError(error);
  }
});
