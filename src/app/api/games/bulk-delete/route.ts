import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body as { ids?: string[] };

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });
    }

    const result = await prisma.game.deleteMany({
      where: { id: { in: ids }, ownerId: session.user.id },
    });

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error bulk deleting games:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
