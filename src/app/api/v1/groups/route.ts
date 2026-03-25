import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { GroupService } from "@/lib/services";

export const GET = withApiLogging(async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await GroupService.list(userId);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const result = await GroupService.create(userId, body);
    return NextResponse.json(result, { status: 201, headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
