import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";

type RouteContext = { params: Promise<{ id: string }> };

export const GET = withApiLogging(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ error: "Invalid BGG ID" }, { status: 400 });
  }

  try {
    const gameData = await fetchBGGGame(id);

    if (!gameData) {
      return NextResponse.json({ error: "Game not found on BGG" }, { status: 404 });
    }

    return NextResponse.json(gameData);
  } catch (error) {
    console.error("Error fetching BGG game:", error);
    return NextResponse.json({ error: "Failed to fetch game" }, { status: 500 });
  }
});
