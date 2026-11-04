import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitAsync, rateLimitResponse } from "@/lib/rate-limit";
import { isValidProfileToken } from "@/lib/gamification/profile-token";
import { ProfileService } from "@/lib/services/profile.service";

/** The bearer token is accepted only in the request body so it never appears in URL/access logs. */
export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limit = await checkRateLimitAsync(`public-profile:${ip}`, 60, 60_000);
  if (!limit.allowed) return rateLimitResponse(limit.retryAfterMs);

  let body: unknown;
  try { body = await request.json(); } catch { body = null; }
  const token = typeof body === "object" && body !== null && "token" in body
    ? (body as { token?: unknown }).token
    : undefined;
  if (typeof token !== "string" || !isValidProfileToken(token)) {
    return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  }
  const profile = await ProfileService.getPublicProfile(token);
  if (!profile) return NextResponse.json({ error: "Profil nicht gefunden." }, { status: 404, headers: { "Cache-Control": "private, no-store" } });
  return NextResponse.json(profile, { headers: { "Cache-Control": "private, no-store" } });
}
