import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { searchBGGGames, fetchBGGGame } from "@/lib/bgg";

interface UPCItemDBResponse {
  code: string;
  total: number;
  items: Array<{
    ean: string;
    title: string;
    brand: string;
    category: string;
    description: string;
  }>;
}

function cleanProductName(title: string, brand: string): string {
  let name = title;

  // Remove common product code patterns like "Kosmos 692865 - "
  name = name.replace(/^[\w\s]+ \d{4,} [-–] /i, "");

  // Remove brand prefix if it appears at the start
  if (brand && name.toLowerCase().startsWith(brand.toLowerCase())) {
    name = name.slice(brand.length).replace(/^[\s\-–:]+/, "");
  }

  // Remove trailing noise like ", Nip" or ", Partyspiel Toys/spielzeu"
  name = name.replace(/,\s*(Nip|New|Neu|OVP|Sealed)$/i, "");
  name = name.replace(/\s+(Toys\/\w+|Partyspiel\s+\w+)$/i, "");

  // Remove edition/language markers
  name = name.replace(/\s*\[german\]\.?$/i, "");
  name = name.replace(/\s*\(german\s*(edition|version)?\)$/i, "");

  return name.trim();
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ean = request.nextUrl.searchParams.get("ean");
  if (!ean || ean.length < 8) {
    return NextResponse.json({ error: "Valid EAN/UPC barcode required" }, { status: 400 });
  }

  try {
    // Step 1: Check local DB for a game with this EAN
    const localGame = await prisma.game.findFirst({
      where: { ean, ownerId: session.user.id },
    });

    if (localGame) {
      return NextResponse.json({
        source: "local",
        ean,
        localGame,
        bggResults: [],
      });
    }

    // Step 2: Lookup EAN via UPCitemdb (free, no key needed)
    let productName = "";
    let productBrand = "";

    try {
      const upcRes = await fetch(
        `https://api.upcitemdb.com/prod/trial/lookup?upc=${encodeURIComponent(ean)}`,
        {
          headers: { Accept: "application/json" },
        }
      );

      if (upcRes.ok) {
        const upcData: UPCItemDBResponse = await upcRes.json();
        if (upcData.total > 0 && upcData.items[0]) {
          productName = upcData.items[0].title;
          productBrand = upcData.items[0].brand || "";
        }
      }
    } catch {
      // UPCitemdb unavailable, continue without product name
    }

    if (!productName) {
      return NextResponse.json({
        source: "not_found",
        ean,
        localGame: null,
        productName: null,
        bggResults: [],
      });
    }

    // Step 3: Clean product name and search BGG
    const cleanedName = cleanProductName(productName, productBrand);

    const bggResults = await searchBGGGames(cleanedName);

    return NextResponse.json({
      source: "upcitemdb",
      ean,
      localGame: null,
      productName,
      cleanedName,
      brand: productBrand,
      bggResults: bggResults.slice(0, 10),
    });
  } catch (error) {
    console.error("Barcode lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
