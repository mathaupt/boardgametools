import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { SessionService } from "@/lib/services";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "0", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "0", 10), 100);
    const result = await SessionService.list(userId, { page, limit });
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const result = await SessionService.create(userId, body);
    return NextResponse.json(result, { status: 201, headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
