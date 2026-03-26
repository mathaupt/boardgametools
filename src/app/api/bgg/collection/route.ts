import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/require-auth";
import { fetchBGGCollection } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const { userId: _userId } = await requireAuth();

  const username = request.nextUrl.searchParams.get("username");

  if (!username || username.trim().length < 1) {
    return NextResponse.json({ error: Errors.BGG_USERNAME_REQUIRED }, { status: 400 });
  }

  try {
    const collection = await fetchBGGCollection(username.trim());
    return NextResponse.json({ collection, total: collection.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : Errors.COLLECTION_FETCH_FAILED;
    logger.error({ message }, "BGG collection error");
    return NextResponse.json({ error: message }, { status: 502 });
  }
});
