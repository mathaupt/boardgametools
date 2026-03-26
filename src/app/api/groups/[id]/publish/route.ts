import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { encryptId } from "@/lib/crypto";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const group = await prisma.group.findFirst({
      where: { id, ownerId: userId, deletedAt: null },
      select: { id: true, shareToken: true },
    });

    if (!group) {
      return NextResponse.json({ error: Errors.GROUP_NOT_FOUND }, { status: 404 });
    }

    const shareToken = group.shareToken ?? encryptId(group.id);

    const updated = await prisma.group.update({
      where: { id },
      data: { isPublic: true, shareToken },
      select: { id: true, shareToken: true },
    });

    const publicUrl = `${await getPublicBaseUrl()}/public/group/${updated.shareToken}`;

    return NextResponse.json({ shareToken: updated.shareToken, publicUrl });
  } catch (error) {
    return handleApiError(error);
  }
});
