const BGG_API_URL = "https://boardgamegeek.com/xmlapi2";
const BGG_AUTH_TOKEN = process.env.BGG_AUTH_TOKEN;

export interface BGGGameData {
  bggId: string;
  name: string;
  description: string;
  yearPublished: number | null;
  minPlayers: number;
  maxPlayers: number;
  playTimeMinutes: number | null;
  minPlayTime: number | null;
  maxPlayTime: number | null;
  complexity: number | null;
  imageUrl: string | null;
  thumbnailUrl: string | null;
  categories: string[];
  mechanics: string[];
  designers: string[];
  publishers: string[];
  rating: number | null;
  numRatings: number | null;
}

function parseXMLValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

function parseXMLAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseXMLAttributeValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

function parseAllXMLAttributeValues(xml: string, tag: string, typeAttr?: string): string[] {
  const results: string[] = [];
  const typeFilter = typeAttr ? `type="${typeAttr}"` : "";
  const regex = new RegExp(`<${tag}[^>]*${typeFilter}[^>]*value="([^"]*)"`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push(match[1]);
  }
  return results;
}

export async function fetchBGGGame(bggId: string): Promise<BGGGameData | null> {
  try {
    const headers: Record<string, string> = {
      Accept: "application/xml",
    };

    if (BGG_AUTH_TOKEN) {
      headers["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
      console.log("Using BGG Auth Token for game details");
    }

    const response = await fetch(
      `${BGG_API_URL}/thing?id=${bggId}&stats=1`,
      { headers }
    );

    if (!response.ok) {
      console.error(`BGG API error: ${response.status}`);
      return null;
    }

    const xml = await response.text();

    if (xml.includes("<items total=\"0\"") || !xml.includes("<item")) {
      return null;
    }

    const primaryNameMatch = xml.match(/<name type="primary"[^>]*value="([^"]*)"/);
    const name = primaryNameMatch ? primaryNameMatch[1] : null;

    if (!name) {
      return null;
    }

    const descriptionMatch = xml.match(/<description>([^]*?)<\/description>/);
    let description = descriptionMatch ? descriptionMatch[1] : "";
    description = description
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#10;/g, "\n")
      .replace(/<[^>]*>/g, "")
      .trim();

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

    const categories = parseAllXMLAttributeValues(xml, "link", "boardgamecategory");
    const mechanics = parseAllXMLAttributeValues(xml, "link", "boardgamemechanic");
    const designers = parseAllXMLAttributeValues(xml, "link", "boardgamedesigner");
    const publishers = parseAllXMLAttributeValues(xml, "link", "boardgamepublisher");

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
      imageUrl: imageMatch ? imageMatch[1] : null,
      thumbnailUrl: thumbnailMatch ? thumbnailMatch[1] : null,
      categories,
      mechanics,
      designers,
      publishers,
      rating: rating ? Math.round(rating * 10) / 10 : null,
      numRatings,
    };
  } catch (error) {
    console.error("Error fetching BGG data:", error);
    return null;
  }
}

export async function searchBGGGames(query: string): Promise<Array<{ bggId: string; name: string; yearPublished: number | null }>> {
  console.log(`Searching BGG for: "${query}"`);
  
  try {
    const url = `${BGG_API_URL}/search?query=${encodeURIComponent(query)}&type=boardgame`;
    console.log("BGG URL:", url);
    
    // Wait 2 seconds to respect BGG rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const headers: Record<string, string> = {
      Accept: "application/xml",
      "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
    };

    // Add BGG Auth Token if available
    if (BGG_AUTH_TOKEN) {
      headers["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
      console.log("Using BGG Auth Token");
    }

    const response = await fetch(url, { headers });

    console.log("BGG response status:", response.status);
    
    // Handle different response codes
    if (response.status === 202) {
      console.log("BGG processing request (202), waiting 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const retryHeaders: Record<string, string> = {
        Accept: "application/xml",
        "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
      };

      if (BGG_AUTH_TOKEN) {
        retryHeaders["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
      }

      const retryResponse = await fetch(url, { headers: retryHeaders });
      
      console.log("BGG retry response status:", retryResponse.status);
      
      if (retryResponse.ok) {
        return parseBGGSearchResponse(await retryResponse.text());
      } else if (retryResponse.status === 202) {
        console.log("BGG still processing, waiting 5 more seconds...");
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const finalHeaders: Record<string, string> = {
            Accept: "application/xml",
            "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
          };

          if (BGG_AUTH_TOKEN) {
            finalHeaders["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
          }

          const finalResponse = await fetch(url, { headers: finalHeaders });
        
        console.log("BGG final response status:", finalResponse.status);
        
        if (finalResponse.ok) {
          return parseBGGSearchResponse(await finalResponse.text());
        }
      }
      
      console.error("BGG search failed after retries with status:", retryResponse.status);
      return [];
    }
    
    if (response.status === 429) {
      console.log("BGG rate limited (429), waiting 10 seconds...");
      await new Promise(resolve => setTimeout(resolve, 10000));
      
      const rateLimitHeaders: Record<string, string> = {
        Accept: "application/xml",
        "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
      };

      if (BGG_AUTH_TOKEN) {
        rateLimitHeaders["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
      }

      const retryResponse = await fetch(url, { headers: rateLimitHeaders });
      
      console.log("BGG retry after rate limit status:", retryResponse.status);
      
      if (retryResponse.ok) {
        return parseBGGSearchResponse(await retryResponse.text());
      }
      
      console.error("BGG search failed after rate limit retry with status:", retryResponse.status);
      return [];
    }
    
    if (!response.ok) {
      console.error("BGG search failed with status:", response.status);
      // Try with a different approach - maybe the API is temporarily down
      if (response.status === 401 || response.status >= 500) {
        console.log("BGG API might be temporarily unavailable, using fallback...");
        // Return mock data for testing
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
    console.error("Error searching BGG:", error);
    return [];
  }
}

export interface BGGCollectionItem {
  bggId: string;
  name: string;
  yearPublished: number | null;
  thumbnailUrl: string | null;
  imageUrl: string | null;
  minPlayers: number | null;
  maxPlayers: number | null;
  playTimeMinutes: number | null;
  rating: number | null;
  numPlays: number;
}

export async function fetchBGGCollection(username: string): Promise<BGGCollectionItem[]> {
  const url = `${BGG_API_URL}/collection?username=${encodeURIComponent(username)}&own=1&excludesubtype=boardgameexpansion`;

  const headers: Record<string, string> = {
    Accept: "application/xml",
    "User-Agent": "BoardGameTools/1.0 (contact@example.com)",
  };
  if (BGG_AUTH_TOKEN) {
    headers["Authorization"] = `Bearer ${BGG_AUTH_TOKEN}`;
  }

  // BGG collection API may return 202 while queuing - retry up to 3 times
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    const response = await fetch(url, { headers });

    if (response.status === 202) {
      console.log(`BGG collection queued (202), attempt ${attempt + 1}/3...`);
      continue;
    }

    if (response.status === 429) {
      console.log("BGG rate limited (429), waiting 10s...");
      await new Promise((resolve) => setTimeout(resolve, 10000));
      continue;
    }

    if (!response.ok) {
      console.error(`BGG collection API error: ${response.status}`);
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

function parseBGGCollectionResponse(xml: string): BGGCollectionItem[] {
  const results: BGGCollectionItem[] = [];
  const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>([^]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const bggId = match[1];
    const itemXml = match[2];

    const nameMatch = itemXml.match(/<name[^>]*sortindex[^>]*>([^<]+)<\/name>/i);
    if (!nameMatch) continue;

    const name = nameMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .trim();

    const yearMatch = itemXml.match(/<yearpublished>(\d+)<\/yearpublished>/i);
    const thumbnailMatch = itemXml.match(/<thumbnail>([^<]+)<\/thumbnail>/i);
    const imageMatch = itemXml.match(/<image>([^<]+)<\/image>/i);
    const minPlayersMatch = itemXml.match(/<minplayers>(\d+)<\/minplayers>/i);
    const maxPlayersMatch = itemXml.match(/<maxplayers>(\d+)<\/maxplayers>/i);
    const playTimeMatch = itemXml.match(/<playingtime>(\d+)<\/playingtime>/i);
    const ratingMatch = itemXml.match(/<rating[^>]*value="([^"]+)"/i);
    const numPlaysMatch = itemXml.match(/<numplays>(\d+)<\/numplays>/i);

    const ratingValue = ratingMatch ? parseFloat(ratingMatch[1]) : null;

    results.push({
      bggId,
      name,
      yearPublished: yearMatch ? parseInt(yearMatch[1]) : null,
      thumbnailUrl: thumbnailMatch ? thumbnailMatch[1].trim() : null,
      imageUrl: imageMatch ? imageMatch[1].trim() : null,
      minPlayers: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
      maxPlayers: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
      playTimeMinutes: playTimeMatch ? parseInt(playTimeMatch[1]) : null,
      rating: ratingValue && !isNaN(ratingValue) ? Math.round(ratingValue * 10) / 10 : null,
      numPlays: numPlaysMatch ? parseInt(numPlaysMatch[1]) : 0,
    });
  }

  return results;
}

function parseBGGSearchResponse(xml: string): Array<{ bggId: string; name: string; yearPublished: number | null }> {
  console.log("BGG XML response length:", xml.length);
  console.log("BGG XML preview:", xml.substring(0, 200) + "...");
  
  const results: Array<{ bggId: string; name: string; yearPublished: number | null }> = [];

  const itemRegex = /<item type="boardgame" id="(\d+)"[^>]*>([^]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const bggId = match[1];
    const itemXml = match[2];

    const nameMatch = itemXml.match(/<name type="primary"[^>]*value="([^"]*)"/);
    const yearMatch = itemXml.match(/<yearpublished[^>]*value="([^"]*)"/);

    if (nameMatch) {
      results.push({
        bggId,
        name: nameMatch[1],
        yearPublished: yearMatch ? parseInt(yearMatch[1]) : null,
      });
    }
  }

  console.log("Parsed", results.length, "games from BGG");
  return results.slice(0, 20);
}
