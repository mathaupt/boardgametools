import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SessionsPagination({
  page,
  total,
  pageSize,
}: {
  page: number;
  total: number;
  pageSize: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const through = Math.min(page * pageSize, total);

  return (
    <nav aria-label="Seitennavigation der Sessions" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
      <div className="text-sm text-muted-foreground" aria-live="polite">
        <span className="font-medium text-foreground">Seite {page} von {totalPages}</span>
        <span className="mx-2" aria-hidden="true">·</span>
        <span>{from}–{through} von {total} Sessions</span>
      </div>
      <div className="flex flex-col items-stretch gap-2 min-[24rem]:flex-row min-[24rem]:items-center sm:justify-end">
        {page <= 1 ? (
          <Button type="button" variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28" disabled aria-label="Vorherige Seite">
            <ChevronLeft aria-hidden="true" /> Zurück
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28">
            <Link href={`/dashboard/sessions?page=${page - 1}`} aria-label="Vorherige Seite"><ChevronLeft aria-hidden="true" /> Zurück</Link>
          </Button>
        )}
        {page >= totalPages ? (
          <Button type="button" variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28" disabled aria-label="Nächste Seite">
            Weiter <ChevronRight aria-hidden="true" />
          </Button>
        ) : (
          <Button asChild variant="outline" className="min-h-11 w-full min-w-0 min-[24rem]:w-auto min-[24rem]:min-w-28">
            <Link href={`/dashboard/sessions?page=${page + 1}`} aria-label="Nächste Seite">Weiter <ChevronRight aria-hidden="true" /></Link>
          </Button>
        )}
      </div>
    </nav>
  );
}
