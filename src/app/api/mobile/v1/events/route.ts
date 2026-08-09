import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toEventDto } from "@/lib/dto-mappers";
import { EventService } from "@/lib/services/event.service";
import type { CreateEventInput } from "@/lib/services/event.service";
import { NOT_DELETED } from "@/lib/services/shared";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const events = await prisma.event.findMany({
      where: {
        ...NOT_DELETED,
        OR: [
          { createdById: session.user.id },
          {
            invites: {
              some: {
                OR: [{ userId: session.user.id }, { email: session.user.email }],
              },
            },
          },
          {
            group: {
              deletedAt: null,
              members: { some: { userId: session.user.id } },
            },
          },
        ],
      },
      orderBy: { eventDate: "desc" },
    });

    return NextResponse.json(events.map(toEventDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(request: NextRequest) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const body = (await request.json()) as CreateEventInput;
    const event = await EventService.create(session.user.id, body);

    return NextResponse.json(toEventDto(event), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
