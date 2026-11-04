import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError, requireAuth } from "@/lib/require-auth";
import { GroupChallengeService } from "@/lib/services/group-challenge.service";

type Context = { params: Promise<{ id: string; challengeId: string }> };

export const POST = withApiLogging(async function POST(_request: NextRequest, { params }: Context) {
  try { const { userId } = await requireAuth(); const { id, challengeId } = await params; return NextResponse.json(await GroupChallengeService.join(id, challengeId, userId), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return handleApiError(error); }
});

export const DELETE = withApiLogging(async function DELETE(_request: NextRequest, { params }: Context) {
  try { const { userId } = await requireAuth(); const { id, challengeId } = await params; return NextResponse.json(await GroupChallengeService.leave(id, challengeId, userId), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return handleApiError(error); }
});
