import { NextRequest, NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/require-auth";
import { withApiLogging } from "@/lib/api-logger";
import { checkRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import logger from "@/lib/logger";
import { Errors } from "@/lib/error-messages";
import { env } from "@/lib/env";

// Max response size from BGG API (2 MB) to prevent memory exhaustion
const MAX_BGG_RESPONSE_SIZE = 2 * 1024 * 1024;
// Max query length
const MAX_QUERY_LENGTH = 200;

/** Fetch from BGG with timeout and response size validation. */
async function fetchBGG(url: string): Promise<string> {
  const headers: Record<string, string> = { 
    "User-Agent": "BoardGameTools/1.0", 
    Accept: "application/xml" 
  };
  
  // Add BGG authentication token if available
  if (env.BGG_AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${env.BGG_AUTH_TOKEN}`;
  }
  
  const response = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    logger.error({ status: response.status, statusText: response.statusText, url }, "BGG API Error");
    throw new Error("BGG API Error");
  }
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength, 10) > MAX_BGG_RESPONSE_SIZE) {
    throw new Error("BGG API response too large");
  }
  return response.text();
}

interface BGGGameDetail {
  name: string;
  description: string;
  yearPublished: string;
  minPlayers: string;
  maxPlayers: string;
  playTimeMinutes: string;
  complexity: string;
  imageUrl: string;
  rating: string;
  rank: string;
  bggId?: string;
}

interface BGGSearchResult {
  bggId: string;
  name: string;
  yearPublished: string;
  type: string;
  imageUrl?: string;
}

export const GET = withApiLogging(async function GET(request: NextRequest) {
  await requireAuth();

  // Rate limiting: 20 requests per minute per IP
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const { allowed, retryAfterMs } = checkRateLimit(`bgg:${ip}`, 20, 60_000);
  if (!allowed) return rateLimitResponse(retryAfterMs);

  const { searchParams } = new URL(request.url);
  const bggId = searchParams.get("bggId");
  const query = searchParams.get("query");

  try {
    if (bggId) {
      // Validiere bggId (nur Ziffern erlaubt → SSRF-Schutz)
      if (!/^\d+$/.test(bggId)) {
        return NextResponse.json({ error: Errors.INVALID_BGG_ID }, { status: 400 });
      }

      // Spezifisches Spiel von BGG abrufen
      const xmlText = await fetchBGG(`https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`);
      
      // Einfache XML Parsing ohne externe Libraries
      const parseXML = (xml: string) => {
        const result: Partial<BGGGameDetail> = {};
        
        // Simple regex parsing für BGG XML
        const nameMatch = xml.match(/<name[^>]*value="([^"]*)"/);
        const descriptionMatch = xml.match(/<description[^>]*>([^<]*)<\/description>/);
        const yearMatch = xml.match(/<yearpublished[^>]*value="([^"]*)"/);
        const minPlayersMatch = xml.match(/<minplayers[^>]*value="([^"]*)"/);
        const maxPlayersMatch = xml.match(/<maxplayers[^>]*value="([^"]*)"/);
        const playTimeMatch = xml.match(/<playingtime[^>]*value="([^"]*)"/);
        const complexityMatch = xml.match(/<averageweight[^>]*value="([^"]*)"/);
        const imageMatch = xml.match(/<image[^>]*>([^<]*)<\/image>/);
        const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"/);
        const rankMatch = xml.match(/<rank[^>]*value="([^"]*)"/);
        
        result.name = nameMatch ? nameMatch[1] : "";
        result.description = descriptionMatch ? descriptionMatch[1].substring(0, 500) : "";
        result.yearPublished = yearMatch ? yearMatch[1] : "";
        result.minPlayers = minPlayersMatch ? minPlayersMatch[1] : "";
        result.maxPlayers = maxPlayersMatch ? maxPlayersMatch[1] : "";
        result.playTimeMinutes = playTimeMatch ? playTimeMatch[1] : "";
        result.complexity = complexityMatch ? complexityMatch[1] : "";
        result.imageUrl = imageMatch ? imageMatch[1] : "";
        result.rating = ratingMatch ? ratingMatch[1] : "";
        result.rank = rankMatch ? rankMatch[1] : "";
        
        return result;
      };

      const game = parseXML(xmlText);
      game.bggId = bggId;

      if (!game.name) {
        return NextResponse.json({ error: Errors.GAME_NOT_FOUND_BGG }, { status: 404 });
      }

      return NextResponse.json(game);
    } else if (query) {
      // Input-Validierung: Laenge begrenzen (DoS-Schutz)
      if (query.length > MAX_QUERY_LENGTH) {
        return NextResponse.json({ error: Errors.QUERY_MAX_LENGTH }, { status: 400 });
      }
      if (query.length < 2) {
        return NextResponse.json({ error: Errors.QUERY_MIN_LENGTH }, { status: 400 });
      }

      // Suche nach Spielen mit korrektem query Parameter
      const xmlText = await fetchBGG(`https://boardgamegeek.com/xmlapi2/search?type=boardgame&query=${encodeURIComponent(query)}`);
      
      // Einfache XML Parsing für Search Results
      const parseSearchXML = (xml: string) => {
        const games: BGGSearchResult[] = [];
        
        // Remove all newlines and extra spaces to make parsing easier
        const cleanXml = xml.replace(/\s+/g, ' ').trim();
        
        // Find all item blocks using a more robust approach
        const itemBlocks = cleanXml.match(/<item[^>]*>.*?<\/item>/g);
        
        if (itemBlocks) {
          for (const itemBlock of itemBlocks) {
            // Extract bggId and type from item block
            const idMatch = itemBlock.match(/id="([^"]*)"/);
            const typeMatch = itemBlock.match(/type="([^"]*)"/);
            const nameMatch = itemBlock.match(/<name[^>]*value="([^"]*)"/) || 
                             itemBlock.match(/<name[^>]*>([^<]*)<\/name>/);
            const yearMatch = itemBlock.match(/<yearpublished[^>]*value="([^"]*)"/);
            
            const bggId = idMatch ? idMatch[1] : '';
            const type = typeMatch ? typeMatch[1] : 'boardgame';
            const name = nameMatch ? nameMatch[1] : '';
            const yearPublished = yearMatch ? yearMatch[1] : '';
            
            if (bggId && name) {
              games.push({
                bggId,
                name,
                yearPublished,
                type
              });
            }
          }
        }
        
        return games;
      };

      const games = parseSearchXML(xmlText);

      // Batch-fetch thumbnails for top results (single API call)
      if (games.length > 0) {
        const ids = games.slice(0, 20).map((g: BGGSearchResult) => g.bggId).filter((id) => /^\d+$/.test(id)).join(",");
        try {
          const thumbXml = await fetchBGG(
            `https://boardgamegeek.com/xmlapi2/thing?id=${ids}`
          );
          if (thumbXml) {
            // Parse thumbnail URLs per item
            const itemRegex = /<item[^>]*id="(\d+)"[^>]*>[\s\S]*?<\/item>/g;
            let match;
            const thumbMap: Record<string, string> = {};
            while ((match = itemRegex.exec(thumbXml)) !== null) {
              const itemId = match[1];
              const thumbMatch = match[0].match(/<thumbnail[^>]*>([^<]*)<\/thumbnail>/);
              const imgMatch = match[0].match(/<image[^>]*>([^<]*)<\/image>/);
              const url = thumbMatch?.[1] || imgMatch?.[1];
              if (url) thumbMap[itemId] = url;
            }
            for (const game of games) {
              if (thumbMap[game.bggId]) {
                game.imageUrl = thumbMap[game.bggId];
              }
            }
          }
        } catch (thumbErr) {
          // Thumbnails are optional – don't fail the search
          logger.warn({ err: thumbErr }, "Failed to fetch BGG thumbnails");
        }
      }

      return NextResponse.json(games);
    } else {
      return NextResponse.json({ error: "Missing query parameter" }, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
});
