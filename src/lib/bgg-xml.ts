/** BGG XML parsing utilities */

import logger from "./logger";
import type { BGGCollectionItem, BGGSearchResult } from "./bgg-types";

export function decodeHtmlEntities(value: string | null | undefined): string | null {
  if (value == null) {
    return value ?? null;
  }

  return value
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;|&#x27;/gi, "'")
    .replace(/&#10;|&#x0a;/gi, "\n")
    .replace(/&#13;|&#x0d;/gi, "\r")
    .replace(/&nbsp;/gi, " ");
}

export function parseXMLValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : null;
}

export function parseXMLAttribute(xml: string, tag: string, attr: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*${attr}="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

export function parseXMLAttributeValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*value="([^"]*)"`, "i");
  const match = xml.match(regex);
  return match ? match[1] : null;
}

export function parseAllXMLAttributeValues(xml: string, tag: string, typeAttr?: string): string[] {
  const results: string[] = [];
  const typeFilter = typeAttr ? `type="${typeAttr}"` : "";
  const regex = new RegExp(`<${tag}[^>]*${typeFilter}[^>]*value="([^"]*)"`, "gi");
  let match;
  while ((match = regex.exec(xml)) !== null) {
    const decoded = decodeHtmlEntities(match[1]);
    results.push(decoded ?? match[1]);
  }
  return results;
}

export function parseBGGSearchResponse(xml: string): BGGSearchResult[] {
  logger.debug({ length: xml.length }, "BGG XML response");
  logger.debug({ preview: xml.substring(0, 200) }, "BGG XML preview");

  const results: BGGSearchResult[] = [];
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
        name: decodeHtmlEntities(nameMatch[1]) ?? nameMatch[1],
        yearPublished: yearMatch ? parseInt(yearMatch[1]) : null,
      });
    }
  }

  logger.info({ count: results.length }, "Parsed games from BGG");
  return results.slice(0, 20);
}

export function parseBGGCollectionResponse(xml: string): BGGCollectionItem[] {
  const results: BGGCollectionItem[] = [];
  const itemRegex = /<item[^>]*objectid="(\d+)"[^>]*>([^]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const bggId = match[1];
    const itemXml = match[2];

    const nameMatch = itemXml.match(/<name[^>]*sortindex[^>]*>([^<]+)<\/name>/i);
    if (!nameMatch) continue;

    const name = decodeHtmlEntities(nameMatch[1])?.trim();
    if (!name) continue;

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
      thumbnailUrl: thumbnailMatch ? (decodeHtmlEntities(thumbnailMatch[1])?.trim() ?? null) : null,
      imageUrl: imageMatch ? (decodeHtmlEntities(imageMatch[1])?.trim() ?? null) : null,
      minPlayers: minPlayersMatch ? parseInt(minPlayersMatch[1]) : null,
      maxPlayers: maxPlayersMatch ? parseInt(maxPlayersMatch[1]) : null,
      playTimeMinutes: playTimeMatch ? parseInt(playTimeMatch[1]) : null,
      rating: ratingValue && !isNaN(ratingValue) ? Math.round(ratingValue * 10) / 10 : null,
      numPlays: numPlaysMatch ? parseInt(numPlaysMatch[1]) : 0,
    });
  }

  return results;
}
