"use client";

import type { ProposalSort } from "@/lib/voting/types";

interface ProposalSortControlProps {
  value: ProposalSort;
  onChange: (value: ProposalSort) => void;
  id?: string;
}

export function ProposalSortControl({
  value,
  onChange,
  id = "proposal-sort",
}: ProposalSortControlProps) {
  return (
    <label className="flex min-h-11 w-full min-w-0 max-w-full flex-wrap items-center gap-2 text-sm font-medium text-foreground sm:w-auto">
      <span>Sortieren</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as ProposalSort)}
        className="min-h-11 w-full min-w-0 max-w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto"
      >
        <option value="votes">Meiste Stimmen</option>
        <option value="name">Name A–Z</option>
        <option value="newest">Neueste Vorschläge</option>
      </select>
    </label>
  );
}
