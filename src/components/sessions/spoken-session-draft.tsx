"use client";

import { useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SpeechInput } from "@/components/speech/speech-input";
import { parseSessionDraft, type SessionDraft } from "@/lib/speech/session-draft";

interface Props {
  games: { id: string; name: string | null }[];
  users: { id: string; name: string | null }[];
  onApply: (draft: SessionDraft) => void;
  disabled?: boolean;
}
export function SpokenSessionDraft({ games, users, onApply, disabled }: Props) {
  const id = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [previewText, setPreviewText] = useState<string | null>(null);
  const draft = previewText === null ? null : parseSessionDraft(previewText, { games, users });
  function change(value: string) { setText(value); setPreviewText(null); }
  function discard() { change(""); inputRef.current?.focus(); }
  return <section aria-labelledby={`${id}-title`} className="min-w-0 space-y-3 rounded-lg border border-border bg-secondary/30 p-4">
    <h2 id={`${id}-title`} className="text-lg font-semibold">Session aus Worten vorbereiten</h2>
    <p className="text-sm text-muted-foreground">Beschreibe die Partie, zum Beispiel „Azul mit Anna und Ben, 90 Minuten“. Prüfe den Entwurf und ergänze offene Angaben im Formular.</p>
    <Label htmlFor={id}>Session beschreiben</Label>
    <Textarea ref={inputRef} id={id} value={text} maxLength={2000} disabled={disabled} onChange={(event) => change(event.target.value)} aria-describedby={`${id}-hint`} />
    <p id={`${id}-hint`} className="text-sm text-muted-foreground">Die Übernahme ersetzt Spiel, Mitspielende und Dauer. Gespeichert wird erst mit „Session speichern“.</p>
    <div className="flex flex-wrap items-start gap-3">
      <SpeechInput label="Session diktieren" disabled={disabled} onAccept={change} />
      <Button type="button" variant="outline" className="min-h-11 h-auto whitespace-normal" disabled={disabled || !text.trim()} onClick={() => setPreviewText(text)}>Entwurf prüfen</Button>
      <Button type="button" variant="ghost" className="min-h-11 h-auto whitespace-normal" disabled={disabled || !text} onClick={discard}>Entwurf verwerfen</Button>
    </div>
    {draft && <div className="min-w-0 space-y-3 border-t border-border pt-3" role="region" aria-label="Session-Entwurf">
      <p role="status" className="text-sm font-medium [overflow-wrap:anywhere]">{[
        games.find((game) => game.id === draft.gameId)?.name ?? "Spiel offen",
        draft.userIds.map((id) => users.find((user) => user.id === id)?.name).join(", ") || "Mitspielende offen",
        draft.durationMinutes === null ? "Dauer offen" : `${draft.durationMinutes} Minuten`,
      ].join(" · ")}</p>
      {draft.issues.length > 0 && <ul className="list-disc space-y-1 pl-5 text-sm [overflow-wrap:anywhere]">{draft.issues.map((issue, index) => <li key={index}>{issue}</li>)}</ul>}
      <Button type="button" className="min-h-11 h-auto whitespace-normal" disabled={disabled} onClick={() => { onApply(draft); discard(); }}>Ins Formular übernehmen</Button>
    </div>}
  </section>;
}
