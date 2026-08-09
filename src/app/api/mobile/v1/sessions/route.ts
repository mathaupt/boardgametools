import { NextRequest, NextResponse } from "next/server";
import { apiAuth } from "@/lib/api-auth";
import { SessionService, CreateSessionInput } from "@/lib/services/session.service";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toSessionDto } from "@/lib/dto-mappers";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const sessions = await SessionService.list(session.user.id);
    return NextResponse.json(Array.isArray(sessions) ? sessions.map(toSessionDto) : sessions.data.map(toSessionDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = (await request.json()) as CreateSessionInput;
    const created = await SessionService.create(session.user.id, body);
    return NextResponse.json(toSessionDto(created), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
