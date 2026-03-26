import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, handleApiError } from "@/lib/require-auth";
import { hash } from "bcryptjs";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId: adminUserId } = await requireAdmin();

    const { userId: targetUserId, newPassword } = await request.json();

    if (!targetUserId || !newPassword) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (targetUserId === adminUserId) {
      return NextResponse.json({ error: "Eigenes Passwort kann nicht über Admin-Funktion geändert werden" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long" }, { status: 400 });
    }

    // Hash the new password
    const passwordHash = await hash(newPassword, 12);

    // Update user password
    await prisma.user.update({
      where: { id: targetUserId },
      data: { passwordHash },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
});
