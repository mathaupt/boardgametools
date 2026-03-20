import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchBGGGames } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    const results = await searchBGGGames(query);
    return NextResponse.json(results);
  } catch (error) {
    console.error("BGG search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
});
