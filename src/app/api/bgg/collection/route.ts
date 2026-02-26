import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchBGGCollection } from "@/lib/bgg";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const username = request.nextUrl.searchParams.get("username");

  if (!username || username.trim().length < 1) {
    return NextResponse.json({ error: "BGG username is required" }, { status: 400 });
  }

  try {
    const collection = await fetchBGGCollection(username.trim());
    return NextResponse.json({ collection, total: collection.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Collection fetch failed";
    console.error("BGG collection error:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
