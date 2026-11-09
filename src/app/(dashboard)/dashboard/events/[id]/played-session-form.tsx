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
  const [sourceType, setSourceType] = useState<"proposal" | "collection" | "bgg">(proposals.length ? "proposal" : "collection");
  const [selectedGame, setSelectedGame] = useState<{ id: string; name: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; name: string }[]>([]);
  const [searchCompleted, setSearchCompleted] = useState(false);
  const [searching, setSearching] = useState(false);
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

  const searchGames = async () => {
    const query = searchQuery.trim();
    if (query.length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const endpoint = sourceType === "collection"
        ? `/api/games?page=1&limit=8&q=${encodeURIComponent(query)}`
        : `/api/bgg/search?q=${encodeURIComponent(query)}`;
      const response = await fetch(endpoint);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Die Suche ist fehlgeschlagen.");
      const rows = sourceType === "collection" ? body.data ?? [] : body;
      setSearchResults(rows.map((game: { id?: string; bggId?: string; name: string }) => ({ id: sourceType === "collection" ? game.id! : game.bggId!, name: game.name })));
      setSelectedGame(null);
      setSearchCompleted(true);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "Die Suche ist fehlgeschlagen.");
      setSearchResults([]);
      setSearchCompleted(false);
    } finally {
      setSearching(false);
    }
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
          source: sourceType === "proposal"
            ? { type: "proposal", proposalId: selectedGame?.id ?? proposals[0]?.id }
            : sourceType === "collection"
              ? { type: "collection", collectionGameId: selectedGame?.id }
              : { type: "bgg", bggId: selectedGame?.id },
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
          <Label htmlFor="played-source">Spielquelle</Label>
          <select id="played-source" className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={sourceType} onChange={(event) => { setSourceType(event.target.value as typeof sourceType); setSelectedGame(null); setSearchResults([]); setSearchCompleted(false); }}>
            {proposals.length > 0 && <option value="proposal">Eventspiele</option>}
            <option value="collection">Meine Sammlung</option><option value="bgg">BoardGameGeek</option>
          </select>
          {sourceType === "proposal" ? (
            <select aria-label="Gespieltes Eventspiel" className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedGame?.id ?? proposals[0]?.id ?? ""} onChange={(event) => setSelectedGame({ id: event.target.value, name: proposals.find((proposal) => proposal.id === event.target.value)?.gameName ?? "" })} required>
              {proposals.map((proposal) => <option key={proposal.id} value={proposal.id}>{proposal.gameName}</option>)}
            </select>
          ) : <div className="space-y-2">
            <div className="flex gap-2"><Input aria-label={sourceType === "collection" ? "Sammlung durchsuchen" : "BoardGameGeek durchsuchen"} value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); setSearchCompleted(false); setSearchResults([]); setSelectedGame(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void searchGames(); } }} placeholder="Mindestens 2 Zeichen" />
              <Button type="button" variant="outline" className="min-h-11 shrink-0" disabled={searching || searchQuery.trim().length < 2} onClick={() => void searchGames()}>{searching ? "Sucht …" : "Suchen"}</Button>
            </div>
            {searchResults.length > 0 && <select aria-label="Suchergebnis auswählen" className="min-h-11 w-full rounded-md border border-input bg-background px-3 text-sm" value={selectedGame?.id ?? ""} onChange={(event) => setSelectedGame(searchResults.find((game) => game.id === event.target.value) ?? null)}><option value="">Spiel auswählen</option>{searchResults.map((game) => <option key={game.id} value={game.id}>{game.name}</option>)}</select>}
            {searchCompleted && searchResults.length === 0 && <p role="status" className="text-sm text-muted-foreground">Keine Spiele gefunden. Prüfe den Suchbegriff oder versuche es erneut.</p>}
            {selectedGame && <p role="status" className="text-sm text-muted-foreground">Ausgewählt: {selectedGame.name}</p>}
          </div>}
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
        <Button type="submit" className="min-h-11" disabled={saving || (sourceType !== "proposal" && !selectedGame)}>{saving ? "Wird gespeichert …" : "Partie speichern"}</Button>
      </div>
    </form>
  );
}
