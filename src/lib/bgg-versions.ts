import { fetchBggXml } from "@/lib/bgg-fetch";
import { BggCatalogError, validateItemsXml } from "@/lib/bgg-catalog";
import { decodeHtmlEntities, decodeXMLUrl, parseXMLValue } from "@/lib/bgg-xml";
import type { BGGGameVersion } from "@/lib/bgg-types";

export function isBggIdentifier(value: unknown): value is string {
  return typeof value === "string" && /^[1-9]\d{0,11}$/.test(value);
}

function attribute(tag: string, key: string): string | null {
  const match = tag.match(new RegExp(`\\s${key}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match ? decodeHtmlEntities(match[2]) : null;
}

function imageUrl(xml: string, tag: string): string | null {
  const value = decodeXMLUrl(parseXMLValue(xml, tag))?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname !== "cf.geekdo-images.com" || url.port || url.username || url.password || url.hash) return null;
    return value;
  } catch { return null; }
}

export function parseBggVersions(xml: string, bggId: string): BGGGameVersion[] {
  validateItemsXml(xml);
  const parent = xml.match(/<item\b[^>]*>/i)?.[0];
  if (!parent) throw new BggCatalogError(404, "Spiel auf BoardGameGeek nicht gefunden.");
  if (attribute(parent, "id") !== bggId || attribute(parent, "type") !== "boardgame") {
    throw new BggCatalogError(502, "BoardGameGeek hat Ausgaben zu einem anderen Spiel geliefert.");
  }
  const versions = xml.match(/<versions\b[^>]*>([\s\S]*?)<\/versions>/i)?.[1];
  if (!versions) return [];
  const result: BGGGameVersion[] = [];
  const seen = new Set<string>();
  for (const match of versions.matchAll(/(<item\b[^>]*>)([\s\S]*?)<\/item>/gi)) {
    if (attribute(match[1], "type") !== "boardgameversion") continue;
    const versionId = attribute(match[1], "id");
    const names = [...match[2].matchAll(/<name\b[^>]*\/?\s*>/gi)].map(m=>m[0]);
    const name = attribute(names.find(n=>attribute(n,"type")==="primary") ?? names[0] ?? "", "value");
    if (!isBggIdentifier(versionId) || !name?.trim() || seen.has(versionId)) {
      throw new BggCatalogError(502, "BoardGameGeek hat ungültige Ausgaben geliefert.");
    }
    seen.add(versionId);
    const links = [...match[2].matchAll(/<link\b[^>]*\/?\s*>/gi)].map(m=>m[0]);
    const values = (type: string) => links.filter(l=>attribute(l,"type")===type).map(l=>attribute(l,"value")).filter((v):v is string=>Boolean(v));
    const year = attribute(match[2].match(/<yearpublished\b[^>]*>/i)?.[0] ?? "", "value");
    result.push({
      versionId, name, languages: values("language"), publishers: values("boardgamepublisher"),
      yearPublished: year && /^\d{1,4}$/.test(year) ? Number(year) : null,
      imageUrl: imageUrl(match[2], "image"), thumbnailUrl: imageUrl(match[2], "thumbnail"),
    });
  }
  return result;
}

export async function getGermanBggVersions(bggId: string, signal?: AbortSignal): Promise<BGGGameVersion[]> {
  if (!isBggIdentifier(bggId)) throw new Error("Ungültige BGG-ID.");
  const xml = await fetchBggXml(`thing?id=${bggId}&versions=1`, signal);
  return parseBggVersions(xml, bggId).filter(version=>version.languages.some(language=>language.toLowerCase()==="german"));
}
