import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { TagService } from "@/lib/services";

export const GET = withApiLogging(async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await TagService.list(userId);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body = await request.json();
    const { tag, created } = await TagService.create(userId, body.name);
    return NextResponse.json(tag, {
      status: created ? 201 : 200,
      headers: { "X-API-Version": "1" },
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400, headers: { "X-API-Version": "1" } }
      );
    }
    const result = await TagService.delete(userId, id);
    return NextResponse.json(result, { headers: { "X-API-Version": "1" } });
  } catch (error) {
    return handleApiError(error);
  }
});
