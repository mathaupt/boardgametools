import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { searchBGGGames } from "@/lib/bgg";

export async function GET(request: NextRequest) {
  console.log("BGG Search API called");
  
  const session = await auth();
  console.log("Session:", session?.user?.email || "No session");
  
  if (!session?.user?.id) {
    console.log("Unauthorized - no user session");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  
  console.log("Search query:", query);

  if (!query || query.length < 2) {
    return NextResponse.json({ error: "Query must be at least 2 characters" }, { status: 400 });
  }

  try {
    console.log("Calling BGG search...");
    const results = await searchBGGGames(query);
    console.log("BGG search results:", results.length, "items");
    return NextResponse.json(results);
  } catch (error) {
    console.error("BGG search error:", error);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
