"use client";

import { useEffect, useState } from "react";
import { Award, CalendarDays, Compass, Gamepad2, LibraryBig, Sparkles, Table2, type LucideIcon } from "lucide-react";
import { BADGES } from "@/lib/gamification/badges";

interface PublicProfile {
  name: string;
  badges: Array<{ id: string; title: string; description: string; altText: string; icon: string }>;
  totals: { sessions: number; gamesPlayed: number; seriesCompleted: number };
}

const badgeIcons: Record<string, LucideIcon> = { spark: Sparkles, table: Table2, calendar: CalendarDays, compass: Compass, collection: Gamepad2, series: LibraryBig };

export function PublicProfileClient() {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "error">("loading");

  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (!token) { setState("unavailable"); return; }
    void fetch("/api/public/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({ token }),
    }).then(async (response) => {
      if (response.status === 404) { setState("unavailable"); return; }
      if (response.status === 429) { setState("error"); return; }
      if (!response.ok) throw new Error("Profil konnte nicht geladen werden.");
      setProfile(await response.json() as PublicProfile);
      setState("ready");
    }).catch(() => setState("error"));
  }, []);

  return <main className="min-h-screen bg-background px-4 py-12 text-foreground sm:py-16">
    <div className="mx-auto max-w-3xl space-y-8">
      {state === "loading" && <p role="status" className="text-muted-foreground">Profil wird geladen …</p>}
      {state === "unavailable" && <section className="rounded-xl border bg-card p-6"><h1 className="text-2xl font-bold">Profil nicht verfügbar</h1><p className="mt-2 text-muted-foreground">Der Link ist ungültig oder die Freigabe wurde beendet.</p></section>}
      {state === "error" && <section className="rounded-xl border bg-card p-6"><h1 className="text-2xl font-bold">Profil konnte nicht geladen werden</h1><p className="mt-2 text-muted-foreground">Bitte prüfe deine Verbindung und versuche es später erneut.</p></section>}
      {state === "ready" && profile && <>
        <header className="space-y-2"><h1 className="text-4xl font-bold tracking-tight">{profile.name}</h1><p className="text-muted-foreground">Ausgewählte Erfolge aus der Spielesammlung</p></header>
        <section aria-label="Spielstatistik" className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-3">
          {[{ label: "Sessions", value: profile.totals.sessions, Icon: Gamepad2 }, { label: "Spiele", value: profile.totals.gamesPlayed, Icon: Compass }, { label: "Reihen", value: profile.totals.seriesCompleted, Icon: Award }].map(({ label, value, Icon }) => <div key={label} className="rounded-xl border bg-card p-4 text-center"><Icon aria-hidden="true" className="mx-auto mb-2 h-5 w-5 text-primary"/><strong className="block text-2xl tabular-nums">{value}</strong><span className="text-sm text-muted-foreground">{label}</span></div>)}
        </section>
        <section className="space-y-4"><h2 className="text-2xl font-semibold">Abzeichen</h2>{profile.badges.length ? <ul className="grid gap-4 sm:grid-cols-2">{profile.badges.map((badge) => { const Icon = badgeIcons[BADGES.find(({ id }) => id === badge.id)?.icon ?? "spark"] ?? Sparkles; return <li key={badge.id} className="flex min-w-0 gap-4 rounded-xl border bg-card p-5"><span role="img" aria-label={badge.altText} className="grid size-14 shrink-0 place-items-center rounded-full border-2 border-primary bg-primary/10 text-primary"><Icon aria-hidden="true" className="size-6" /></span><div className="min-w-0 break-words"><h3 className="font-semibold">{badge.title}</h3><p className="text-sm text-muted-foreground">{badge.description}</p></div></li>; })}</ul> : <p className="rounded-xl border bg-card p-5 text-muted-foreground">Noch keine Abzeichen ausgewählt.</p>}</section>
        <p className="text-xs text-muted-foreground">Dieses Profil zeigt nur ausgewählte Abzeichen und zusammengefasste Spielzahlen.</p>
      </>}
    </div>
  </main>;
}
