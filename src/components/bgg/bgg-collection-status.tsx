"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Loader2, CircleCheck, CircleX } from "lucide-react";
import type { BggCollectionMatch } from "./use-bgg-collection-presence";

export function BggCollectionStatus({status, match, retry, hideAbsent = false}: {status: "loading" | "ready" | "error"; match?: BggCollectionMatch | null; retry?: () => void; hideAbsent?: boolean}) {
  if (status === "loading") return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true"/>Sammlung wird geprüft…</p>;
  if (status === "error") return <div role="alert" className="flex flex-wrap items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"><CircleX className="h-4 w-4" aria-hidden="true"/>Sammlung konnte nicht geprüft werden. Import erst nach erneuter Prüfung möglich.<Button variant="outline" size="sm" className="min-h-11" onClick={retry}>Erneut prüfen</Button></div>;
  if (match) return <p role="status" className="flex flex-wrap items-center gap-2 rounded-md border border-primary/25 bg-primary/5 p-3 text-sm"><CircleCheck className="h-4 w-4 text-primary" aria-hidden="true"/>Bereits in deiner Sammlung: <Link className="font-medium text-primary underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`/dashboard/games/${match.id}`}>{match.name}</Link></p>;
  return hideAbsent ? null : <p role="status" className="text-sm text-muted-foreground">Noch nicht in deiner Sammlung.</p>;
}
