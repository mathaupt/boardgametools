"use client";

import Image from "next/image";
import { Gamepad2, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BggCatalogItem } from "@/lib/bgg-catalog";

interface BggSearchResultsProps {
  results: BggCatalogItem[];
  detailLoadingId: string | null;
  onShowDetails: (result: BggCatalogItem, trigger: HTMLButtonElement) => void;
}

export function BggSearchResults({ results, detailLoadingId, onShowDetails }: BggSearchResultsProps) {
  return (
    <ul className="max-h-[400px] min-w-0 space-y-2 overflow-y-auto pr-1" aria-label="Suchergebnisse">
      {results.map((result) => (
        <li key={result.bggId} className="flex min-w-0 flex-wrap items-center gap-3 rounded-lg border border-border/60 bg-background/80 px-3 py-2">
          {result.imageUrl ? (
            <Image src={result.imageUrl} alt="" width={40} height={40} className="shrink-0 rounded object-cover" />
          ) : (
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-muted/40" aria-hidden="true">
              <Gamepad2 className="h-5 w-5 text-muted-foreground" />
            </span>
          )}
          <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
            <span className="block font-medium text-sm text-foreground">{result.name}</span>
            <span className="block text-xs text-muted-foreground">
              {result.yearPublished ? `(${result.yearPublished}) ` : ""}BGG #{result.bggId}
            </span>
          </span>
          <Button
            type="button"
            variant="outline"
            className="min-h-11 min-w-11 shrink-0"
            onClick={(event) => onShowDetails(result, event.currentTarget)}
            disabled={detailLoadingId !== null}
            aria-label={`Details zu ${result.name}`}
          >
            {detailLoadingId === result.bggId ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Search className="mr-2 h-4 w-4" aria-hidden="true" />}
            Details
          </Button>
        </li>
      ))}
    </ul>
  );
}
