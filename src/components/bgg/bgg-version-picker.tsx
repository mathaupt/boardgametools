"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { Gamepad2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { BGGGameVersion } from "@/lib/bgg-types";

interface BggVersionPickerProps {
  bggId: string;
  value: string | null;
  onChange: (value: BGGGameVersion | null) => void;
  disabled?: boolean;
}

type EditionState = { bggId: string; status: "loading" | "ready" | "error"; versions: BGGGameVersion[]; error?: string };

function EditionCover({ src }: { src: string | null }) {
  const [failed, setFailed] = useState(false);
  return src && !failed
    ? <Image src={src} alt="" width={48} height={64} className="h-[64px] w-[48px] shrink-0 object-contain" onError={()=>setFailed(true)} />
    : <span className="flex h-[64px] w-[48px] shrink-0 items-center justify-center bg-muted text-muted-foreground" aria-hidden="true"><Gamepad2 className="h-6 w-6" /></span>;
}

export function BggVersionPicker({ bggId, value, onChange, disabled = false }: BggVersionPickerProps) {
  const groupId = useId();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<EditionState>({ bggId, status: "loading", versions: [] });
  const current: EditionState = state.bggId === bggId ? state : { bggId, status: "loading", versions: [] };

  useEffect(() => {
    const controller = new AbortController();
    setState({ bggId, status: "loading", versions: [] });
    void (async () => {
      try {
        const response = await fetch(`/api/bgg/${encodeURIComponent(bggId)}/versions`, { signal: controller.signal });
        if (!response.ok) {
          const data = await response.json().catch(()=>null) as {error?:string} | null;
          throw new Error(data?.error ?? "Deutsche Ausgaben konnten nicht geladen werden.");
        }
        const versions = await response.json() as BGGGameVersion[];
        if (!controller.signal.aborted) setState({ bggId, status: "ready", versions });
      } catch (error) {
        if (!controller.signal.aborted) setState({ bggId, status: "error", versions: [], error: error instanceof Error ? error.message : "Verbindungsfehler." });
      }
    })();
    return ()=>controller.abort();
  }, [bggId, attempt]);

  const selected = current.versions.find(version=>version.versionId === value);
  const labelClass = "grid grid-cols-[auto_minmax(0,1fr)] min-h-11 min-w-0 cursor-pointer items-center gap-2 p-2 sm:p-3 focus-within:outline-2 focus-within:outline-offset-[-2px] focus-within:outline-ring";
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-3">
      <legend className="mb-2 text-base font-semibold text-foreground">Ausgabe wählen</legend>
      <p className="text-sm text-muted-foreground">Eine deutsche Ausgabe bestimmt das Cover. Spieltitel und Beschreibung werden unverändert von BGG übernommen.</p>
      <div className="divide-y divide-border overflow-hidden rounded-lg border border-border">
        <label className={cn(labelClass, value === null ? "bg-secondary text-secondary-foreground" : "bg-background text-foreground")}>
          <input type="radio" name={groupId} checked={value === null} onChange={()=>onChange(null)} className="h-5 w-5 shrink-0 accent-primary" />
          <span className="min-w-0 text-sm font-medium [overflow-wrap:anywhere]">Standardausgabe (BGG-Hauptcover)</span>
        </label>
        {current.versions.map(version=>(
          <label key={version.versionId} className={cn(labelClass, "sm:grid-cols-[auto_auto_minmax(0,1fr)]", value === version.versionId ? "bg-secondary text-secondary-foreground" : "bg-background text-foreground")}>
            <input type="radio" name={groupId} checked={value === version.versionId} onChange={()=>onChange(version)} className="row-span-2 h-5 w-5 shrink-0 accent-primary sm:row-span-1" />
            <EditionCover key={`${version.versionId}:${version.imageUrl}`} src={version.thumbnailUrl ?? version.imageUrl} />
            <span className="col-start-2 min-w-0 text-sm [overflow-wrap:anywhere] sm:col-start-3">
              <span className="block font-medium">{version.name}</span>
              <span className="block">{[version.languages.join(", "), version.yearPublished, version.publishers.join(", ")].filter(Boolean).join(" · ")}</span>
            </span>
          </label>
        ))}
      </div>
      {current.status === "loading" && <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Deutsche Ausgaben werden geladen…</p>}
      {current.status === "ready" && current.versions.length === 0 && <p role="status" className="text-sm text-muted-foreground">Keine deutsche Ausgabe bei BGG hinterlegt. Du kannst die Standardausgabe importieren.</p>}
      {current.status === "error" && <div className="space-y-2"><p role="alert" className="text-sm text-destructive">{current.error} Der Standardimport ist weiterhin möglich.</p><Button type="button" variant="outline" className="min-h-11" onClick={()=>setAttempt(v=>v+1)}>Erneut versuchen</Button></div>}
      {selected && !selected.imageUrl && !selected.thumbnailUrl && <p className="text-sm text-muted-foreground">Für diese Ausgabe ist kein Cover hinterlegt. Das BGG-Hauptcover wird verwendet.</p>}
    </fieldset>
  );
}
