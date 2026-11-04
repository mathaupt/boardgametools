import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { withApiLogging } from "@/lib/api-logger";
import { ApiError, handleApiError, requireAuth } from "@/lib/require-auth";
import { EventPlayedSessionService } from "@/lib/services/event-played-session.service";

const participantSchema = z.object({
  userId: z.string().min(1).max(64),
  score: z.number().int().nullable().optional(),
  isWinner: z.boolean().optional(),
  placement: z.number().int().positive().nullable().optional(),
}).strict();

const guestSchema = z.object({
  guestId: z.string().min(1).max(64),
  score: z.number().int().nullable().optional(),
  isWinner: z.boolean().optional(),
  placement: z.number().int().positive().nullable().optional(),
}).strict();

const playedSessionSchema = z.object({
  proposalId: z.string().min(1).max(64),
  operationId: z.string().regex(/^[\w-]{8,100}$/),
  playedAt: z.string().datetime({ offset: true }),
  durationMinutes: z.number().int().min(1).max(1440).nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
  players: z.array(participantSchema).max(20),
  guestPlayers: z.array(guestSchema).max(20),
}).strict().refine((value) => value.players.length + value.guestPlayers.length > 0, {
  message: "Bitte mindestens einen Mitspieler auswählen.",
});

type RouteContext = { params: Promise<{ id: string }> };

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { userId } = await requireAuth();
    const { id: eventId } = await params;
    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      throw new ApiError(400, "Ungültiges JSON-Format.");
    }
    const parsed = playedSessionSchema.safeParse(payload);
    if (!parsed.success) throw new ApiError(400, parsed.error.issues[0]?.message ?? "Ungültige Partiedaten.");

    const result = await EventPlayedSessionService.create(userId, eventId, parsed.data);
    return NextResponse.json(result, { status: result.duplicate ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
});
