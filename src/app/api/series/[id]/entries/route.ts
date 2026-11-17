import { NextRequest } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { createSeriesEntryResponse } from "@/lib/series/create-entry-response";

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await requireAuth();
    return await createSeriesEntryResponse(request, (await params).id, userId);
  } catch (error) { return handleApiError(error); }
});
