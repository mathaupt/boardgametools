# FEAT-012 – Teilnahme vor passive Listen rücken

**Status (2026-11-01):** Web-Implementierung und automatisierte Code-Abnahme abgeschlossen. Browser-E2E und visuelle Abnahme bei 390/1440 px, Hell/Dunkel und 200 % Zoom stehen noch aus. Umsetzung gemäß ausdrücklicher Freigabe vom 2026-11-01.

**Aktualitätsprüfung vor Umsetzung:** FEAT-013 wurde parallel umgesetzt und stellt den gemeinsamen Actor bereit; FEAT-012 verwendet ihn für die persönliche Zusammenfassung und Beitrittsaktion. FEAT-014 hatte inzwischen die tokengebundene Katalogroute und Konfliktbehandlung ergänzt; diese Zustandsprüfung bleibt erhalten. BUG-041 bleibt bis zur gerenderten Rasterprüfung in Bearbeitung. BUG-053 bleibt offen, da kein sicherer Gastbesitznachweis Teil dieser Features ist.

**Implementierungsnachweis:** Unit-Suite 822/822, Typecheck, Lint (0 Fehler), Build, Security-Check und OpenAPI-Parsing erfolgreich. iOS-Vertragstest separat dokumentiert. Keine Browser-Viewport-Abnahme behauptet.

**Ziel:** Öffentliche Gäste erreichen Beitritt und Spielauswahl unmittelbar nach Termin und Ort; Teilnehmerinformationen erscheinen einmal und bleiben nach erfolgreichen Aktionen konsistent.

**Architektur:** Die Serverseite lädt und autorisiert das Event wie bisher. Ein zusammenhängender Clientbereich führt Teilnahme, Spielauswahl, Terminabstimmung und eine einzige Teilnehmerdarstellung. Gastliste und Vorschlagsdaten werden zentral gehalten; Registrierungsformular und Teilnehmerliste sind getrennte Präsentationskomponenten.

**Technik:** Next.js 16, React/TypeScript, bestehende shadcn/ui-Bausteine, Club Programme, Vitest/Testing Library und CodeceptJS/Playwright.

**Abarbeitung:** Nach ausdrücklicher Freigabe testgetrieben in kleinen Schritten, jeweils prüfen und committen. Keine automatische Delegation.

## 1. Bestand und Abgrenzung

- src/app/public/event/[token]/page.tsx zeigt Einladungen, Gäste und Teilnahmeerklärung vor PublicEventClient. Bei 390 × 900 lagen Gastbeitritt und Spielauswahl im ursprünglichen Assessment deutlich unter dem ersten Bildschirm.
- Die Seite verwendet lg:grid-cols-[2fr,1fr]; das vorgesehene Desktop-Raster wurde nicht wirksam (BUG-041).
- GuestRegistrationPanel besitzt eine eigene guestList. Die Serverpage rendert dieselben Gäste unabhängig ein zweites Mal. Nach einem Beitritt aktualisiert sich nur eine Darstellung; Stimmenzahlen laufen ebenfalls auseinander (BUG-042).
- Die kompakte Spielzeile aus FEAT-003 und der Detaildialog aus FEAT-001 sind bereits umgesetzt und werden weiterverwendet.
- Keine allgemeine Dashboard-/iOS-Neugestaltung, kein Teilnehmermanagement und keine Zusammenführung von Konten/Gästen.

**Abhängigkeiten:** FEAT-010 liefert Status und verbindlichen Termin; FEAT-011 die zugängliche Terminbedienung. Die Identitätsanzeige übernimmt den Vertrag aus FEAT-013, sofern dieser vorher umgesetzt ist. Ohne FEAT-013 bleiben die bestehenden Konten-/Gast-Props als Adapter erhalten; keine zweite Identitätslogik in FEAT-012 entwickeln. Die Layoutarbeit kann unabhängig vorbereitet werden; die gemeinsame Veröffentlichung muss dieselben Verträge verwenden.

## 2. Vorgeschlagener Seitenaufbau

1. Eventkopf mit Titel, Status, verbindlichem beziehungsweise vorläufigem Termin, Ort und gespeichertem Ergebnis aus FEAT-010.
2. Aktive Identität beziehungsweise Gastbeitritt direkt darunter. Keine allgemeine Teilnahmeerklärung als eigene vorausgehende Karte.
3. Beschriftete Sprunglinks „Spiele wählen“, „Termine beantworten“ und „Teilnehmende“ zu den vorhandenen Abschnitten; nur tatsächlich vorhandene Abschnitte verlinken.
4. Spielvorschläge mit der bestehenden kompakten Liste, Sortierung und Detailzugang.
5. Terminantworten; danach vorhandene Sammlung-/BGG-Vorschlagsmöglichkeiten.
6. Teilnehmende und Einladungen als eine gemeinsame passive Übersicht.
7. Kleine persönliche Zusammenfassung „Deine Auswahl“ mit gespeicherten eigenen Spielstimmen und Terminantworten sowie Sprunglinks zum Bearbeiten.

Desktop: gültiges Raster aus Hauptbereich und Teilnehmer-Seitenbereich, etwa lg:grid-cols-[minmax(0,2fr)_minmax(16rem,1fr)]. Der Hauptbereich steht in der DOM-Reihenfolge zuerst; mobil folgt die Teilnehmerübersicht nach den Aktionen. Kein zweites Gästelisten-Exemplar für den Desktop.

Lange Beschreibung: nach drei Textzeilen über „Beschreibung anzeigen“ vollständig aufklappbar. Titel, Termin, Ort, Ergebnis und Sperrgrund niemals einkürzen. Kein zusätzlicher Aufklappzustand für die eigentliche Gastteilnahme.

**Messbare Abnahme:** Bei der repräsentativen Fixture mit zweizeiligem Titel, 500 Zeichen Beschreibung, zehn Vorschlägen und 30 Teilnehmern ist bei 390 × 900 der Beitrittsbutton einschließlich Ziel vollständig sichtbar. Nach Beitritt sind „Spiele wählen“ und die erste Spielaktion ohne Teilnehmerliste dazwischen erreichbar. Die Sprungaktion zur Spielauswahl ist bereits vor dem Beitritt im ersten Bildschirm sichtbar. Extrem lange Titel müssen vollständig lesbar bleiben; für diese Stressfälle wird keine starre Pixelposition behauptet.

## 3. Zustands- und Datenvertrag

- PublicEventClient hält die einzige aktuelle guestParticipants-Liste sowie Vorschläge/Sortierung. Gäste werden anhand ihrer ID zusammengeführt, niemals anhand des sichtbaren Namens.
- GuestRegistrationPanel wird ein Formular-/Identitätsbereich ohne eigene Teilnehmerliste und ohne Kopie der guestParticipants-Daten.
- Nach Beitritt liefert der Server einen öffentlichen Guest-Datensatz mit id, nickname, createdAt und votesCount. Der Zähler stammt aus dem Server, nicht aus einem pauschalen Nullwert bei bestehender Registrierung.
- Nach erfolgreicher Gaststimme wird der lokale Zähler genau einmal angepasst und ein frischer öffentlicher Snapshot abgeglichen. Bei fehlgeschlagener Aktion bleiben alle Zahlen unverändert.
- Eine fehlgeschlagene Nachladeanfrage macht einen erfolgreichen Beitritt nicht rückgängig. Anzeige „Teilnehmerliste konnte noch nicht aktualisiert werden“ mit Wiederholen statt erneutem Registrieren.
- Snapshot-Requests erhalten eine Sequenz/AbortController. Ältere Antworten dürfen neuere Aktionen nicht überschreiben. Sortierung, Fokus und Listenposition bleiben beim Datenabgleich erhalten.
- Keine Live-Synchronisation zwischen verschiedenen Geräten versprechen. Diese Ansicht aktualisiert nach eigener erfolgreicher Aktion und beim expliziten Aktualisieren.
- Die persönliche Zusammenfassung enthält nur der aktiven Identität zugeordnete Antworten. Keine Antworten aus ungültigen oder eventfremden LocalStorage-IDs oder von einer anderen angemeldeten Person übernehmen. Gastmarkierungen aus dem bestehenden Gerätestate nicht als neuen serverseitigen Besitznachweis ausgeben; nach eigenen Aktionen nur bestätigte Antworten ergänzen.

Öffentlicher Datensatz:

```ts
export interface PublicGuest {
  id: string;
  nickname: string;
  createdAt: string;
  votesCount: number;
}
```

PublicGuest aus src/lib/public-event.ts exportieren und in types.ts sowie dem reinen Teilnehmerhelper per type-Import verwenden; keine zweite abweichende Gastdefinition anlegen.

## 4. Dateien

| Datei | Aufgabe |
|---|---|
| src/app/public/event/[token]/page.tsx | Serverabfrage und Kopf erhalten; doppelte Teilnehmer-/Erklärungskarten entfernen |
| src/components/public-event/public-event-client.tsx | Einzige Teilnehmerquelle, Reihenfolge und Snapshotabgleich |
| src/components/public-event/guest-registration-panel.tsx | Teilnahmeformular ohne eigene Gästeliste |
| src/components/public-event/participants-section.tsx | Neue gemeinsame Einladungs-/Gastübersicht |
| src/components/public-event/public-event-section-links.tsx | Neue beschriftete Sprungnavigation |
| src/components/public-event/personal-selection-summary.tsx | Neue persönliche Zusammenfassung aus bestehenden Antworten |
| src/lib/events/public-participants.ts | Neue reine ID-basierte Zusammenführung und Zählerregeln |
| src/lib/public-event.ts, src/components/public-event/types.ts | Gemeinsamen öffentlichen Guest-Vertrag verwenden |
| src/app/api/public/event/[token]/join/route.ts | Öffentliches DTO einschließlich tatsächlicher Stimmenzahl zurückgeben |
| src/app/api/public/event/[token]/route.ts | Konsistenten öffentlichen Snapshot verwenden; vorhandene Datenschutzgrenzen erhalten |

Kein neues Datenbankschema und kein zusätzlicher allgemeiner Teilnehmerendpunkt.

## 5. Aufgaben

### Aufgabe 1 – Teilnehmerzusammenführung und öffentliche Antwort absichern

**Neu:** tests/unit/lib/public-participants.test.ts. **Erweitern:** tests/unit/api/public-event.test.ts und tests/unit/lib/public-event.test.ts.

- [ ] Vorlauf npm run review-evaluate:report; bekannte Audit-/Evaluatorbefunde BUG-050/051 getrennt vom Featurestand behandeln.
- [ ] Verhaltenstest zuerst schreiben:

```ts
it("führt denselben Gast einmal zusammen und erhält echte Zähler", () => {
  const oldGuest = { id: "g1", nickname: "Alex", createdAt: "2026-10-31T10:00:00Z", votesCount: 3 };
  const updatedGuest = { ...oldGuest, votesCount: 4 };
  expect(upsertPublicGuest([oldGuest], updatedGuest)).toEqual([updatedGuest]);
  expect(upsertPublicGuest([oldGuest], updatedGuest)).toHaveLength(1);
});
```

- [ ] Zusätzlich: gleichlautende Namen mit verschiedenen IDs, neuer Gast, unveränderliche Eingaben, fehlgeschlagene Stimme ohne Zähleränderung und bestehender Gast mit bereits vorhandenen Stimmen.
- [ ] npx vitest run tests/unit/lib/public-participants.test.ts tests/unit/api/public-event.test.ts tests/unit/lib/public-event.test.ts ausführen; roten Ausgangspunkt dokumentieren.
- [ ] upsertPublicGuest(items: readonly PublicGuest[], guest: PublicGuest): PublicGuest[] implementieren: neue Kopie, Ersatz per ID oder Ergänzung, Reihenfolge createdAt aufsteigend und ID als letzter Vergleich.
- [ ] join-Antwort mit gezieltem Prisma-select und _count.votes serialisieren. Keine E-Mails, privaten Profile oder Rohrelationen ergänzen. Native Re-Export-Antwort bleibt additiv kompatibel.
- [ ] Tests grün ausführen. Commit: refactor: unify public guest participant data.

### Aufgabe 2 – Eine Teilnehmerquelle und kompakter Teilnahmeweg

**Neu:** tests/unit/components/public-event-flow.test.tsx. **Erweitern:** tests/unit/components/guest-registration.test.tsx.

- [ ] Vor Umbau testen: Gastname erscheint genau einmal in der Teilnehmerliste, Beitrittsformular liegt vor ihr, erfolgreiche Registrierung ergänzt dieselbe Liste und zweite Snapshotantwort überschreibt keinen neueren Zustand.
- [ ] GuestRegistrationPanel von guestList/initialGuestList entkoppeln. Das Formular meldet den vom Server bestätigten PublicGuest an den Parent; Identitäts-Persistenz bleibt im bestehenden beziehungsweise FEAT-013-Adapter.
- [ ] Alle Teilnehmer-/Einladungsdarstellung nach participants-section.tsx verschieben. Serverpage rendert keine zweite Kopie. Öffentliche Namensfreigaben aus der bestehenden Serialisierung erhalten.
- [ ] Grid und DOM-Reihenfolge gemäß Abschnitt 2 implementieren. Ungültige Komma-Syntax beseitigen; tatsächliche zwei Spalten im Browser prüfen.
- [ ] Erfolgreiche eigene Mutationen mit GET /api/public/event/[token] abgleichen; Fehler bei diesem Abgleich separat vom bereits erfolgreichen Write behandeln.
- [ ] Beschreibungsaufklappung mit aria-expanded und stabiler ID, Sprungnavigation mit sinnvollen Fokuszielen und scroll-margin implementieren. Kein automatischer Scrollsprung allein durch Hydration.
- [ ] Tests grün ausführen. Commit: feat: prioritize public event participation.

### Aufgabe 3 – Persönliche Auswahl übersichtlich zusammenfassen

**Neu:** tests/unit/components/personal-selection-summary.test.tsx.

- [ ] Tests zuerst: Nutzer-/Gastantworten getrennt, keine Auswahl, mehrere Spielstimmen, Terminantworten Ja/Vielleicht/Nein, geschlossener Zustand und Identitätswechsel ohne fremde Restdaten.
- [ ] Zusammenfassung aus derselben Vorschlags-/Terminquelle ableiten; keinen weiteren beschreibbaren Auswahl-State anlegen.
- [ ] Namen vollständig umbrechen lassen. „Deine Auswahl“ nicht als verbindlichen Gewinner oder endgültigen Termin bezeichnen.
- [ ] Zusammenfassung enthält beschriftete Rücksprunglinks; Mutationscontrols nicht duplizieren. Ohne aktive Identität stattdessen kurzer Teilnahmehinweis mit Sprung zum Formular.
- [ ] Falls diese Übersicht bei der gerenderten Abnahme nur die Liste unnötig wiederholt, auf Anzahl und Bearbeitungslinks reduzieren; die dokumentierte Prüfung bleibt Teil des Features.
- [ ] Tests grün ausführen. Commit: feat: summarize personal public event choices.

### Aufgabe 4 – Layout, Konsistenz und Dokumentation abnehmen

- [ ] E2E in tests/e2e/public_event_participation_test.ts: vor/nach Beitritt, Gaststimme setzen/entfernen, Snapshotfehler und erneutes Laden mit echten isolierten Testdaten prüfen.
- [ ] Browserfixtures: 0/1/10/30 Vorschläge, 0/30/100 Teilnehmende, lange Titel/Namen, Beschreibung geöffnet/geschlossen, ohne Identität/Gast/Konto, offen/geschlossen/vergangen.
- [ ] 390 × 900 und 1440 × 900, hell/dunkel, 200 % Zoom: DOM-Reihenfolge, Beitrittsposition, sichtbare Sprunglinks, wirksames Desktopraster, einmalige Gäste, keine Überlagerung oder horizontales Seitenscrollen messen.
- [ ] Impeccable im bestätigten Club-Programme-Stil prüfen: vor UI-Änderung Craft-Floor, danach gerenderten Detektor und manuelle Hierarchieprüfung. Fokus, 44-px-Ziele, Kontrast und Screenreader-Namen beachten.
- [ ] npm run test, typecheck, lint, build und security-check ausführen. API-Antwortänderung in docs/openapi.yaml als additiv dokumentieren.
- [ ] BUG-041/042 erst nach nachgewiesenem Raster und konsistenter einmaliger Gastdarstellung schließen. Backlog, FEATURES, FAQ, CONCEPT und Changelog aktualisieren.
- [ ] Commit und Review-Regressionsprüfung; Snapshot, Bewertung und Prozessanpassungen unter docs/code-reviews/ aktualisieren. Bekannte Hookblocker nicht durch eine veränderte Baseline umgehen.

## 6. Abnahmegrenze

Erfolg ist am sichtbaren Teilnahmeweg und konsistenten Daten nach echten Aktionen belegt. Ein Screenshot ohne Beitritts-/Stimmenablauf genügt nicht. Die Erstellung dieses Plans ändert weder öffentliche Oberflächen noch die bestehende Gastauthentifizierung.
