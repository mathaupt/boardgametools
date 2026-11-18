# FEAT-035 – Einladungen und Dashboard-Navigation fokussieren: Implementierungsplan

> **For agentic workers:** REQUIRED SUB-SKILL: Use inline execution task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dashboard-Einladungen geben verlässliche Rückmeldung, offene Antworten erhalten einen kontextuellen Einstieg, die Webnavigation zeigt fünf häufige Ziele direkt und Eventtexte verwenden verständliches Deutsch.

**Architecture:** Die vorhandene clientseitige `PendingInvites`-Komponente erhält lokale Lade-/Fehlerzustände und nutzt den vorhandenen globalen Toast für bestätigte Erfolge. Dashboard, Navigation und Eventübersicht verwenden weiter ihre bestehenden Routen und Berechtigungen; es entstehen keine API- oder Datenmodelländerungen.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, shadcn/ui, Vitest, Testing Library, Impeccable.

---

## Umfang und Ausnahmen

- Umsetzung nacheinander: Einladungsergebnis, Dashboard-Einstieg, Navigation B, deutsche Beschriftungen.
- Navigation: Dashboard, Spiele, Sessions, Spieleabende, Gruppen; Reihen, Statistiken und Abzeichen in einer zugänglichen „Mehr“-Gruppe. Adminlinks bleiben in ihrer eigenen, rollenbeschränkten Gruppe.
- Die Einladungsliste bleibt an ihrer bestehenden Position vor den Schnellzugriffen. Bei offenen Einladungen führt die Kopfaktion zum Abschnitt `#dashboard-invites`; ohne offene Einladungen bleibt „Spieleabend planen“ primär.
- Sichtbare Bezeichnungen im Umfang: „Spieleabende“, „Spieleabend planen“, „Alle Spieleabende“, „Spieleabende & Abstimmungen“, „Abstimmung“.
- Keine API, Datenbank, iOS-, Authentifizierungs- oder Berechtigungsänderung. FEAT-034 bleibt getrennt.

## Dateiverantwortung

- `src/components/pending-invites.tsx`: Anfragezustand, Fehlermeldung, Wiederholung und Erfolgs-Toast.
- `src/components/dashboard/dashboard-overview.tsx`: kontextuelle Kopfaktion, Anker-ID und deutsche Dashboard-Links.
- `src/components/layout/navbar.tsx`: fünf Hauptziele, aufklappbare Sekundärziele, Fokus-/Escape-Verhalten.
- `src/components/dashboard/events-overview.tsx`: deutsche Eventüberschrift, Leerzustand und Aktionen.
- `src/lib/faq.ts`: Smartphone-Navigation mit „Mehr“ erklären.
- `tests/unit/components/pending-invites.test.tsx`: neue Interaktionsregressionen.
- `tests/unit/components/club-dashboard.test.tsx`, `club-navigation.test.tsx`, `events-overview.test.tsx`, `tests/unit/lib/faq.test.ts`: geänderte Verträge.
- `src/lib/changelog.ts`, `docs/bugs.md`, `docs/FEATURE-BACKLOG.md`, `docs/FEATURES.md`, `src/lib/faq.ts`: Abschlussdokumentation; `docs/openapi.yaml` bleibt unverändert, da kein Endpunkt geändert wird.

## Aktualitäts- und Vorprüfungen unmittelbar vor Codebeginn

1. `git status --short` und `git log -5 --oneline` prüfen; Änderungen seit Spec-Commit `be8a6d8` in den Planabgleich aufnehmen.
2. Betroffene UI- und FAQ-Dateien nochmals mit den bestätigten Verträgen vergleichen. Die Navigationseinträge und Einladungsliste können sich zwischen Planung und Umsetzung geändert haben.
3. `npm run review-evaluate:report` als Review-Baseline ausführen.
4. Vor dem ersten Test die verbindliche TDD-Regel, `skills/testing/SKILL.md`, `.agents/skills/next-best-practices/SKILL.md` und `.agents/skills/vercel-react-best-practices/SKILL.md` lesen.
5. Unmittelbar vor jeder UI-Codeänderung `.agents/skills/impeccable/reference/craft-floor.md` lesen. Scope-Änderungen an Berechtigungen, API, Datenfreigabe oder Betrieb werden nicht stillschweigend ergänzt.

**Aktualitätsprüfung 18.11.2026:** Planfreigabe liegt vor. Gegen `f1d2111` geprüft; davor war der Arbeitsbaum sauber. Die aktuelle Implementierung bestätigte: `PendingInvites` entfernte nur bei erfolgreicher HTTP-Antwort und protokollierte Netzwerkfehler; die Dashboard-Einladungsliste stand bereits vor Schnellzugriffen; acht Hauptziele wurden direkt angezeigt. Keine API-, Datenmodell-, Berechtigungs- oder Plattformänderung seit der Designfreigabe. Der erste Review-Baseline-Lauf ohne Registryzugriff erzeugte SEC-45 fälschlich als offen; der wiederholte Lauf mit gültigen Auditdaten ergab 10/10 und keine offenen Findings. Scope unverändert.

## Task 1: Einladungsantworten sichtbar und wiederholbar machen

**Dateien:**
- Erstellen: `tests/unit/components/pending-invites.test.tsx`
- Ändern: `src/components/pending-invites.tsx`

- [x] **RED:** Neue Komponententests abdecken: Nicht-OK-HTTP-Antwort zeigt `role="alert"`, Einladung bleibt erhalten und „Erneut versuchen“ wird angezeigt; Netzwerkfehler zeigen dieselbe Meldung; Wiederholung mit erfolgreicher Antwort entfernt nur diese Einladung und ruft `toast` auf; während einer offenen Anfrage ist die doppelte Antwortaktion deaktiviert und ein `role="status"` sichtbar. Fehlerzustände bleiben getrennt und parallele Antworten auf verschiedene Einladungen stören sich nicht.

  Testmuster für den zuerst fehlschlagenden Vertrag:

  ```tsx
  const invite = {
    id: "invite-1",
    eventId: "event-1",
    status: "pending",
    event: {
      id: "event-1",
      title: "Runde bei Anna",
      eventDate: "2026-12-01T18:00:00.000Z",
      location: "Bei Anna",
      createdBy: { name: "Anna" },
    },
  };

  it("behält die Einladung bei einem HTTP-Fehler und bietet Wiederholung an", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    render(<PendingInvites invites={[invite]} />);
    await user.click(screen.getByRole("button", { name: "Zusagen" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Die Antwort konnte nicht gespeichert werden.");
    expect(screen.getByRole("button", { name: "Erneut versuchen" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Runde bei Anna" })).toBeInTheDocument();
  });
  ```

  Testkommando: `npx vitest run tests/unit/components/pending-invites.test.tsx`

  Erwartung: FAIL, weil `PendingInvites` HTTP-Fehler aktuell still ignoriert, Netzwerkfehler nur protokolliert und keinen Erfolgs-Toast auslöst.

- [x] **GREEN:** `useToast` aus `@/components/ui/use-toast` verwenden; pro ausstehender Einladung Antwortstatus und fehlgeschlagene Absicht merken. Eine gemeinsame deutsche Meldung „Die Antwort konnte nicht gespeichert werden. Bitte versuche es erneut.“ bei Netzwerkfehler oder `!response.ok` anzeigen. Die Wiederholung sendet dieselbe `status`-Absicht erneut. Ein Eintrag wird erst bei `response.ok` entfernt. Dann einen Erfolgstoast mit statusbezogener Bestätigung auslösen. Lade- und Fehlertext mit `role="status"` beziehungsweise `role="alert"` ausgeben.

  Zustands-/Fehlervertrag:

  ```tsx
  const [loading, setLoading] = useState<string | null>(null);
  const [errorByEventId, setErrorByEventId] = useState<Record<string, string>>({});
  const [retryIntentByEventId, setRetryIntentByEventId] = useState<Record<string, "accepted" | "declined">>({});

  async function respond(eventId: string, status: "accepted" | "declined") {
    setLoading(eventId);
    setErrorByEventId((current) => { const next = { ...current }; delete next[eventId]; return next; });
    try {
      const response = await fetch(`/api/events/${eventId}/invites`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error("invite-response-failed");
      setInvites((current) => current.filter((invite) => invite.eventId !== eventId));
      setRetryIntentByEventId((current) => { const next = { ...current }; delete next[eventId]; return next; });
      toast({ title: "Antwort gespeichert", description: status === "accepted" ? "Du hast zugesagt." : "Du hast abgesagt." });
    } catch {
      setErrorByEventId((current) => ({ ...current, [eventId]: "Die Antwort konnte nicht gespeichert werden. Bitte versuche es erneut." }));
      setRetryIntentByEventId((current) => ({ ...current, [eventId]: status }));
    } finally {
      setLoading(null);
    }
  }
  ```

  Rendervertrag für jede Einladung:

  ```tsx
  {loading === invite.eventId && <p role="status" aria-live="polite">Antwort wird gespeichert …</p>}
  {errorByEventId[invite.eventId] && (
    <div role="alert" className="flex flex-wrap items-center gap-2">
      <p>{errorByEventId[invite.eventId]}</p>
      <Button type="button" variant="outline" className="min-h-11" disabled={loading === invite.eventId}
        onClick={() => respond(invite.eventId, retryIntentByEventId[invite.eventId] ?? "accepted")}>
        Erneut versuchen
      </Button>
    </div>
  )}
  ```

  Testkommando: `npx vitest run tests/unit/components/pending-invites.test.tsx`

  Erwartung: PASS mit allen vier Verhaltensfällen.

- [x] **REFACTOR:** Keine getrennte Toast-Infrastruktur einführen; vorhandenen globalen `Toaster` nutzen. 44-px-Mindesthöhe aus `.club-main [data-slot=button]` erhalten. Testkommando erneut ausführen; Erwartung: PASS, keine doppelten Anfragen und keine ungenutzten Zustände.

## Task 2: Kopfaktion an offene Einladungen anpassen

**Dateien:**
- Ändern: `tests/unit/components/club-dashboard.test.tsx`
- Ändern: `src/components/dashboard/dashboard-overview.tsx`
- Ändern: `src/components/pending-invites.tsx`

- [x] **RED:** Tests mit null und einer Einladung ergänzen. Ohne Einladung muss der Kopfbutton „Spieleabend planen“ auf `/dashboard/events/new` verweisen. Mit Einladung muss „Einladungen beantworten“ auf `#dashboard-invites` verweisen; die Zielsektion muss die ID tragen und weiterhin vor den Schnellzugriffen stehen.

  Kernassertion für den neuen Zustand:

  ```tsx
  render(<DashboardOverview {...base} invites={[invite]} />);
  expect(screen.getByRole("link", { name: "Einladungen beantworten" })).toHaveAttribute("href", "#dashboard-invites");
  expect(document.getElementById("dashboard-invites")).toBeInTheDocument();
  ```

  Testkommando: `npx vitest run tests/unit/components/club-dashboard.test.tsx`

  Erwartung: FAIL für den kontextuellen Namen, Sprunglink und Anker.

- [x] **GREEN:** Kopfaktion anhand von `invites.length` umschalten. Bei offenen Einladungen Linkziel `#dashboard-invites`, sonst `/dashboard/events/new`; sichtbare Texte genau wie oben. Ein optionales `id`-Prop an `PendingInvites` ergänzen und vom Dashboard mit `dashboard-invites` setzen. Bestehende DOM-Reihenfolge des Aktionsbereichs beibehalten.

  Kopfaktionsvertrag:

  ```tsx
  const primaryAction = invites.length > 0
    ? { href: "#dashboard-invites", label: "Einladungen beantworten" }
    : { href: "/dashboard/events/new", label: "Spieleabend planen" };
  ```

  Testkommando: `npx vitest run tests/unit/components/club-dashboard.test.tsx`

  Erwartung: PASS für beide Zustände und bestehende Dashboardfälle.

- [x] **REFACTOR:** CTA semantisch als Link mit bestehender Buttondarstellung belassen; keine Scroll-JavaScript-Logik ergänzen. Test erneut ausführen; Erwartung: PASS und vorhandene leere/volle Eventzustände unverändert.

## Task 3: Fünf Hauptziele plus zugängliches „Mehr“

**Dateien:**
- Ändern: `tests/unit/components/club-navigation.test.tsx`
- Ändern: `src/components/layout/navbar.tsx`

- [x] **RED:** Tests für direkte Ziele Dashboard/Spiele/Sessions/Spieleabende/Gruppen, standardmäßig geschlossenes „Mehr“, sekundäre Ziele Reihen/Statistiken/Abzeichen nach Klick und aktiven Routenstatus eines sekundären Ziels ergänzen. Escape soll zuerst „Mehr“ schließen und den Fokus auf dessen Schalter zurückgeben; ein zweites Escape schließt das mobile Menü und fokussiert den Menütoggle.

  Kernassertion für progressive Offenlegung:

  ```tsx
  expect(screen.queryByRole("link", { name: "Reihen" })).not.toBeInTheDocument();
  const more = screen.getByRole("button", { name: "Mehr" });
  await user.click(more);
  expect(more).toHaveAttribute("aria-expanded", "true");
  expect(screen.getByRole("link", { name: "Reihen" })).toHaveAttribute("href", "/dashboard/series");
  ```

  Testkommando: `npx vitest run tests/unit/components/club-navigation.test.tsx`

  Erwartung: FAIL, da `Events` und alle acht Seitenlinks aktuell direkt gerendert werden und kein „Mehr“-Schalter existiert.

- [x] **GREEN:** Die vorhandene Navigationsliste auf die fünf Hauptziele beschränken. Drei sekundäre Ziele in einer separaten Liste nur bei geöffnetem Mehr-Bereich rendern. Den Schalter als beschrifteten Button mit `aria-expanded` und `aria-controls` ausführen. Wenn die aktuelle Route sekundär ist, „Mehr“ visuell aktiv markieren und seinen zugänglichen Namen um den aktuellen Bereich ergänzen. Escape schließt zuerst den Sekundärbereich und fokussiert dessen Button; danach greift das bestehende Escape-Verhalten des mobilen Menüs. Auswahl eines Sekundärlinks schließt beide Zustände. Adminlinks und Rollenprüfung unverändert lassen.

  Navigationsdaten:

  ```tsx
  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Spiele", href: "/dashboard/games", icon: Gamepad2 },
    { name: "Sessions", href: "/dashboard/sessions", icon: CalendarDays },
    { name: "Spieleabende", href: "/dashboard/events", icon: Vote },
    { name: "Gruppen", href: "/dashboard/groups", icon: Users },
  ];
  const secondaryNavigation = [
    { name: "Reihen", href: "/dashboard/series", icon: Library },
    { name: "Statistiken", href: "/dashboard/statistics", icon: BarChart3 },
    { name: "Abzeichen", href: "/dashboard/achievements", icon: Award },
  ];
  ```

  Testkommando: `npx vitest run tests/unit/components/club-navigation.test.tsx`

  Erwartung: PASS für Haupt-/Sekundärziele, aktiven Zustand, Escape/Fokus, mobiles Schließen und Adminlinks.

- [x] **REFACTOR:** State- und Fokusbehandlung in `Navbar` halten; keine neue Abhängigkeit und kein verschachteltes `nav` erzeugen. Test erneut ausführen; Erwartung: PASS ohne Fokusverlust.

## Task 4: Deutsche Spieleabend-Texte und Navigationserklärung

**Dateien:**
- Ändern: `tests/unit/components/events-overview.test.tsx`
- Ändern: `tests/unit/components/club-dashboard.test.tsx`
- Ändern: `tests/unit/lib/faq.test.ts`
- Ändern: `src/components/dashboard/events-overview.tsx`
- Ändern: `src/components/dashboard/dashboard-overview.tsx`
- Ändern: `src/lib/faq.ts`

- [x] **RED:** Eventübersichtstests auf „Spieleabende & Abstimmungen“, „Noch keine Spieleabende“, „Ersten Spieleabend planen“, „Spieleabend planen“ und „Abstimmung“ umstellen. Dashboardtest für „Alle Spieleabende“ und Zähler „Spieleabende“ ergänzen. FAQ-Test für die Smartphone-Navigation so erweitern, dass er die fünf direkten Ziele und die sekundären Ziele unter „Mehr“ erwartet.

  Testkommando: `npx vitest run tests/unit/components/events-overview.test.tsx tests/unit/components/club-dashboard.test.tsx tests/unit/lib/faq.test.ts`

  Erwartung: FAIL an den aktuellen englischen beziehungsweise „Event“-Beschriftungen und der FAQ-Aufzählung.

- [x] **GREEN:** Überschrift, Leertext, Erstellen-/Details-/Abstimmungsaktion in `EventsOverview`, Dashboardkopf, Eventlinks und Ereigniszähler gemäß der Tests in idiomatisches Deutsch übertragen. `src/lib/faq.ts` erklärt, dass das Smartphone-Menü Spiele, Sessions, Spieleabende und Gruppen direkt enthält und Reihen, Statistiken und Abzeichen unter „Mehr“ liegen. Routen und API-Begriffe bleiben unverändert.

  Verbindliche Textzuordnung:

  | Bestehender Text | Neuer Text |
  |---|---|
  | `Events & Voting` | `Spieleabende & Abstimmungen` |
  | `Noch keine Events` | `Noch keine Spieleabende` |
  | `Erstes Event erstellen` | `Ersten Spieleabend planen` |
  | `Event erstellen` / `Event planen` | `Spieleabend planen` |
  | `Voting` | `Abstimmung` |
  | `Alle Events ansehen` / Dashboard-Zähler `Events` | `Alle Spieleabende` / `Spieleabende` |

  Testkommando: `npx vitest run tests/unit/components/events-overview.test.tsx tests/unit/components/club-dashboard.test.tsx tests/unit/lib/faq.test.ts`

  Erwartung: PASS; Detaildaten und Linkziele bleiben gleich.

- [x] **REFACTOR:** In den betroffenen Komponenten keine nicht bestätigten Produktversprechen ergänzen. Test erneut ausführen; Erwartung: PASS, deutsche Beschriftungen ohne veraltete englische UI-Texte in diesen Oberflächen.

## Task 5: Impeccable-Abnahme, Dokumentation und Regression

**Dateien:**
- Aktualisieren: `src/lib/changelog.ts` mit Version `0.50.103`
- Aktualisieren: `docs/bugs.md` (BUG-089 auf `fixed`, Datum/Version/Teststatus; Statistik auf 4 offen, 85 behoben, 89 gesamt)
- Aktualisieren: `docs/FEATURE-BACKLOG.md` (FEAT-035 abgeschlossen und Abnahmebeleg)
- Aktualisieren: `docs/FEATURES.md` (Einladungsfeedback, Navigation und deutsche Spieleabend-Oberfläche)
- Aktualisieren: `src/lib/faq.ts` (bereits Task 4)
- Keine Änderung: `docs/openapi.yaml`, Datenbankschema, API oder `CONCEPT.md`.

- [x] **RED/GREEN/REFACTOR:** Vor Abschluss alle neu geschriebenen Verhaltenstests einzeln gelaufen haben. Sammelkommando: `npx vitest run tests/unit/components/pending-invites.test.tsx tests/unit/components/club-dashboard.test.tsx tests/unit/components/club-navigation.test.tsx tests/unit/components/events-overview.test.tsx tests/unit/lib/faq.test.ts tests/unit/lib/changelog.test.ts`. Erwartung nach GREEN/REFACTOR: alle Tests bestanden; während RED müssen die gezielten neuen Erwartungen am alten Code scheitern.
- [x] `$impeccable harden`, `$impeccable distill`, `$impeccable layout` und `$impeccable clarify` als Prüfleitfaden angewendet. `impeccable detect --json` auf die betroffenen UI-Dateien ausgeführt: keine Befunde.
- [x] Gerenderte Prüfung mit synthetischen Daten auf einer temporären, ungeschützten Vorschauseite (nachher entfernt), ohne Auth-Bypass auf Produktionsrouten: 320/390/768/1440 CSS-Pixel, Hell und Dunkel. Kein horizontaler Überlauf. 503-Fehler, Wiederholung mit 204-Erfolg, „Mehr“ geöffnet und Einladung leer nach Zusage gerendert. Escape/Fokus und Adminnavigation zusätzlich durch Unit-Tests abgedeckt. Belege: `.impeccable/critique/2026-11-18-feat035/` (Viewport-, Menü-, Fehler- und Erfolgszustände). Der integrierte CUA-Browserhost war nicht verfügbar; Playwright Chromium war verfügbar.
- [x] Abschlussprüfungen: `npm run test` (234 Dateien, 1.474 Tests bestanden), `npm run typecheck`, gezieltes ESLint mit `--max-warnings=0`, `npm run build` und `npm run security-check` erfolgreich. Sicherheitscheck: zwei bestehende Warnungen (Raw SQL und Debug-Routen) sowie ein moderater Next.js-16.4.3-Auditbefund, separat in BUG-088 dokumentiert.
- [ ] `npm run review-evaluate` nach dem Implementierungscommit ausführen. Review-Snapshot, Bewertung und Prozessanpassungen in `docs/code-reviews/` aktualisieren; `npm run review-evaluate:regression` muss ohne Regression enden. BUG-089 bleibt nur dann `fixed`, wenn der Regressionstest bestanden ist.
- [ ] Änderungen gemeinsam committen mit `feat: focus dashboard invitations and navigation`; Changelog/Backlog/Bugstatus im selben Commit enthalten.

## Sicherheits- und Betriebsprüfung

- Einladungshandlungen bleiben an den bestehenden authentifizierten Endpoint gebunden; weder HTTP-Request noch Berechtigungsprüfung werden geändert.
- Nicht-OK-Responses werden nicht als Erfolg behandelt. Keine Antwortdaten oder Kontoinformationen werden in Logs geschrieben.
- Keine neue Abhängigkeit, Migration, Umgebungsvariable, Produktionsdatenabfrage oder öffentliche Route.
- FEAT-034 und bestehende Produktionsdaten bleiben außerhalb dieses Umfangs.
