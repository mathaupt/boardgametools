import { handlers } from "@/lib/auth";
import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";

const { GET: authGET, POST: authPOST } = handlers;

export const GET = authGET;

export async function POST(request: NextRequest, _context: unknown) {
  const { pathname } = new URL(request.url);
  if (pathname.endsWith("/callback/credentials")) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const { allowed, retryAfterMs } = checkRateLimit(
      `login:${ip}`,
      10,
      60_000
    );
    if (!allowed) return rateLimitResponse(retryAfterMs);
  }
  return authPOST(request);
}
