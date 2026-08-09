import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { GroupService, CreateGroupInput } from "@/lib/services/group.service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toGroupDto } from "@/lib/dto-mappers";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || undefined;
    const limit = Number(searchParams.get("limit")) || undefined;

    const result = await GroupService.list(session.user.id, { page, limit });
    const groups = Array.isArray(result) ? result : result.data;

    return NextResponse.json(groups.map(toGroupDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = (await request.json()) as CreateGroupInput;
    const group = await GroupService.create(session.user.id, body);

    return NextResponse.json(toGroupDto(group), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
