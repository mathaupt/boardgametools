import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import prisma from "@/lib/db";
import { searchBGGGames, fetchBGGGame } from "@/lib/bgg";
import { withApiLogging } from "@/lib/api-logger";
import logger from "@/lib/logger";

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

// Known board game publishers/brands to strip from product names
const KNOWN_PUBLISHERS = [
  "Kosmos", "Ravensburger", "Schmidt Spiele", "Schmidt", "Hans im Glück",
  "Hasbro", "Mattel", "Asmodee", "Fantasy Flight", "Days of Wonder",
  "Queen Games", "Pegasus Spiele", "Pegasus", "Amigo", "AMIGO Spiel",
  "AMIGO", "Zoch", "HABA", "Lookout Spiele", "Lookout", "Feuerland",
  "Feuerland Spiele", "Czech Games Edition", "CGE", "Repos Production",
  "Space Cowboys", "CMON", "Stonemaier Games", "Stonemaier",
  "Rio Grande Games", "Rio Grande", "Z-Man Games", "Z-Man",
  "Gamewright", "Thames & Kosmos", "Thames and Kosmos",
  "Matagot", "Libellud", "Iello", "Blue Orange", "Huch!",
  "Huch", "Heidelberger", "Heidelberger Spieleverlag",
  "alea", "Franckh-Kosmos", "FranckH-Kosmos",
];

function cleanProductName(title: string, brand: string): string {
  let name = title;

  // Remove common product code patterns like "Kosmos 692865 - " or "FKS6888120 "
  name = name.replace(/^[A-Z]{2,5}\d{5,}\s+/i, "");
  name = name.replace(/^[\w\s]+ \d{4,} [-–] /i, "");

  // Remove brand/publisher prefix if it appears at the start (case-insensitive)
  const allBrands = brand ? [brand, ...KNOWN_PUBLISHERS] : KNOWN_PUBLISHERS;
  for (const pub of allBrands) {
    const regex = new RegExp(`^${pub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\s\\-–:,]+`, "i");
    name = name.replace(regex, "");
  }

  // Remove publisher/brand anywhere in the string surrounded by separators
  for (const pub of KNOWN_PUBLISHERS) {
    const escaped = pub.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Remove " - Kosmos" or ", Kosmos" at the end
    name = name.replace(new RegExp(`[\\s,\\-–]+${escaped}\\s*$`, "i"), "");
    // Remove "Kosmos - " at the start (already handled above, but just in case)
    name = name.replace(new RegExp(`^${escaped}[\\s\\-–:]+`, "i"), "");
  }

  // Remove article numbers / SKU patterns like "(692865)" or "[FKS123]"
  name = name.replace(/\s*[\(\[]\w{2,5}\d{4,}[\)\]]/g, "");
  name = name.replace(/\s+\d{5,}\b/g, "");

  // Remove trailing noise like ", Nip" or ", New" or ", OVP"
  name = name.replace(/,\s*(Nip|New|Neu|OVP|Sealed|Toys\/\w+)$/i, "");
  name = name.replace(/\s+(Toys\/\w+|Partyspiel\s+\w+)$/i, "");

  // Remove edition/language markers
  name = name.replace(/\s*\[german\]\.?$/i, "");
  name = name.replace(/\s*\((german|deutsch)\s*(edition|version|ausgabe)?\)$/i, "");
  name = name.replace(/\s*[-–]\s*(german|deutsch)\s*(edition|version|ausgabe)?$/i, "");
  name = name.replace(/\s*\((EN|DE|FR|IT|ES|NL)\)$/i, "");

  // Remove "Brettspiel" / "Kartenspiel" / "Gesellschaftsspiel" suffix
  name = name.replace(/\s*[-–]?\s*(Brett|Karten|Gesellschafts|Würfel|Party)spiel\s*$/i, "");

  // Remove parenthetical qualifiers like (Kinderspiel), (Spiel des Jahres), (Familienspiel)
  name = name.replace(/\s*\([^)]*(?:spiel|edition|version|ausgabe|jubiläum|jahr)[^)]*\)/gi, "");

  // Final cleanup: collapse multiple spaces, trim dashes at edges
  name = name.replace(/\s{2,}/g, " ").replace(/^[\s\-–:]+|[\s\-–:]+$/g, "");

  return name.trim();
}

export const GET = withApiLogging(async function GET(request: NextRequest) {
  const { userId } = await requireAuth();

  const ean = request.nextUrl.searchParams.get("ean");
  if (!ean || ean.length < 8) {
    return NextResponse.json({ error: "Valid EAN/UPC barcode required" }, { status: 400 });
  }

  try {
    // Step 1: Check local DB for a game with this EAN
    const localGame = await prisma.game.findFirst({
      where: { ean, ownerId: userId, deletedAt: null },
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
    logger.debug({ ean, productName, productBrand, cleanedName }, "Barcode lookup result");

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
    logger.error({ err: error }, "Barcode lookup error");
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
});
