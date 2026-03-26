import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { TagService } from "@/lib/services";
import { Errors } from "@/lib/error-messages";

export const GET = withApiLogging(async function GET() {
  try {
    const { userId } = await requireAuth();
    const result = await TagService.list(userId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { name } = await request.json();
    const { tag, created } = await TagService.create(userId, name);
    return NextResponse.json(tag, { status: created ? 201 : 200 });
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: Errors.TAG_ID_REQUIRED }, { status: 400 });
    const result = await TagService.delete(userId, id);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
