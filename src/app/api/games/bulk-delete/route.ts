import { NextRequest, NextResponse } from "next/server";
import { invalidateTag } from "@/lib/cache";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { withApiLogging } from "@/lib/api-logger";
import { CacheTags } from "@/lib/cache-tags";

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ids } = body as { ids?: string[] };

    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 500) {
      return NextResponse.json({ error: "1–500 IDs required" }, { status: 400 });
    }

    const result = await prisma.game.deleteMany({
      where: { id: { in: ids }, ownerId: session.user.id },
    });

    invalidateTag(CacheTags.userGames(session.user.id));
    invalidateTag(CacheTags.userDashboard(session.user.id));

    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error("Error bulk deleting games:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
