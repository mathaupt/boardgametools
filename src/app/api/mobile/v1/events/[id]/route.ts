import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toEventDto, toDateProposalDto, toGameDto } from "@/lib/dto-mappers";
import { EventService } from "@/lib/services/event.service";
import type { UpdateEventInput } from "@/lib/services/event.service";
import { NOT_DELETED, SAFE_USER_SELECT } from "@/lib/services/shared";
import { hasEventAccess, mapProposal } from "./_helpers";

type RouteContext = { params: Promise<{ id: string }> };

const eventDetailInclude = {
  createdBy: { select: SAFE_USER_SELECT },
  invites: { include: { user: { select: SAFE_USER_SELECT } } },
  proposals: {
    include: {
      game: {
        include: {
          tags: { include: { tag: { select: { name: true } } } },
        },
      },
      proposedBy: { select: SAFE_USER_SELECT },
      guest: { select: { id: true, nickname: true } },
      votes: { select: { id: true, userId: true } },
      guestVotes: { select: { id: true } },
      _count: { select: { votes: true, guestVotes: true } },
    },
    orderBy: { createdAt: "desc" as const },
  },
  selectedGame: {
    include: {
      tags: { include: { tag: { select: { name: true } } } },
    },
  },
  dateProposals: {
    include: {
      votes: { include: { user: { select: SAFE_USER_SELECT } } },
      guestVotes: { include: { guest: { select: { id: true, nickname: true } } } },
    },
    orderBy: { date: "asc" as const },
  },
};

export const GET = withApiLogging(async function GET(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
      include: eventDetailInclude,
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    return NextResponse.json({
      ...toEventDto(event),
      proposals: event.proposals.map((proposal) =>
        mapProposal(proposal, session.user.id)
      ),
      dateProposals: event.dateProposals.map(toDateProposalDto),
      selectedGame: event.selectedGame ? toGameDto(event.selectedGame) : null,
      isCreator: event.createdById === session.user.id,
      currentUserId: session.user.id,
    });
  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withApiLogging(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const body = (await request.json()) as UpdateEventInput;
    const updated = await EventService.update(session.user.id, id, body);

    return NextResponse.json(toEventDto(updated));
  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withApiLogging(async function DELETE(
  _request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(_request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    await EventService.delete(session.user.id, id);

    return NextResponse.json({ message: "Event gelöscht" });
  } catch (error) {
    return handleApiError(error);
  }
});
