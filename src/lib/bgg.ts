import logger from "./logger";
import { env } from "@/lib/env";
import {
  decodeHtmlEntities,
  parseXMLAttributeValue,
  parseAllXMLAttributeValues,
  parseBGGSearchResponse,
  parseBGGCollectionResponse,
} from "./bgg-xml";
import type { BGGGameData, BGGCollectionItem, BGGSearchResult } from "./bgg-types";

// Re-export types for consumers
export type { BGGGameData, BGGCollectionItem, BGGSearchResult };

const BGG_API_URL = "https://boardgamegeek.com/xmlapi2";
const BGG_AUTH_TOKEN = env.BGG_AUTH_TOKEN;

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/xml",
    "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
  };
  if (BGG_AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
  }
  return headers;
}

export async function fetchBGGGame(bggId: string): Promise<BGGGameData | null> {
  try {
    const response = await fetch(`${BGG_API_URL}/thing?id=${bggId}&stats=1`, {
      headers: buildHeaders(),
    });

    if (!response.ok) {
      logger.error({ status: response.status }, "BGG API error");
      return null;
    }

    const xml = await response.text();

    if (xml.includes("<items total=\"0\"") || !xml.includes("<item")) {
      return null;
    }

    const primaryNameMatch = xml.match(/<name type="primary"[^>]*value="([^"]*)"/);
    const name = decodeHtmlEntities(primaryNameMatch ? primaryNameMatch[1] : null);
    if (!name) return null;

    const descriptionMatch = xml.match(/<description>([^]*?)<\/description>/);
    let description = decodeHtmlEntities(descriptionMatch ? descriptionMatch[1] : "") ?? "";
    description = description.replace(/<[^>]*>/g, "").trim();

    const yearPublished = parseXMLAttributeValue(xml, "yearpublished");
    const minPlayers = parseXMLAttributeValue(xml, "minplayers");
    const maxPlayers = parseXMLAttributeValue(xml, "maxplayers");
    const playingTime = parseXMLAttributeValue(xml, "playingtime");
    const minPlayTime = parseXMLAttributeValue(xml, "minplaytime");
    const maxPlayTime = parseXMLAttributeValue(xml, "maxplaytime");

    const imageMatch = xml.match(/<image>([^<]*)<\/image>/);
    const thumbnailMatch = xml.match(/<thumbnail>([^<]*)<\/thumbnail>/);

    const averageWeightMatch = xml.match(/<averageweight[^>]*value="([^"]*)"/);
    const complexity = averageWeightMatch ? parseFloat(averageWeightMatch[1]) : null;

    const ratingMatch = xml.match(/<average[^>]*value="([^"]*)"/);
    const rating = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    const numRatingsMatch = xml.match(/<usersrated[^>]*value="([^"]*)"/);
    const numRatings = numRatingsMatch ? parseInt(numRatingsMatch[1]) : null;

    const decodeArray = (values: string[]) => values.map((v) => decodeHtmlEntities(v) ?? v);

    return {
      bggId,
      name,
      description: description.substring(0, 2000),
      yearPublished: yearPublished ? parseInt(yearPublished) : null,
      minPlayers: minPlayers ? parseInt(minPlayers) : 1,
      maxPlayers: maxPlayers ? parseInt(maxPlayers) : 4,
      playTimeMinutes: playingTime ? parseInt(playingTime) : null,
      minPlayTime: minPlayTime ? parseInt(minPlayTime) : null,
      maxPlayTime: maxPlayTime ? parseInt(maxPlayTime) : null,
      complexity: complexity ? Math.round(complexity * 10) / 10 : null,
      imageUrl: imageMatch ? decodeHtmlEntities(imageMatch[1]) : null,
      thumbnailUrl: thumbnailMatch ? decodeHtmlEntities(thumbnailMatch[1]) : null,
      categories: decodeArray(parseAllXMLAttributeValues(xml, "link", "boardgamecategory")),
      mechanics: decodeArray(parseAllXMLAttributeValues(xml, "link", "boardgamemechanic")),
      designers: decodeArray(parseAllXMLAttributeValues(xml, "link", "boardgamedesigner")),
      publishers: decodeArray(parseAllXMLAttributeValues(xml, "link", "boardgamepublisher")),
      rating: rating ? Math.round(rating * 10) / 10 : null,
      numRatings,
    };
  } catch (error) {
    logger.error({ err: error }, "Error fetching BGG data");
    return null;
  }
}

export async function searchBGGGames(query: string): Promise<BGGSearchResult[]> {
  logger.debug({ query }, `Searching BGG for: "${query}"`);

  try {
    const url = `${BGG_API_URL}/search?query=${encodeURIComponent(query)}&type=boardgame`;
    logger.debug({ url }, "BGG search URL");

    // Wait 2 seconds to respect BGG rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));

    const headers = buildHeaders();
    const response = await fetch(url, { headers });

    logger.debug({ status: response.status }, "BGG response status");

    // Handle 202 (queued)
    if (response.status === 202) {
      logger.info("BGG processing request (202), waiting 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));

      const retryResponse = await fetch(url, { headers: buildHeaders() });
      logger.debug({ status: retryResponse.status }, "BGG retry response status");

      if (retryResponse.ok) {
        return parseBGGSearchResponse(await retryResponse.text());
      } else if (retryResponse.status === 202) {
        logger.info("BGG still processing, waiting 5 more seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));

        const finalResponse = await fetch(url, { headers: buildHeaders() });
        logger.debug({ status: finalResponse.status }, "BGG final response status");

        if (finalResponse.ok) {
          return parseBGGSearchResponse(await finalResponse.text());
        }
      }

      logger.error({ status: retryResponse.status }, "BGG search failed after retries");
      return [];
    }

    // Handle 429 (rate limited)
    if (response.status === 429) {
      logger.info("BGG rate limited (429), waiting 10 seconds...");
      await new Promise(resolve => setTimeout(resolve, 10000));

      const retryResponse = await fetch(url, { headers: buildHeaders() });
      logger.debug({ status: retryResponse.status }, "BGG retry after rate limit status");

      if (retryResponse.ok) {
        return parseBGGSearchResponse(await retryResponse.text());
      }

      logger.error({ status: retryResponse.status }, "BGG search failed after rate limit retry");
      return [];
    }

    if (!response.ok) {
      logger.error({ status: response.status }, "BGG search failed");
      // Fallback for temporary API unavailability
      if (response.status === 401 || response.status >= 500) {
        logger.info("BGG API might be temporarily unavailable, using fallback");
        return [
          { bggId: "13", name: "Catan", yearPublished: 1995 },
          { bggId: "823", name: "The Settlers of Catan: Seafarers", yearPublished: 1997 },
          { bggId: "150", name: "The Settlers of Catan: Cities & Knights", yearPublished: 1998 },
        ];
      }
      return [];
    }

    return parseBGGSearchResponse(await response.text());
  } catch (error) {
    logger.error({ err: error }, "Error searching BGG");
    return [];
  }
}

export async function fetchBGGCollection(username: string): Promise<BGGCollectionItem[]> {
  const url = `${BGG_API_URL}/collection?username=${encodeURIComponent(username)}&own=1&excludesubtype=boardgameexpansion`;

  // BGG collection API may return 202 while queuing - retry up to 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    const response = await fetch(url, { headers: buildHeaders() });

    if (response.status === 202) {
      logger.info(`BGG collection queued (202), attempt ${attempt + 1}/3`);
      continue;
    }

    if (response.status === 429) {
      logger.info("BGG rate limited (429), waiting 10s");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }

    if (!response.ok) {
      logger.error({ status: response.status }, "BGG collection API error");
      throw new Error(`BGG API returned ${response.status}`);
    }

    const xml = await response.text();

    if (xml.includes('errors') || xml.includes('<error>')) {
      const msgMatch = xml.match(/<message>([^<]*)<\/message>/i);
      throw new Error(msgMatch ? msgMatch[1] : "BGG returned an error");
    }

    return parseBGGCollectionResponse(xml);
  }

  throw new Error("BGG collection request timed out after retries");
}
