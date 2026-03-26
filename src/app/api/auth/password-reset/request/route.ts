import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";

export const POST = withApiLogging(async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(`pw-reset-request:${ip}`, 3, 60_000);
    if (!allowed) return rateLimitResponse(retryAfterMs);

    const appUrl = await getPublicBaseUrl();
    const { email } = await request.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "E-Mail ist erforderlich" }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    // Immer success zurückgeben, um Enumeration zu verhindern
    if (!user || !user.isActive) {
      return NextResponse.json({ success: true });
    }

    const { token, expiresAt } = await createPasswordResetToken(user.id);
    const resetUrl = `${appUrl.replace(/\/$/, "")}/reset-password?token=${token}`;

    await sendPasswordResetEmail(user.email, resetUrl, expiresAt);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ err: error }, "Password reset request failed");
    return NextResponse.json({ error: "Passwort-Reset derzeit nicht möglich" }, { status: 500 });
  }
});
