"use client";

import { useId } from "react";
import type { Availability } from "@/lib/events/date-availability";

const OPTIONS: ReadonlyArray<{ value: Availability; label: string }> = [
  { value: "yes", label: "Ja" },
  { value: "maybe", label: "Vielleicht" },
  { value: "no", label: "Nein" },
];

export interface DateAvailabilityGroupProps {
  idPrefix: string;
  dateProposalId: string;
  dateLabel: string;
  value: Availability | null;
  disabled: boolean;
  busy: boolean;
  onChange: (value: Availability) => void;
}

export function DateAvailabilityGroup({
  idPrefix,
  dateProposalId,
  dateLabel,
  value,
  disabled,
  busy,
  onChange,
}: DateAvailabilityGroupProps) {
  const reactId = useId();
  const name = `${idPrefix}-${dateProposalId}`;

  return (
    <fieldset
      className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3"
      disabled={disabled}
      aria-busy={busy}
      aria-disabled={disabled || busy}
      data-testid={`date-availability-group-${dateProposalId}`}
    >
      <legend className="sr-only">{dateLabel}</legend>
      {OPTIONS.map(({ value: option, label }) => {
        const id = `${reactId}-${option}`;
        return (
          <label
            key={option}
            htmlFor={id}
            className="inline-flex min-h-11 min-w-11 flex-wrap cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground [overflow-wrap:anywhere] transition-colors hover:bg-muted focus-within:border-ring focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:font-medium has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60"
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={option}
              checked={value === option}
              disabled={disabled}
              aria-disabled={busy || undefined}
              onChange={() => {
                if (!disabled && !busy) onChange(option);
              }}
              className="h-4 w-4 shrink-0 accent-primary"
            />
              <span className="min-w-0 [overflow-wrap:anywhere]">{label}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
