import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { gameListQueryToSearchParams, type GameListQuery } from "@/lib/game-list-query";

interface GamesPaginationProps {
  page: number;
  totalPages: number;
  total: number;
  query: GameListQuery;
}

export function GamesPagination({ page, totalPages, total, query }: GamesPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * query.limit + 1;
  const through = Math.min(page * query.limit, total);
  const href = (targetPage: number) => {
    const params = gameListQueryToSearchParams(query, targetPage).toString();
    return params ? `/dashboard/games?${params}` : "/dashboard/games";
  };
  const previousDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <nav aria-label="Seitennavigation der Spielesammlung" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-medium text-foreground">Seite {page} von {Math.max(totalPages, 1)}</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>{from}–{through} von {total} Spielen</span>
      </div>
      <div className="flex flex-col items-stretch gap-2 min-[24rem]:flex-row min-[24rem]:items-center sm:justify-end">
        {previousDisabled ? (
          <Button type="button" variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28" disabled aria-label="Vorherige Seite">
            <ChevronLeft aria-hidden="true" /> Zurück
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28">
            <Link href={href(page - 1)} aria-label="Vorherige Seite"><ChevronLeft aria-hidden="true" /> Zurück</Link>
          </Button>
        )}
        {nextDisabled ? (
          <Button type="button" variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28" disabled aria-label="Nächste Seite">
            Weiter <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28">
            <Link href={href(page + 1)} aria-label="Nächste Seite">Weiter <ChevronRight aria-hidden="true" /></Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
