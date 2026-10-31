import { decodeHTMLStrict } from "entities";

const MAX_ENTITY_LAYERS = 8;

/** Converts game text to stable plain text without interpreting it as markup. */
export function normalizeGameText(input: string): string {
  let text = input;

  for (let level = 0; level < MAX_ENTITY_LAYERS; level += 1) {
    const next = decodeHTMLStrict(text).replaceAll("\u00a0", " ");
    if (next === text) return text;
    text = next;
  }

  if (decodeHTMLStrict(text) !== text) {
    throw new RangeError("Zu viele verschachtelte HTML-Kodierungen.");
  }
  return text;
}

/** Best-effort read adapter for legacy rows that exceed the accepted depth. */
export function gameTextForRead(input: string): string {
  try {
    return normalizeGameText(input);
  } catch (error) {
    if (error instanceof RangeError) return input;
    throw error;
  }
}

export function normalizeGameNameInput(input: string): string {
  assertRawGameTextLength(input, 2_000, "Name");
  const normalized = normalizeGameText(input);
  if (normalized.length > 200) throw new RangeError("Name darf maximal 200 Zeichen lang sein.");
  return normalized;
}

export function normalizeGameDescriptionInput(input: string): string {
  assertRawGameTextLength(input, 16_000, "Beschreibung");
  const normalized = normalizeGameText(input);
  if (normalized.length > 2_000) throw new RangeError("Beschreibung darf maximal 2000 Zeichen lang sein.");
  return normalized;
}

function assertRawGameTextLength(input: string, max: number, label: string): void {
  if (input.length > max) throw new RangeError(`${label} darf vor der Normalisierung maximal ${max} Zeichen lang sein.`);
}
