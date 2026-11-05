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

/** Applies the event's existing Europe/Berlin wall-clock time to a selected calendar date. */
export function combineEventDateWithStartTime(dateOnly: Date | string, timeSource: Date | string): Date | null {
  const targetDate = asDate(dateOnly);
  const sourceDate = asDate(timeSource);
  const dateKey = targetDate ? getDateOnlyKey(targetDate) : null;
  if (!dateKey || !sourceDate) return null;

  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: EVENT_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(sourceDate);
  const wallTime = Object.fromEntries(timeParts.map(({ type, value }) => [type, value]));
  const [year, month, day] = dateKey.split("-").map(Number);
  const hour = Number(wallTime.hour);
  const minute = Number(wallTime.minute);
  const wantedLocalTimestamp = Date.UTC(year, month - 1, day, hour, minute);
  let candidate = new Date(wantedLocalTimestamp);

  // Resolve the target wall-clock time against the event timezone, including DST changes.
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: EVENT_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);
    const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
    const representedLocalTimestamp = Date.UTC(
      Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute),
    );
    const adjustment = wantedLocalTimestamp - representedLocalTimestamp;
    if (adjustment === 0) return candidate;
    candidate = new Date(candidate.getTime() + adjustment);
  }

  return candidate;
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
