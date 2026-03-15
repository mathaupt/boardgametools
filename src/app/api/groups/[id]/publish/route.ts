import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { encryptId } from "@/lib/crypto";
import { getPublicBaseUrl } from "@/lib/public-link";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: session.user.id },
      select: { id: true, shareToken: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const shareToken = group.shareToken ?? encryptId(group.id);

    const updated = await prisma.group.update({
      where: { id },
      data: { isPublic: true, shareToken },
      select: { id: true, shareToken: true },
    });

    const publicUrl = `${getPublicBaseUrl()}/public/group/${updated.shareToken}`;

    return NextResponse.json({ shareToken: updated.shareToken, publicUrl });
  } catch (error) {
    console.error("Error publishing group:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
