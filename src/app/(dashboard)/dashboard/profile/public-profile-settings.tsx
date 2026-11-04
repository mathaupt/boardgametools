"use client";

import { useEffect, useState } from "react";
import { Check, Copy, RefreshCw, Share2 } from "lucide-react";

type Settings = { enabled: boolean; featuredBadgeIds: string[]; shareUrl: string | null; earnedBadges: Array<{ id: string; title: string; description: string }> };

export function PublicProfileSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function refresh() {
    const response = await fetch("/api/users/me/public-profile", { cache: "no-store" });
    if (!response.ok) throw new Error();
    const data = await response.json() as Settings;
    setSettings(data);
    setSelected(data.featuredBadgeIds);
  }

  useEffect(() => { void refresh().catch(() => setMessage("Profilfreigabe konnte nicht geladen werden.")); }, []);

  async function save(enabled: boolean, rotate = false) {
    if (!settings) return;
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/users/me/public-profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled, rotate, featuredBadgeIds: selected }) });
      if (!response.ok) throw new Error();
      const result = await response.json() as { enabled: boolean; featuredBadgeIds: string[]; shareUrl: string | null };
      setSettings({ ...settings, ...result });
      setMessage(enabled ? (rotate ? "Freigabelink erneuert." : "Profilfreigabe gespeichert.") : "Profil ist jetzt privat.");
    } catch { setMessage("Änderung konnte nicht gespeichert werden."); }
    finally { setBusy(false); }
  }

  async function copyLink() {
    if (!settings?.shareUrl) return;
    try { await navigator.clipboard.writeText(settings.shareUrl); setMessage("Link kopiert."); }
    catch { setMessage("Link konnte nicht kopiert werden."); }
  }

  return <section className="rounded-xl border bg-card p-5 sm:p-6" aria-labelledby="public-profile-heading">
    <div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary"><Share2 className="size-5" aria-hidden="true" /></span><div><h2 id="public-profile-heading" className="text-lg font-semibold">Abzeichenprofil teilen</h2><p className="mt-1 text-sm text-muted-foreground">Teile ausgewählte Abzeichen und zusammengefasste Spielzahlen. E-Mail, Gruppen, Events und Notizen bleiben privat.</p></div></div>
    {!settings ? <p className="mt-4 text-sm text-muted-foreground">Einstellungen werden geladen …</p> : <div className="mt-5 space-y-4">
      <label className="flex min-h-11 items-center gap-3"><input type="checkbox" checked={settings.enabled} disabled={busy} onChange={(event) => void save(event.target.checked)} className="size-5 accent-primary"/><span className="font-medium">Öffentliches Abzeichenprofil aktivieren</span></label>
      {settings.enabled && <>
        <fieldset className="space-y-2"><legend className="font-medium">Sichtbare Abzeichen</legend>{settings.earnedBadges.length ? settings.earnedBadges.map((badge) => <label key={badge.id} className="flex min-h-11 items-center gap-3 rounded-lg border px-3"><input type="checkbox" checked={selected.includes(badge.id)} disabled={busy} onChange={() => setSelected((current) => current.includes(badge.id) ? current.filter((id) => id !== badge.id) : [...current, badge.id])} className="size-5 accent-primary"/><span>{badge.title}</span></label>) : <p className="text-sm text-muted-foreground">Sobald du ein Abzeichen freischaltest, kannst du es hier auswählen.</p>}</fieldset>
        <div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => void save(true)} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-medium text-primary-foreground disabled:opacity-50"><Check className="size-4" aria-hidden="true"/>Auswahl speichern</button><button type="button" onClick={() => void copyLink()} className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 font-medium"><Copy className="size-4" aria-hidden="true"/>Link kopieren</button><button type="button" disabled={busy} onClick={() => void save(true, true)} className="inline-flex min-h-11 items-center gap-2 rounded-md border px-4 font-medium"><RefreshCw className="size-4" aria-hidden="true"/>Link erneuern</button></div>
        {settings.shareUrl && <p className="break-all rounded-md bg-muted px-3 py-2 text-sm" aria-label="Öffentlicher Profil-Link">{settings.shareUrl}</p>}
      </>}
      {message && <p role="status" className="text-sm text-muted-foreground">{message}</p>}
    </div>}
  </section>;
}
