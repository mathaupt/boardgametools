import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { encryptId } from "@/lib/crypto";
import { getPublicBaseUrl } from "@/lib/public-link";
import { withApiLogging } from "@/lib/api-logger";
import { Errors } from "@/lib/error-messages";
import { withEventMutation } from "@/lib/services/event-mutation.service";
import { ApiError } from "@/lib/require-auth";

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  const { userId } = await requireAuth();

  const { id } = await params;

  try {
    const updatedEvent = await withEventMutation({ kind: "user", eventId: id, userId }, null, async ({ tx, event }) => {
      if (event.createdById !== userId) throw new ApiError(403, Errors.ACCESS_DENIED);
      const shareToken = event.shareToken ?? encryptId(event.id);
      return tx.event.update({
        where: { id: event.id },
        data: { isPublic: true, shareToken },
        select: { id: true, shareToken: true },
      });
    });

    const publicUrl = `${await getPublicBaseUrl()}/public/event/${updatedEvent.shareToken}`;

    return NextResponse.json({
      shareToken: updatedEvent.shareToken,
      publicUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
});
