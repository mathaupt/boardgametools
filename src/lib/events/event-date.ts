export const EVENT_TIME_ZONE = "Europe/Berlin";

function asDate(value: Date | string): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Calendar date in the event operating zone. */
export function getEventCalendarDate(value: Date | string): string | null {
  const date = asDate(value);
  if (!date) return null;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: EVENT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

/** DateProposal.date is stored at UTC midnight; keep its stored calendar day stable. */
export function getDateOnlyKey(value: Date | string): string | null {
  const date = asDate(value);
  return date ? date.toISOString().slice(0, 10) : null;
}

export function isDateOnlyPast(value: Date | string, now: Date): boolean {
  const selectedKey = getDateOnlyKey(value);
  const todayKey = getEventCalendarDate(now);
  return !selectedKey || !todayKey || todayKey > selectedKey;
}

export function isDateTimePast(value: Date | string, now: Date): boolean {
  const date = asDate(value);
  return !date || Number.isNaN(now.getTime()) || now.getTime() >= date.getTime();
}

export function formatEventDate(
  value: Date | string,
  kind: "provisional" | "date" | "datetime",
  locale = "de-DE"
): string {
  const date = asDate(value);
  if (!date) return "Datum nicht verfügbar";
  const dateOnly = kind === "date" || kind === "provisional";
  return new Intl.DateTimeFormat(locale, {
    timeZone: dateOnly ? "UTC" : EVENT_TIME_ZONE,
    dateStyle: "long",
    ...(dateOnly ? {} : { timeStyle: "short" as const }),
  }).format(date);
}
