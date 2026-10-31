import { getEventCalendarDate, isDateOnlyPast, isDateTimePast } from "./event-date";

export type EventAction =
  | "join"
  | "proposeGame"
  | "voteGame"
  | "voteDate"
  | "manageDates"
  | "selectDate"
  | "resetDates"
  | "close";

export interface EventState {
  phase: "planning" | "open" | "closed" | "cancelled" | "past" | "unavailable";
  label: string;
  effectiveDate: string | null;
  dateKind: "provisional" | "date" | "datetime";
  evaluatedAt: string;
  available: Record<EventAction, boolean>;
  blockedReason: string | null;
}

export interface EventStateInput {
  status: string;
  eventDate: Date | string;
  selectedDate: Date | string | null;
  selectedGameId: string | null;
  winningProposalId: string | null;
  deletedAt: Date | string | null;
}

const noActions = (): Record<EventAction, boolean> => ({
  join: false,
  proposeGame: false,
  voteGame: false,
  voteDate: false,
  manageDates: false,
  selectDate: false,
  resetDates: false,
  close: false,
});

function safeDate(value: Date | string | null): Date | null {
  if (value === null) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizedStatus(status: string): "draft" | "planning" | "voting" | "closed" | "cancelled" | null {
  switch (status.trim().toLowerCase()) {
    case "planned": return "draft";
    case "open": return "voting";
    case "draft": return "draft";
    case "planning": return "planning";
    case "voting": return "voting";
    case "closed": return "closed";
    case "cancelled": return "cancelled";
    default: return null;
  }
}

function unavailableState(now: Date): EventState {
  return {
    phase: "unavailable",
    label: "Status nicht verfügbar",
    effectiveDate: null,
    dateKind: "datetime",
    evaluatedAt: Number.isNaN(now.getTime()) ? "" : now.toISOString(),
    available: noActions(),
    blockedReason: "Der Planungsstand ist nicht verfügbar.",
  };
}

export function evaluateEventState(event: EventStateInput, now: Date): EventState {
  if (Number.isNaN(now.getTime()) || event.deletedAt !== null) return unavailableState(now);

  const status = normalizedStatus(event.status);
  const eventDate = safeDate(event.eventDate);
  const selectedDate = safeDate(event.selectedDate);
  if (!status || !eventDate || (event.selectedDate !== null && !selectedDate)) return unavailableState(now);

  const dateKind: EventState["dateKind"] = selectedDate ? "date" : status === "draft" || status === "planning" ? "provisional" : "datetime";
  const effectiveDate = selectedDate
    ? selectedDate.toISOString().slice(0, 10)
    : dateKind === "provisional"
      ? getEventCalendarDate(eventDate)
      : eventDate.toISOString();

  if (status === "cancelled") {
    return {
      phase: "cancelled",
      label: "Abgesagt",
      effectiveDate,
      dateKind,
      evaluatedAt: now.toISOString(),
      available: noActions(),
      blockedReason: "Dieses Event wurde abgesagt.",
    };
  }

  if (status === "closed") {
    return {
      phase: "closed",
      label: "Abstimmung geschlossen",
      effectiveDate,
      dateKind,
      evaluatedAt: now.toISOString(),
      available: noActions(),
      blockedReason: "Die Abstimmung ist geschlossen.",
    };
  }

  const isPlanning = status === "draft" || status === "planning";
  const isPast = selectedDate
    ? isDateOnlyPast(selectedDate, now)
    : !isPlanning && isDateTimePast(eventDate, now);

  if (isPast) {
    return {
      phase: "past",
      label: "Termin vergangen",
      effectiveDate,
      dateKind,
      evaluatedAt: now.toISOString(),
      available: noActions(),
      blockedReason: "Der Termin ist bereits vergangen.",
    };
  }

  const hasSelectedGame = Boolean(event.selectedGameId || event.winningProposalId);
  const available: Record<EventAction, boolean> = {
    join: true,
    proposeGame: !hasSelectedGame,
    voteGame: !hasSelectedGame,
    voteDate: !selectedDate,
    manageDates: !selectedDate,
    selectDate: !selectedDate,
    resetDates: true,
    close: status === "voting" && !hasSelectedGame,
  };

  return {
    phase: isPlanning ? "planning" : "open",
    label: isPlanning ? "Termin wird abgestimmt" : "Abstimmung offen",
    effectiveDate,
    dateKind,
    evaluatedAt: now.toISOString(),
    available,
    blockedReason: null,
  };
}
