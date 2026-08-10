const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

const longDateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

const shortMonthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "short",
});

const monthYearFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

const shortDateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const dateWithShortMonthFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortDateWithWeekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "short",
  day: "2-digit",
  month: "short",
});

const fullDateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const longDateWithWeekdayFormatter = new Intl.DateTimeFormat("de-DE", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("de-DE", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: Date | string | number): string {
  return dateFormatter.format(new Date(date));
}

export function formatLongDate(date: Date | string | number): string {
  return longDateFormatter.format(new Date(date));
}

export function formatShortMonth(date: Date | string | number): string {
  return shortMonthFormatter.format(new Date(date));
}

export function formatMonthYear(date: Date | string | number): string {
  return monthYearFormatter.format(new Date(date));
}

export function formatShortDateTime(date: Date | string | number): string {
  return shortDateTimeFormatter.format(new Date(date));
}

export function formatDateWithShortMonth(date: Date | string | number): string {
  return dateWithShortMonthFormatter.format(new Date(date));
}

export function formatFullDateTime(date: Date | string | number): string {
  return fullDateTimeFormatter.format(new Date(date));
}

export function formatShortDateWithWeekday(date: Date | string | number): string {
  return shortDateWithWeekdayFormatter.format(new Date(date));
}

export function formatLongDateWithWeekday(date: Date | string | number): string {
  return longDateWithWeekdayFormatter.format(new Date(date));
}

export function formatTime(date: Date | string | number): string {
  return timeFormatter.format(new Date(date));
}

export function formatYear(date: Date | string | number): string {
  return new Date(date).getFullYear().toString();
}
