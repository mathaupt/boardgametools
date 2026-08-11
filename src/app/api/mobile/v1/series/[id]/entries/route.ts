import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { SeriesService } from "@/lib/services";

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await apiAuth(request);
    if (!session) {
      throw new ApiError(401, Errors.UNAUTHORIZED);
    }
    const { id } = await params;
    const body = await request.json();
    const result = await SeriesService.addEntry(session.user.id, id, body);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
