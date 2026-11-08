"use client";

import { useId, useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useSpeechInput } from "./use-speech-input";

interface SpeechInputProps {
  label: string;
  onAccept: (text: string) => void;
  maxLength?: number;
  disabled?: boolean;
}

export function SpeechInput({ label, onAccept, maxLength = 2000, disabled = false }: SpeechInputProps) {
  const id = useId();
  const [expanded, setExpanded] = useState(false);
  const speech = useSpeechInput(maxLength);
  function close() { speech.cancel(); setExpanded(false); }
  if (speech.supported === false) return <p className="text-sm text-muted-foreground">Spracheingabe wird hier nicht unterstützt. Bitte den Text eintippen.</p>;
  return (
    <div className="min-w-0 space-y-2">
      <Button type="button" variant="outline" className="min-h-11 max-w-full whitespace-normal" disabled={disabled || speech.supported === null || speech.recording} aria-expanded={expanded} aria-controls={id} onClick={() => setExpanded(true)}>
        <Mic className="size-4" aria-hidden="true" />{label}
      </Button>
      {expanded && <div id={id} className="min-w-0 space-y-3 rounded-md border border-border bg-muted/30 p-3">
        <p className="text-sm text-muted-foreground">Dein Browser kann Audio an seinen Spracherkennungsdienst übertragen. BoardGameTools speichert keine Aufnahme. Du kannst den Text auch jederzeit eintippen.</p>
        {!speech.recording && !speech.hasResult && <Button type="button" variant="outline" className="min-h-11 h-auto whitespace-normal" disabled={disabled} onClick={speech.start}>Zustimmen und Aufnahme starten</Button>}
        {speech.recording && <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11 h-auto whitespace-normal" onClick={speech.stop}>Aufnahme beenden</Button>
          <Button type="button" variant="outline" className="min-h-11 h-auto whitespace-normal" onClick={close}>Aufnahme abbrechen</Button>
        </div>}
        <p role="status" className="text-sm text-foreground">{speech.recording ? "Mikrofon aktiv. Sprich jetzt." : speech.message}</p>
        {!speech.recording && speech.hasResult && <>
          <Label htmlFor={`${id}-text`}>Erkannter Text</Label>
          <Textarea id={`${id}-text`} value={speech.text} maxLength={maxLength} onChange={(event) => speech.setText(event.target.value)} />
          <Button type="button" className="min-h-11 h-auto whitespace-normal" disabled={disabled || !speech.text.trim()} onClick={() => { onAccept(speech.text.trim()); close(); }}>Text übernehmen</Button>
        </>}
        {!speech.recording && <Button type="button" variant="ghost" className="min-h-11" onClick={close}>Verwerfen</Button>}
      </div>}
    </div>
  );
}
