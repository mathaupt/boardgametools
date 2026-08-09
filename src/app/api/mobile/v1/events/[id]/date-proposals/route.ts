import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { apiAuth } from "@/lib/api-auth";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError } from "@/lib/require-auth";
import { Errors } from "@/lib/error-messages";
import { toDateProposalDto } from "@/lib/dto-mappers";
import { NOT_DELETED, SAFE_USER_SELECT } from "@/lib/services/shared";
import { hasEventAccess } from "../_helpers";

type RouteContext = { params: Promise<{ id: string }> };

const dateProposalInclude = {
  votes: { include: { user: { select: SAFE_USER_SELECT } } },
  guestVotes: { include: { guest: { select: { id: true, nickname: true } } } },
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
      include: { invites: { select: { userId: true } } },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (!hasEventAccess(event, session.user.id)) {
      throw new ApiError(403, Errors.ACCESS_DENIED);
    }

    const proposals = await prisma.dateProposal.findMany({
      where: { eventId: id },
      include: dateProposalInclude,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(proposals.map(toDateProposalDto));
  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withApiLogging(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const session = await apiAuth(request);
    if (!session) throw new ApiError(401, Errors.UNAUTHORIZED);

    const { id } = await params;
    const event = await prisma.event.findFirst({
      where: { id, ...NOT_DELETED },
    });

    if (!event) throw new ApiError(404, Errors.EVENT_NOT_FOUND);
    if (event.createdById !== session.user.id) {
      throw new ApiError(403, Errors.ONLY_CREATOR_CAN_CREATE_DATES);
    }

    if (event.selectedDate) {
      throw new ApiError(400, Errors.DATE_POLL_ALREADY_FINALIZED);
    }

    const body = (await request.json()) as {
      dates?: string[];
      startDate?: string;
      endDate?: string;
      weekdays?: number[];
    };

    let dates: Date[] = [];

    if (body.dates && Array.isArray(body.dates)) {
      dates = body.dates.map((d) => new Date(d));
    } else if (body.startDate && body.endDate) {
      const start = new Date(body.startDate);
      const end = new Date(body.endDate);
      const weekdays: number[] | undefined = body.weekdays;

      if (start > end) {
        throw new ApiError(400, Errors.START_BEFORE_END);
      }

      const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 365) {
        throw new ApiError(400, Errors.DATE_RANGE_MAX_365);
      }

      const current = new Date(start);
      while (current <= end) {
        if (!weekdays || weekdays.includes(current.getDay())) {
          dates.push(new Date(current));
        }
        current.setDate(current.getDate() + 1);
      }
    } else {
      throw new ApiError(400, Errors.MISSING_REQUIRED_FIELDS);
    }

    if (dates.length === 0) {
      throw new ApiError(400, Errors.NO_VALID_DATES);
    }

    const normalizedDates = dates.map((d) => {
      const normalized = new Date(d);
      normalized.setUTCHours(0, 0, 0, 0);
      return normalized;
    });

    await prisma.$transaction(
      normalizedDates.map((date) =>
        prisma.dateProposal.upsert({
          where: { eventId_date: { eventId: id, date } },
          update: {},
          create: { eventId: id, date },
        })
      )
    );

    const allProposals = await prisma.dateProposal.findMany({
      where: { eventId: id },
      include: dateProposalInclude,
      orderBy: { date: "asc" },
    });

    return NextResponse.json(allProposals.map(toDateProposalDto), { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
