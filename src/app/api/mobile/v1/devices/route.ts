import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = await request.json();
    const { token, platform = "ios" } = body;

    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Geräte-Token erforderlich" }, { status: 400 });
    }

    await prisma.pushDevice.upsert({
      where: { userId_deviceToken: { userId: session.user.id, deviceToken: token } },
      update: { platform: String(platform), updatedAt: new Date() },
      create: {
        userId: session.user.id,
        deviceToken: token,
        platform: String(platform),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
