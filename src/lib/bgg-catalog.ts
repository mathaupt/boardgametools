import { normalizeGameDescriptionInput, normalizeGameNameInput } from "@/lib/game-text";
import {
  decodeHtmlEntities,
  decodeXMLUrl,
  parseAllXMLAttributeValues,
  parseBGGSearchResponse,
  parseXMLAttributeValue,
  parseXMLValue,
} from "@/lib/bgg-xml";
import type { BGGGameData } from "@/lib/bgg-types";
import { BggTransportError, fetchBggXml } from "@/lib/bgg-fetch";

export interface BggCatalogItem {
  bggId: string;
  name: string;
  yearPublished: number | null;
  imageUrl: string | null;
}

export class BggCatalogError extends Error {
  constructor(public readonly status: 404 | 502 | 503 | 504, message: string) {
    super(message);
    this.name = "BggCatalogError";
  }
}

function validateItemsXml(xml: string): void {
  const trimmed = xml.trim();
  if (!/^<\?xml\b[^>]*\?>\s*/i.test(trimmed) && !/^<items\b/i.test(trimmed)) {
    throw new BggCatalogError(502, "BoardGameGeek hat eine unverständliche Antwort geliefert.");
  }
  if (!/<items\b[^>]*>[\s\S]*<\/items>\s*$/i.test(trimmed) || /<errors?\b/i.test(trimmed)) {
    throw new BggCatalogError(502, "BoardGameGeek hat eine unvollständige Antwort geliefert.");
  }
  const tokenPattern = /<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|<\/?[A-Za-z_][\w:.-]*(?:\s+(?:[^"'<>]|"[^"]*"|'[^']*')*)?\s*\/?>/g;
  const tokens = trimmed.match(tokenPattern) ?? [];
  if (trimmed.replace(tokenPattern, "").includes("<")) {
    throw new BggCatalogError(502, "BoardGameGeek hat fehlerhaftes XML geliefert.");
  }
  const stack: string[] = [];
  for (const token of tokens) {
    if (token.startsWith("<!--") || token.startsWith("<?") || token.startsWith("<![CDATA[")) continue;
    const closing = token.match(/^<\/([\w:.-]+)/);
    if (closing) {
      if (stack.pop() !== closing[1]) throw new BggCatalogError(502, "BoardGameGeek hat fehlerhaftes XML geliefert.");
      continue;
    }
    if (!token.endsWith("/>")) {
      const name = token.match(/^<([\w:.-]+)/)?.[1];
      if (!name) throw new BggCatalogError(502, "BoardGameGeek hat fehlerhaftes XML geliefert.");
      stack.push(name);
    }
  }
  if (stack.length) throw new BggCatalogError(502, "BoardGameGeek hat fehlerhaftes XML geliefert.");
}

function mapTransportError(error: unknown): never {
  if (error instanceof BggCatalogError) throw error;
  if (error instanceof BggTransportError) throw new BggCatalogError(error.status, error.message);
  throw new BggCatalogError(503, "BoardGameGeek ist vorübergehend nicht erreichbar.");
}

export async function searchBggCatalog(query: string, signal?: AbortSignal): Promise<BggCatalogItem[]> {
  try {
    const xml = await fetchBggXml(`search?type=boardgame&query=${encodeURIComponent(query)}`, signal);
    validateItemsXml(xml);
    const parsed = parseBGGSearchResponse(xml);
    const declaredItems = xml.match(/<item\b[^>]*type="boardgame"/gi)?.length ?? 0;
    if (parsed.length !== Math.min(declaredItems, 20)) {
      throw new BggCatalogError(502, "BoardGameGeek hat unvollständige Suchtreffer geliefert.");
    }
    return parsed.slice(0, 20).map((item) => {
      const name = normalizeGameNameInput(item.name);
      if (!/^\d{1,12}$/.test(item.bggId) || !name.trim()) {
        throw new BggCatalogError(502, "BoardGameGeek hat ungültige Suchtreffer geliefert.");
      }
      return {
        bggId: item.bggId,
        name,
        yearPublished: Number.isFinite(item.yearPublished) ? item.yearPublished : null,
        imageUrl: null,
      };
    });
  } catch (error) {
    return mapTransportError(error);
  }
}

function numeric(xml: string, tag: string): number | null {
  const value = parseXMLAttributeValue(xml, tag);
  if (!value || !/^\d+(?:\.\d+)?$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function getBggCatalogDetail(bggId: string, signal?: AbortSignal): Promise<BGGGameData> {
  try {
    const xml = await fetchBggXml(`thing?id=${encodeURIComponent(bggId)}&stats=1`, signal);
    validateItemsXml(xml);
    const itemMatch = xml.match(/<item\b[^>]*>([\s\S]*?)<\/item>/i);
    if (!itemMatch) throw new BggCatalogError(404, "Spiel auf BoardGameGeek nicht gefunden.");
    const itemXml = itemMatch[1];
    const rawName = decodeHtmlEntities(parseXMLAttributeValue(itemXml, "name"));
    const name = rawName ? normalizeGameNameInput(rawName) : null;
    if (!name) throw new BggCatalogError(404, "Spiel auf BoardGameGeek nicht gefunden.");

    const rawDescription = decodeHtmlEntities(parseXMLValue(itemXml, "description")) ?? "";
    const description = normalizeGameDescriptionInput(
      rawDescription.replace(/<\/?(?:p|br|div|li|ul|ol|h[1-6])\b[^>]*>/gi, "\n").replace(/<[^>]*>/g, "").slice(0, 2_000),
    );
    const value = (tag: string) => numeric(itemXml, tag);
    const averageWeight = value("averageweight");
    const rating = value("average");
    const image = decodeXMLUrl(parseXMLValue(itemXml, "image"));
    const thumbnail = decodeXMLUrl(parseXMLValue(itemXml, "thumbnail"));
    return {
      bggId,
      name,
      description,
      yearPublished: value("yearpublished"),
      minPlayers: value("minplayers") ?? 1,
      maxPlayers: value("maxplayers") ?? 4,
      playTimeMinutes: value("playingtime"),
      minPlayTime: value("minplaytime"),
      maxPlayTime: value("maxplaytime"),
      complexity: averageWeight === null ? null : Math.round(averageWeight * 10) / 10,
      imageUrl: image && /^https?:\/\//i.test(image) ? image : null,
      thumbnailUrl: thumbnail && /^https?:\/\//i.test(thumbnail) ? thumbnail : null,
      categories: parseAllXMLAttributeValues(itemXml, "link", "boardgamecategory"),
      mechanics: parseAllXMLAttributeValues(itemXml, "link", "boardgamemechanic"),
      designers: parseAllXMLAttributeValues(itemXml, "link", "boardgamedesigner"),
      publishers: parseAllXMLAttributeValues(itemXml, "link", "boardgamepublisher"),
      rating: rating === null ? null : Math.round(rating * 10) / 10,
      numRatings: value("usersrated"),
    };
  } catch (error) {
    return mapTransportError(error);
  }
}
