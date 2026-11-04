"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Flag, Users } from "lucide-react";

type Challenge = { id: string; title: string; kind: string; target: number; startsAt: string; endsAt: string | null; current: number; completed: boolean; joined: boolean };

export function GroupChallengesSection({ groupId, canCreate }: { groupId: string; canCreate: boolean }) {
  const [items, setItems] = useState<Challenge[]>([]);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"sessions" | "games">("sessions");
  const [target, setTarget] = useState(10);
  const [endsAt, setEndsAt] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const response = await fetch(`/api/groups/${groupId}/challenges`, { cache: "no-store" });
    if (!response.ok) throw new Error("Gruppenziele konnten nicht geladen werden.");
    setItems(await response.json() as Challenge[]);
  }, [groupId]);
  useEffect(() => { void load().catch(() => setMessage("Gruppenziele konnten nicht geladen werden.")); }, [load]);

  async function act(challenge: Challenge, method: "POST" | "DELETE") {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/groups/${groupId}/challenges/${challenge.id}/participation`, { method });
      if (!response.ok) throw new Error();
      await load();
      setMessage(method === "POST" ? "Du nimmst jetzt am gemeinsamen Ziel teil." : "Deine Teilnahme wurde beendet. Der bisherige Fortschritt bleibt erhalten.");
    } catch { setMessage("Änderung konnte nicht gespeichert werden."); }
    finally { setBusy(false); }
  }

  async function create(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/groups/${groupId}/challenges`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, kind, target, ...(endsAt ? { endsAt: new Date(`${endsAt}T23:59:59`).toISOString() } : {}) }) });
      if (!response.ok) throw new Error();
      setTitle(""); await load(); setMessage("Gemeinsames Ziel erstellt. Jede Person entscheidet selbst, ob sie mitmacht.");
    } catch { setMessage("Ziel konnte nicht erstellt werden."); }
    finally { setBusy(false); }
  }

  return <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="group-challenges-title">
    <header className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Flag className="size-5" aria-hidden="true" /></span><div><h2 id="group-challenges-title" className="text-xl font-semibold">Gemeinsame Ziele</h2><p className="mt-1 text-sm text-muted-foreground">Nur die gemeinsame Summe ist sichtbar. Deine Teilnahme bleibt freiwillig; während deiner Teilnahme erfasste Sessions zählen zum Gruppenfortschritt.</p></div></header>
    {canCreate && <form onSubmit={create} className="mt-5 grid gap-3 rounded-lg bg-muted/40 p-4 sm:grid-cols-[1fr_9rem_8rem_10rem_auto] sm:items-end">
      <div><label className="mb-1 block text-sm font-medium" htmlFor={`challenge-title-${groupId}`}>Zielname</label><input id={`challenge-title-${groupId}`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={80} required className="h-11 w-full rounded-md border bg-background px-3" placeholder="Zum Beispiel Frühlingsspielzeit" /></div>
      <div><label className="mb-1 block text-sm font-medium" htmlFor={`challenge-kind-${groupId}`}>Zieltyp</label><select id={`challenge-kind-${groupId}`} value={kind} onChange={(event) => { const next = event.target.value as "sessions" | "games"; setKind(next); setTarget(next === "sessions" ? 10 : 5); }} className="h-11 w-full rounded-md border bg-background px-2"><option value="sessions">Sessions</option><option value="games">verschiedene Spiele</option></select></div>
      <div><label className="mb-1 block text-sm font-medium" htmlFor={`challenge-target-${groupId}`}>Zielgröße ({kind === "sessions" ? "Sessions" : "Spiele"})</label><select id={`challenge-target-${groupId}`} value={target} onChange={(event) => setTarget(Number(event.target.value))} className="h-11 w-full rounded-md border bg-background px-2">{(kind === "sessions" ? [10, 25] : [5, 10]).map((number) => <option key={number} value={number}>{number}</option>)}</select></div>
      <div><label className="mb-1 block text-sm font-medium" htmlFor={`challenge-end-${groupId}`}>Enddatum (optional)</label><input id={`challenge-end-${groupId}`} type="date" value={endsAt} onChange={(event) => setEndsAt(event.target.value)} className="h-11 w-full rounded-md border bg-background px-2" /></div>
      <button type="submit" disabled={busy || !title.trim()} className="min-h-11 rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50">Ziel erstellen</button>
    </form>}
    {items.length === 0 ? <p className="mt-5 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Noch gibt es kein gemeinsames Ziel in dieser Gruppe.</p> : <ul className="mt-5 divide-y divide-border">{items.map((item) => <li key={item.id} className="py-5 first:pt-0 last:pb-0"><div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{item.title}</h3><p className="mt-1 text-sm text-muted-foreground">{item.kind === "games" ? "Verschiedene Spiele" : "Gemeinsame Sessions"} · Ziel {item.target}{item.endsAt ? ` · bis ${new Date(item.endsAt).toLocaleDateString("de-DE")}` : " · ohne Enddatum"}</p></div><span className="inline-flex items-center gap-1 text-sm text-muted-foreground"><Users className="size-4" aria-hidden="true"/>Gemeinsamer Fortschritt</span></div><div className="mt-3 flex items-center gap-3"><progress className="h-2 min-w-0 flex-1 accent-primary" value={item.current} max={item.target} aria-label={`Fortschritt ${item.title}`} /><span className="shrink-0 text-sm tabular-nums">{item.current} / {item.target}</span></div><div className="mt-3">{item.joined ? <button type="button" disabled={busy} onClick={() => { if (window.confirm("Wenn du aufhörst, zählen künftige Sessions nicht mehr zu diesem Ziel. Dein bisheriger Beitrag bleibt in der gemeinsamen Summe enthalten. Teilnahme beenden?")) void act(item, "DELETE"); }} className="min-h-11 rounded-md border px-3 text-sm font-medium">Teilnahme beenden</button> : <button type="button" disabled={busy || item.completed} onClick={() => void act(item, "POST")} className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-sm font-medium disabled:opacity-50">{item.completed ? <CheckCircle2 className="size-4" aria-hidden="true"/> : null}{item.completed ? "Ziel erreicht" : "Freiwillig mitmachen"}</button>}</div></li>)}</ul>}
    {message && <p role="status" className="mt-3 text-sm text-muted-foreground">{message}</p>}
  </section>;
}
