import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, isActive } = await request.json();

    if (!userId || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Update user active status
    await prisma.user.update({
      where: { id: userId },
      data: { isActive },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error toggling user status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
