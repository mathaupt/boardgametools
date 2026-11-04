import { NextRequest, NextResponse } from "next/server";
import { withApiLogging } from "@/lib/api-logger";
import { handleApiError, requireAuth } from "@/lib/require-auth";
import { GroupChallengeService } from "@/lib/services/group-challenge.service";

type Context = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(_request: NextRequest, { params }: Context) {
  try { const { userId } = await requireAuth(); const { id } = await params; return NextResponse.json(await GroupChallengeService.list(id, userId), { headers: { "Cache-Control": "private, no-store" } }); }
  catch (error) { return handleApiError(error); }
});

export const POST = withApiLogging(async function POST(request: NextRequest, { params }: Context) {
  try {
    const { userId } = await requireAuth(); const { id } = await params; const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    const data = body as Record<string, unknown>;
    if (typeof data.title !== "string" || (data.kind !== "sessions" && data.kind !== "games") || typeof data.target !== "number" || (data.endsAt !== undefined && data.endsAt !== null && typeof data.endsAt !== "string")) return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    const endsAt = typeof data.endsAt === "string" ? new Date(data.endsAt) : null;
    if (endsAt && !Number.isFinite(endsAt.getTime())) return NextResponse.json({ error: "Ungültiges Enddatum." }, { status: 400 });
    return NextResponse.json(await GroupChallengeService.create(id, userId, { title: data.title, kind: data.kind, target: data.target, endsAt }), { status: 201, headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
});
