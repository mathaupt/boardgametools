import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { createPasswordResetToken } from "@/lib/password-reset";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { getPublicBaseUrl } from "@/lib/public-link";

const appUrl = getPublicBaseUrl();

export async function POST(request: Request) {
  try {
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
    console.error("Password reset request failed:", error);
    return NextResponse.json({ error: "Passwort-Reset derzeit nicht möglich" }, { status: 500 });
  }
}
