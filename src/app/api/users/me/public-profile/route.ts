import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { ProfileService } from "@/lib/services/profile.service";

export async function GET() {
  try {
    const { userId } = await requireAuth();
    return NextResponse.json(await ProfileService.getSharingSettings(userId), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}

export async function PATCH(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const body: unknown = await request.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    const value = body as Record<string, unknown>;
    if (typeof value.enabled !== "boolean" || !Array.isArray(value.featuredBadgeIds) || !value.featuredBadgeIds.every((id) => typeof id === "string") || (value.rotate !== undefined && typeof value.rotate !== "boolean")) {
      return NextResponse.json({ error: "Ungültige Eingabe." }, { status: 400 });
    }
    return NextResponse.json(await ProfileService.updateSharingSettings(userId, { enabled: value.enabled, featuredBadgeIds: value.featuredBadgeIds as string[], rotate: value.rotate as boolean | undefined }), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return handleApiError(error); }
}
