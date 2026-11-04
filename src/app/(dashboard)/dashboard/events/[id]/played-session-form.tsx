"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface PlayedProposalOption {
  id: string;
  gameName: string;
}

export interface EventParticipantOption {
  id: string;
  name: string;
  kind: "user" | "guest";
}

interface PlayedSessionFormProps {
  eventId: string;
  proposals: PlayedProposalOption[];
  participants: EventParticipantOption[];
  defaultPlayedAt: string;
  onCancel: () => void;
  onCreated: () => void;
}

interface ResultFields {
  score: string;
  placement: string;
  isWinner: boolean;
}

function toLocalInputValue(iso: string) {
  const date = new Date(iso);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function PlayedSessionForm({ eventId, proposals, participants, defaultPlayedAt, onCancel, onCreated }: PlayedSessionFormProps) {
  const router = useRouter();
  const operationId = useRef(crypto.randomUUID());
  const [proposalId, setProposalId] = useState(proposals[0]?.id ?? "");
  const [playedAt, setPlayedAt] = useState(toLocalInputValue(defaultPlayedAt));
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set(participants.map((participant) => `${participant.kind}:${participant.id}`)));
  const [results, setResults] = useState<Record<string, ResultFields>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedParticipants = useMemo(
    () => participants.filter((participant) => selectedIds.has(`${participant.kind}:${participant.id}`)),
    [participants, selectedIds],
  );

  const updateResult = (key: string, values: Partial<ResultFields>) => {
    setResults((current) => ({ ...current, [key]: { ...(current[key] ?? { score: "", placement: "", isWinner: false }), ...values } }));
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedParticipants.length === 0) {
      setError("Wähle mindestens eine mitspielende Person aus.");
      return;
    }
    setSaving(true);
    setError(null);
    const data = selectedParticipants.map((participant) => {
      const key = `${participant.kind}:${participant.id}`;
      const result = results[key] ?? { score: "", placement: "", isWinner: false };
      return { participant, result };
    });
    try {
      const response = await fetch(`/api/events/${eventId}/played-sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proposalId,
          operationId: operationId.current,
          playedAt: new Date(playedAt).toISOString(),
          durationMinutes: durationMinutes ? Number(durationMinutes) : null,
          notes: notes.trim() || null,
          players: data.filter(({ participant }) => participant.kind === "user").map(({ participant, result }) => ({
            userId: participant.id, score: result.score === "" ? null : Number(result.score),
            placement: result.placement === "" ? null : Number(result.placement), isWinner: result.isWinner,
          })),
          guestPlayers: data.filter(({ participant }) => participant.kind === "guest").map(({ participant, result }) => ({
            guestId: participant.id, score: result.score === "" ? null : Number(result.score),
            placement: result.placement === "" ? null : Number(result.placement), isWinner: result.isWinner,
          })),
        }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Die Partie konnte nicht gespeichert werden.");
      router.refresh();
      onCreated();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Die Partie konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-border bg-muted/30 p-4" aria-label="Gespielte Partie erfassen">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="played-proposal">Gespieltes Spiel</Label>
          <select id="played-proposal" className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={proposalId} onChange={(event) => setProposalId(event.target.value)} required>
            {proposals.map((proposal) => <option key={proposal.id} value={proposal.id}>{proposal.gameName}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="played-at">Gespielt am</Label>
          <Input id="played-at" type="datetime-local" value={playedAt} onChange={(event) => setPlayedAt(event.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="played-duration">Dauer in Minuten</Label>
          <Input id="played-duration" type="number" min="1" max="1440" inputMode="numeric" value={durationMinutes} onChange={(event) => setDurationMinutes(event.target.value)} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="played-notes">Notizen</Label>
          <Textarea id="played-notes" maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} />
        </div>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold">Mitspielende und Ergebnisse</legend>
        <div className="space-y-2">
          {participants.map((participant) => {
            const key = `${participant.kind}:${participant.id}`;
            const selected = selectedIds.has(key);
            const result = results[key] ?? { score: "", placement: "", isWinner: false };
            return (
              <div key={key} className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-[minmax(0,1fr)_6rem_6rem_auto] sm:items-center">
                <label className="flex min-h-11 min-w-0 items-center gap-3 text-sm font-medium">
                  <input type="checkbox" className="h-4 w-4 accent-primary" checked={selected} onChange={(event) => setSelectedIds((current) => {
                    const next = new Set(current);
                    if (event.target.checked) next.add(key); else next.delete(key);
                    return next;
                  })} />
                  <span className="break-words">{participant.name}{participant.kind === "guest" ? " · Gast" : ""}</span>
                </label>
                {selected && <>
                  <Input aria-label={`Punkte für ${participant.name}`} type="number" inputMode="numeric" placeholder="Punkte" value={result.score} onChange={(event) => updateResult(key, { score: event.target.value })} />
                  <Input aria-label={`Platz für ${participant.name}`} type="number" min="1" inputMode="numeric" placeholder="Platz" value={result.placement} onChange={(event) => updateResult(key, { placement: event.target.value })} />
                  <label className="flex min-h-11 items-center gap-2 text-sm">
                    <input type="checkbox" aria-label={`Gewinner für ${participant.name}`} className="h-4 w-4 accent-primary" checked={result.isWinner} onChange={(event) => updateResult(key, { isWinner: event.target.checked })} />
                    Gewinner
                  </label>
                </>}
              </div>
            );
          })}
        </div>
      </fieldset>

      {error && <p role="alert" className="text-sm font-medium text-destructive">{error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" variant="outline" className="min-h-11" onClick={onCancel} disabled={saving}>Abbrechen</Button>
        <Button type="submit" className="min-h-11" disabled={saving || proposals.length === 0}>{saving ? "Wird gespeichert …" : "Partie speichern"}</Button>
      </div>
    </form>
  );
}
