# FEAT-011 – Mobile und assistive Terminabstimmung

**Status:** Implementiert für die Web-App; manuelle VoiceOver-Abnahme und vollständige gerenderte Theme-Kontrastmessung offen. iOS separat.

**Ziel:** Gäste und angemeldete Teilnehmer können jeden Termin vollständig sehen, mit Tastatur und Screenreader beantworten und ihre gespeicherte Antwort eindeutig erkennen.

**Architektur:** Ein gemeinsames fachliches Terminmodell und eine native HTML-Radiogruppe ersetzen die kleinen Antwortbuttons. Öffentliche Terminliste und geschützte Eventansicht verwenden dieselben Antwortkomponenten; die Darstellung der Teilnehmerdaten passt sich dem verfügbaren Platz an. Netzwerkanfragen bleiben in den vorhandenen Controllern.

**Technik:** React/TypeScript, bestehende shadcn/ui-Bausteine, semantische Club-Programme-Farben, Vitest/Testing Library, CodeceptJS/Playwright und macOS VoiceOver.

**Abarbeitung:** Testgetrieben umgesetzt nach ausdrücklicher Freigabe „implementiere FEAT-011“. Web zuerst; native SwiftUI-Terminabstimmung separat planen.

## 1. Bestand und Umfang

- src/components/public-event/date-voting-section.tsx verwendet eine Tabelle mit Mindestbreiten, 32 × 32 px großen Iconbuttons und rein visueller Auswahl. Bei 390 px sind Antwortmöglichkeiten erst nach horizontalem Scrollen erreichbar (BUG-038).
- src/app/(dashboard)/dashboard/events/[id]/date-poll-voting-matrix.tsx besitzt ebenfalls kleine Iconbuttons und eine wachsende Teilnehmermatrix.
- Öffentliche Antwortaktionen ersetzen während des Ladens die Controls durch einen Spinner. Das kann den Fokus entfernen; Auswahl und Fehlermeldung werden nicht zuverlässig als Status vermittelt.
- Gastbegrüßung, Zusagezahlen, ausgewählter Termin und ein Absagebadge unterschreiten im vorhandenen Impeccable-Bericht 4,5:1 (BUG-039).
- guest-registration-panel.tsx und date-poll-create-form.tsx enthalten betroffene Eingaben und Hauptaktionen; ihre Bedienflächen gehören zum begrenzten Korrekturumfang.
- Impeccable-Quellen: docs/bugs.md (BUG-038/039) und .impeccable/critique/2026-10-30T14-45-15Z__src-app-public-event-token-page-tsx.md; Belege unter .impeccable/critique/evidence/public-event-A/ und public-event-B/. Ignorierte Belege sind lokal und kein zwingendes Vorhandenseinskriterium für eine spätere Umsetzung.

**Abhängigkeit:** FEAT-010 definiert Zustand, Datumssemantik und serverseitige Sperren. Controls können isoliert gebaut werden; ihre Integration und Abnahme verwenden den FEAT-010-Vertrag. FEAT-011 ersetzt keine fehlende Serverprüfung durch deaktivierte Buttons. FEAT-012/013 (Seitenreihenfolge und aktive Identität) werden hier nicht neu gestaltet.

## 2. Gestaltungs- und Bedienvertrag

### Termin und Übersicht

- Pro Termin eine klar abgegrenzte Zeile beziehungsweise Karte: Datum einschließlich Jahr, beschriftete Summen „Ja“, „Vielleicht“, „Nein“, eigene Antwort und bei Berechtigung die Auswahlaktion des Erstellers.
- Alle drei Antwortoptionen sind ohne horizontales Scrollen sichtbar. Unterhalb der benötigten Breite stehen sie untereinander statt mit verkleinerten Schriftgrößen oder Icon-only-Aktionen.
- Mobil folgen Teilnehmerantworten als aufklappbare Liste unter dem Termin. Desktop darf zusätzlich die vorhandene Vergleichsmatrix zeigen; Hauptantworten und Erstellerauswahl liegen außerhalb eines horizontalen Tabellen-Scrollbereichs.
- Eine einzige interaktive Antwortgruppe je Termin und aktiver Identität im DOM. Keine doppelte mobile/desktopseitige Form mit zwei identischen Namen und Fokuszielen.
- Date-only-Werte aus FEAT-010 ohne erfundene Uhrzeit darstellen; gespeicherten Tag vergleichen, nicht Browser-toDateString. Gewählter Termin erhält zusätzlich den Text „Festgelegter Termin“.
- Bekannte fehlende Antwort heißt „Noch nicht beantwortet“, ein unbekannter Altwert heißt „Antwort unbekannt“. Unbekannte Werte nicht als „Nein“ zählen.

### Semantik und Rückmeldung

- Native input type=radio innerhalb eines fieldset mit datumsbezogenem legend. Labels „Ja“, „Vielleicht“, „Nein“ bleiben sichtbar; die Auswahl wird über checked vermittelt.
- Tab erreicht die Gruppe; Pfeiltasten wechseln nach nativer Radiokonvention. Sichtbarer Fokus auf dem zugehörigen Label, Enter/Space und Maus/Touch funktionieren.
- Mindestens 44 × 44 CSS-Pixel für alle Antwort- und Hauptaktionen; Abstand zwischen benachbarten Zielen mindestens 8 px. Inline-Textlinks sind keine Hauptaktionen.
- Beim Speichern bleiben die Radios im DOM; aria-busy und aria-disabled markieren den vorübergehenden Zustand, ein Callback-Guard verhindert weitere Writes. Den gerade fokussierten Input dafür nicht nativ deaktivieren. Eine daneben liegende Statuszeile meldet „Antwort wird gespeichert …“; kein Austausch des fokussierten Elements gegen einen Spinner.
- Auswahl bleibt bis zum erfolgreichen Serverresultat auf dem zuletzt gespeicherten Wert. Bei Fehler bleibt sie erhalten; die Meldung nennt Termin und Wiederholungsmöglichkeit durch erneute Auswahl.
- Pro Termin höchstens ein Request gleichzeitig. Eine bereits ausgewählte Antwort löst keinen zweiten Request aus. Bei Identitätswechsel oder Unmount werden veraltete Antworten nicht in eine fremde aktuelle Auswahl übernommen.
- Erfolg über role=status/aria-live=polite ansagen, Fehler über role=alert. Keine neue automatische Fokusverschiebung nach jedem Speichern.
- FEAT-010-Sperren zeigen den gespeicherten Wert und Grund als Text. Keine scheinbar aktive Radiogruppe für geschlossene oder vergangene Termine.

### Farbe und Lesbarkeit

- Alle betreffenden kleinen Texte erreichen mindestens 4,5:1 gegen ihre tatsächlich gerenderte Fläche, hell und dunkel. Für interaktive Begrenzungen/Fokus gilt zusätzlich 3:1 gegen die Umgebung.
- Statusfarbe unterstützt die Bedeutung; Worte und Symbole vermitteln dieselbe Information.
- Gastbegrüßung, Zähler und festgelegter Termin können vorhandenes foreground auf semantischer Fläche verwenden. Fehlenden Kontrast nicht mit stärkerer Transparenz oder pauschal höherer Sättigung behandeln.
- Kein neuer visueller Stil: Barlow, bestehende Tokens, ruhige Trennlinien und beschriftete Controls aus DESIGN.md beibehalten. Text unter 12 px vermeiden; Antwortlabels mindestens 14 px.

## 3. Dateien und Schnittstellen

| Datei | Aufgabe |
|---|---|
| src/lib/events/date-availability.ts | Neues Availability-Modell und reine Zähl-/Auswahladapter |
| src/components/event-voting/date-availability-group.tsx | Neue kontrollierte Radiogruppe ohne fetch oder Authlogik |
| src/components/event-voting/date-proposal-item.tsx | Neue gemeinsame Terminzeile mit Summen, Ergebnis und Slots |
| src/components/event-voting/date-participant-list.tsx | Neue mobile/assistive Liste der Antworten |
| src/components/public-event/date-voting-section.tsx | Daten/Requests halten und gemeinsame Komponenten verwenden |
| src/app/(dashboard)/dashboard/events/[id]/date-poll-client.tsx | Gemeinsame Controls, Speicherrückmeldung und FEAT-010-Sperren anbinden |
| src/app/(dashboard)/dashboard/events/[id]/date-poll-voting-matrix.tsx | Desktopmatrix als Vergleich; interaktive Kernaktionen aus dem Scroller lösen |
| src/app/(dashboard)/dashboard/events/[id]/date-poll-types.tsx | Adapter auf gemeinsames Modell; vorhandene Exporte kompatibel halten |
| src/app/(dashboard)/dashboard/events/[id]/date-poll-create-form.tsx | Eingaben/Erstelleraktionen auf 44 px und klare Labels bringen |
| src/app/(dashboard)/dashboard/events/[id]/date-poll-reset-dialog.tsx | Sichtbare Fokusführung und ausreichend große Bestätigungsaktionen prüfen |
| src/components/public-event/guest-registration-panel.tsx | Begrüßungskontrast, Eingabe-/Beitrittsflächen korrigieren |
| src/app/public/event/[token]/page.tsx | Betroffene Einladung-/Absagebadges in der bestehenden Teilnehmerdarstellung korrigieren |
| src/app/globals.css, src/app/club.css | Nur benötigte semantische Status-/Controlrollen ergänzen |

Gemeinsamer Vertrag:

```ts
export type Availability = "yes" | "maybe" | "no";

export interface DateAvailabilityGroupProps {
  idPrefix: string;
  dateProposalId: string;
  dateLabel: string;
  value: Availability | null;
  disabled: boolean;
  busy: boolean;
  onChange: (value: Availability) => void;
}
```

Das gemeinsame Terminmodell enthält id, dateKey, dateLabel, counts { yes, maybe, no, unanswered }, myAvailability sowie participants mit stabiler ID, Anzeigename und Antwort. Öffentliche Adapter dürfen keine E-Mail-Adressen oder zusätzlichen privaten Teilnehmerdaten übernehmen.

## 4. Aufgaben

### Aufgabe 1 – Modell und Antwortgruppe mit Verhaltenstests

**Neu:** src/lib/events/date-availability.ts, src/components/event-voting/date-availability-group.tsx, tests/unit/lib/date-availability.test.ts, tests/unit/components/date-availability-group.test.tsx.

- [ ] npm run review-evaluate:report als Vorlauf. Vor UI-Implementierung Impeccable-Kontext sowie Craft-Floor und skills/accessibility/SKILL.md lesen; keine neue Variantenfreigabe erforderlich, da der bestätigte Club-Programme-Stil fortgeführt wird.
- [ ] Test zuerst schreiben:

```tsx
it("vermittelt Datum, Antwort und Tastaturauswahl", async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();
  render(<DateAvailabilityGroup
    idPrefix="public"
    dateProposalId="date-1"
    dateLabel="Freitag, 6. November 2026"
    value="maybe"
    disabled={false}
    busy={false}
    onChange={onChange}
  />);
  expect(screen.getByRole("group", { name: "Freitag, 6. November 2026" }))
    .toBeInTheDocument();
  expect(screen.getByRole("radio", { name: "Vielleicht" })).toBeChecked();
  await user.click(screen.getByRole("radio", { name: "Nein" }));
  expect(onChange).toHaveBeenCalledWith("no");
});
```

- [ ] Ergänzen: Tab/Pfeiltasten, sichtbare Labels aller drei Antworten, disabled/busy verhindert Callback, keine Antwort vorausgewählt, stabile IDs für mehrere Gruppen und derselbe kontrollierte Wert nach Rerender.
- [ ] npx vitest run tests/unit/lib/date-availability.test.ts tests/unit/components/date-availability-group.test.tsx ausführen; fehlende Module als roten Ausgangspunkt dokumentieren.
- [ ] Die Gruppe mit diesem nativen Kern implementieren; Containerklassen sorgen für Umbruch und sichtbaren label:focus-within-Zustand:

```tsx
<fieldset className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-3" disabled={disabled} aria-busy={busy} aria-disabled={disabled || busy}>
  <legend className="sr-only">{dateLabel}</legend>
  {(["yes", "maybe", "no"] as const).map((answer) => (
    <label key={answer} className="inline-flex min-h-11 min-w-11 items-center gap-2 rounded-md border border-border px-3 focus-within:ring-2 focus-within:ring-ring">
      <input
        type="radio"
        name={idPrefix + "-" + dateProposalId}
        value={answer}
        checked={value === answer}
        aria-disabled={busy}
        onChange={() => { if (!disabled && !busy) onChange(answer); }}
      />
      <span>{answer === "yes" ? "Ja" : answer === "maybe" ? "Vielleicht" : "Nein"}</span>
    </label>
  ))}
</fieldset>
```

- [ ] counts aus Nutzer- und Gastantworten zusammenführen, mit stabiler Identität genau einmal zählen. Fehlende/unklare Werte getrennt behandeln, keine Namen als IDs verwenden.
- [ ] Tests grün ausführen. Commit: feat: add accessible date availability controls.

### Aufgabe 2 – Öffentliche und geschützte Terminansichten anbinden

**Neu:** date-proposal-item.tsx und date-participant-list.tsx. **Tests:** tests/unit/components/date-voting.test.tsx erweitern; tests/unit/components/date-poll-client.test.tsx neu erstellen.

- [ ] Vor Umbau Tests für Nutzer und Gast schreiben: gespeicherte Auswahl sichtbar, Summen korrekt, Fehler ändert Auswahl nicht, doppelte Klicks erzeugen keinen zweiten Request, 409 zeigt FEAT-010-Sperre.
- [ ] Kontrollierte Requests im bestehenden Parent halten. Der gespeicherte Wert wird erst nach erfolgreicher Antwort übernommen; Bestandsdaten aus Serverrefresh neu abgleichen.
- [ ] Pro Termin einen pending-Zustand führen. Neuere Requests/Identitätswechsel über monotone Request-ID oder AbortController gegen veraltete UI-Updates schützen. Keine Servermutation ohne aktive zulässige Identität senden.
- [ ] Im öffentlichen Controller beide bestehenden Wege erhalten: Session → /api/events/[id]/date-proposals/vote; Gast → /api/public/event/[token]/date-vote. Authentifizierung und Eventbindung aus FEAT-010 übernehmen.
- [ ] Die geschützte Ansicht erhält dieselben Terminzeilen und Antwortgruppen. Desktopmatrix bleibt eine beschriftete Vergleichsansicht mit caption, th scope und textlichen Verfügbarkeitsnamen; mobile Teilnehmerdaten als Details/Liste anbieten.
- [ ] Mindestens 44 px große Erstellerauswahl mit Terminbezug im zugänglichen Namen; Auswahl nur bei passender FEAT-010-Capability. Gewählter Termin und gespeicherte Antworten bleiben lesbar.
- [ ] Antwortgruppe beim Speichern nicht aus dem DOM entfernen. Pro Termin Live-Status und Fehler ergänzen; keine Statusmeldung für jede Tabellenzelle gleichzeitig.
- [ ] npx vitest run tests/unit/components/date-voting.test.tsx tests/unit/components/date-poll-client.test.tsx tests/unit/components/date-availability-group.test.tsx grün ausführen. Commit: feat: adapt date voting for narrow and assistive views.

### Aufgabe 3 – Betroffene Kontraste und Hauptaktionen korrigieren

**Tests:** tests/unit/components/public-event-accessibility.test.tsx und tests/e2e/public_event_accessibility_test.ts neu erstellen.

- [ ] Tests vor Korrektur: Gastformular hat zugängliche Labels; Absage-/Ergebniszustände sind textlich benannt; alle Antworten ohne horizontale Bewegung erreichbar; Serverfehler lässt die aktuelle Auswahl fokussierbar bestehen.
- [ ] Betroffene Gast-/Termininputs, Beitritts-, Erstellen-, Auswählen-, Zurücksetzen- und Bestätigungsbuttons auf mindestens 44 px bringen. Kein globaler Größenumbau aller shadcn/ui-Elemente.
- [ ] Begrüßung, Ja-/Vielleicht-/Nein-Zähler, ausgewählten Termin und Absagebadge mit semantischen Text-/Flächenpaaren versehen. Lokale Statusrollen verwenden, globale Farben nur bei belegter systemweiter Eignung ändern.
- [ ] In beiden Farbschemata gerenderte Vorder-/Hintergrundfarben nach Transparenzauflösung messen und Verhältnis protokollieren. Unterschreitungen wirklich beheben; deaktivierte Controls gesondert kennzeichnen, nicht als gemessenen Erfolgsnachweis ausgeben.
- [ ] Komponenten unter ungefähr 300 Zeilen halten; nur die hier berührten Verantwortlichkeiten teilen.
- [ ] Gezielte Unit-/E2E-Tests grün ausführen. Commit: fix: improve public event contrast and touch targets.

### Aufgabe 4 – Gerenderte und assistive Abnahme

- [ ] Testsätze: 0/1/10/30 Termine, keine/ausgewählte/alte unbekannte Antwort, 50 Teilnehmer, lange Namen, ausgewählter Termin, Gast/Nutzer/ohne Identität und alle gesperrten Zustände aus FEAT-010.
- [ ] Bei 320/390/768/1440 CSS-Pixeln, hell/dunkel sowie 200 % und 400 % Zoom prüfen: jede Hauptantwort vollständig erreichbar, kein Seitenscroll für Terminzeilen/Controls, keine Überlagerung oder abgeschnittenen Labels.
- [ ] Playwright misst getBoundingClientRect aller Antwortlabels und Hauptaktionen: beide Maße mindestens 44. ScrollWidth gegen ClientWidth für die Terminliste prüfen; die Desktop-Datentabelle darf die Hauptantworten nicht verbergen.
- [ ] E2E mit Tastatur: Tab in Gruppe, Pfeiltaste, gespeicherte Serverantwort abwarten, Fokus bleibt zugeordnet; anschließend Fehler und 409 simulieren. Abschließender Ablauf gegen isolierte echte Testdaten.
- [ ] Manuelle VoiceOver-Abnahme in Safari: Datum/Gruppe, Optionsname, Auswahl, Busy-/Erfolgs-/Fehlermeldung und gesperrten Zustand vorlesen lassen. Tatsächlich verwendeten Browser und Prüfergebnis dokumentieren. Ein axe-Lauf oder reine ARIA-Quellprüfung ersetzt diesen Nachweis nicht.
- [ ] Impeccable adapt/audit anhand der Skill-Referenzen ausführen; der CLI-Befehl ist detect, nicht audit. Automatische Hookbefunde und manuelle Layout-/Kontrastbefunde getrennt dokumentieren. Wenn keine automatische Renderprüfung aktiv ist, detect gegen die lokale gerenderte Ansicht ausführen.
- [ ] npm run test, npm run typecheck, npm run lint, npm run build und npm run security-check ausführen. Keine neue API, keine Datenbankmigration.
- [ ] docs/FEATURE-BACKLOG.md, docs/FEATURES.md, CONCEPT.md, src/lib/faq.ts und src/lib/changelog.ts aktualisieren. BUG-038/039 erst schließen, wenn alle jeweils genannten Flächen und beide Themes geprüft sind.
- [ ] Commit, npm run review-evaluate:regression sowie Snapshot, Bewertung und Prozessanpassungen unter docs/code-reviews/ aktualisieren.

## 5. Abnahmegrenze

Das Feature gilt erst als abgenommen, wenn die Hauptantworten mobil ohne horizontales Scrollen bedienbar sind, eine echte gespeicherte Auswahl semantisch erkennbar ist und Kontrast-/Touchmessungen sowie Tastatur- und VoiceOver-Prüfung vorliegen. Ein fehlender manueller Screenreadertest bleibt offen dokumentiert. Native iOS-Terminoberflächen sind nicht Bestandteil dieses Webplans.

### Umsetzungsnachweis – 2026-11-01

- Implementiert: gemeinsames Availability-Modell, native Radiogruppe, Terminzeile und Teilnehmerliste; öffentliche und geschützte Ansichten verwenden dieselben Controls.
- Geprüft: gesamte Unit-Suite (763 Tests beim Lauf), Build, TypeScript, Security-Check und gezielte E2E mit isolierter PostgreSQL-Datenbank. Browser misst 320/390/768/1440 CSS-Pixel sowie 195- und 98-Pixel-Äquivalente, Touchziele und eine per Pfeiltaste gespeicherte Antwort.
- Bei 98 CSS-Pixeln wird die Terminfläche separat geprüft; die gesamte öffentliche Eventseite hat dort weiterhin Überlauf in anderen Bereichen. 320/390/768/1440 und 195 px wurden ohne Dokumentüberlauf geprüft.
- Noch offen: vollständige Dark-Theme-Kontrastmessung, Fehler-/409-/Fokusretentions-E2E und manuelle VoiceOver-Abnahme. BUG-038 ist bis zur assistiven und Theme-Abnahme in Bearbeitung; BUG-039 bleibt offen.
