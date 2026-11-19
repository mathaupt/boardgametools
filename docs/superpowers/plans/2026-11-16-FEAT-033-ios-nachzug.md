# FEAT-033 – iOS-Nachzug und Weboptimierung: Umsetzungsplan

**Ziel:** Den nativen Client schrittweise an den bestätigten Webumfang angleichen
und die im Audit belegten Webprobleme beheben.

**Status:** Paket A–C am 16.11.2026 durch „Umsetzung A-C“ ausdrücklich freigegeben. Webpaket FEAT-034 und weitere Plattformpakete sind nicht Teil dieser Freigabe.
**Ausführung:** Schrittweise in derselben Sitzung, ohne Agentendelegation.
**Architektur:** SwiftUI → RemoteDataSource → authentifizierte Mobile-API;
SwiftData bewahrt Serverdaten verlustfrei. Der Server entscheidet über Identität,
Besitz und Eventstatus. Club Programme und native Systemnavigation bleiben bestehen.

## Aktualitätsprüfung am 16.11.2026

- HEAD `92b9949`; vor Prüfung keine uncommittierten Änderungen.
- Web einschließlich FEAT-031 im Repository vorhanden; kein neuer
  Produktionsdeploymentnachweis in diesem Lauf.
- Bestehende iOS-Pläne vom 01.11.2026 geprüft: BUG-053 ist inzwischen als behoben
  dokumentiert. Daraus folgt keine automatische Abnahme des nativen Cookiepfads.
- Swift-Verträge bestehen, decken nullable Session-Spielbezüge aber nicht ab.
  Gezielte Kompilierung der echten DTO reproduziert den Dekodierungsfehler.
- Vollständige Websuite: 19 Fehler wegen abgelaufener Fixtures; vor einem
  Implementierungscommit beheben. Kein Datenbankschemawechsel für Paket A nötig.

## Aktualitätsprüfung unmittelbar vor Umsetzung

16.11.2026: HEAD `4242e9e`, sauberer Arbeitsbaum; seit Planvorlage nur der
Audit-/Plancommit hinzugekommen. API-/Swiftverträge unverändert. A–C gelten wie
vorgelegt. Neue Swiftdateien werden im Vertragsrunner und Xcode-Projekt erfasst.

## Ansatz und Umfang

Empfohlen ist ein Nachzug in abnehmbaren Paketen. Ein vollständiger Umbau in einem
Commit erschwert die Eingrenzung von Vertragsfehlern. Ein reiner optischer Nachzug
lässt dagegen den reproduzierten Synchronisationsfehler bestehen.

### Paket A – Datenvertrag und verlässliche Prüfungen (zuerst)

Dateien: `Networking/DTOs.swift`, `Models/LocalSession.swift`,
`BoardGameToolsTests/BoardGameToolsTests.swift`; die drei Testdateien aus BUG-082.
Pfadpräfix für Swiftdateien: `BoardGameTools/BoardGameTools/`.

- [x] **RED:** Im tatsächlichen Swift-Runner eine API-Fixture mit `gameId: null`,
  Spiel-Snapshot und Gastmitspielern ergänzen. `npm run test:ios:contracts` muss
  vor Änderung mit `valueNotFound` für `gameId` fehlschlagen.
- [x] **GREEN:** `SessionDTO.gameId` und `LocalSession.gameId` optional machen;
  Snapshotfelder und Gastmitspieler gemäß `src/lib/sync-types.ts` abbilden.
  In-Memory-SwiftData speichern, neu laden und `toDTO()` auf identische
  Snapshot-/Gastdaten prüfen. Alte Antworten ohne Zusatzfelder bleiben lesbar.
- [x] **REFACTOR:** Gemeinsame Sessionanzeige aus Relation/Snapshot ableiten.
  `SessionEditView` erhält bei fehlendem Spielbezug keine erfundene ID; bestehende
  Gäste oder Snapshots dürfen beim Bearbeiten nicht unbemerkt verloren gehen.
  Bis der vollständige Bearbeitungsvertrag besteht, solche Sessions nur lesen.
- [x] **RED-Nachweis BUG-082:** Die drei betroffenen Dateien einzeln ausführen:
  `npx vitest run tests/unit/api/event-state-guards.test.ts tests/unit/lib/services/event.test.ts tests/unit/app/api/mobile/v1/events.test.ts`.
  Erwartet vor Korrektur: 19 lifecyclebedingte Fehler am 16.11.2026.
- [x] **GREEN:** Testuhr auf einen definierten Zeitpunkt vor den Fixtureevents
  setzen (`vi.useFakeTimers({ toFake: ["Date"] })`,
  `vi.setSystemTime(new Date("2026-11-01T12:00:00Z"))`), in `afterEach`
  `vi.useRealTimers()` wiederherstellen. Explizite Past-Event-Fälle beibehalten.
- [x] **REFACTOR:** Fixtureuhr statt beweglicher Zukunftsdaten dokumentieren;
  obigen Befehl und `npm run test` grün nachweisen.

### Paket B – Native Sessions und Eventvoting

- [x] Den vorhandenen Plan `2026-11-01-ios-FEAT-001-004-voting.md` aktualisieren:
  aktuelle Proposalantworten, Bearbeitungsrechte, gespeichertes Ergebnis und
  Mutation nach bestätigtem Nachladen. Eventdetail in kleine Komponenten teilen.
- [x] **RED:** Swift-Verträge für Gesamtstimmen, stabile Sortierung, eigene
  Stimme, Löschrechte und geschlossenes Event ergänzen; fehlschlagen lassen.
- [x] **GREEN:** Authentifiziertes Voting mit Detailsheet, Sortierauswahl,
  Bestätigung für Löschen, sichtbaren Fehlern und Retry umsetzen.
- [x] Session-Spielauswahl in ein suchbares natives Sheet auslagern; ausschließlich
  vorhandene IDs übernehmen. **RED:** Suchnormalisierung und Auswahlvertrag mit
  leerer Liste und gleichnamigen Spielen testen. **GREEN:** Filter und Auswahl
  ergänzen. **REFACTOR:** Eine gemeinsame aufgelöste Spielansicht für Übersicht,
  Liste und Detail nutzen; Coverfallback und Snapshotdaten berücksichtigen.
- [x] `npm run test:ios:contracts`, Simulatorbuild und gerenderte Prüfungen für Hell/Dunkel und große Schrift. Accessibility-Baum für Suche, Details und Fehler geprüft; eine vollständige gesprochene VoiceOver-Abnahme auf echter Hardware bleibt als manuelle Abnahme offen.

### Paket C – BGG und Spielereihen

- [x] **RED:** Mobile-API-Tests für wiederholten Import, kontofremden Bestand,
  parallelen Import und Erhalt selbst bearbeiteter Daten (BUG-083).
- [x] **GREEN:** Mobileimport an `createOrReuseBggGame` anbinden; optionale
  BGG-Ausgabenwahl nur mit geprüfter Zuordnung zum Hauptspiel.
- [x] **RED/GREEN:** Native Suchzustände idle/loading/empty/results/error und
  verspätete Antworten testen und implementieren; aktive Importe gegen Doppeltipp
  schützen. Bestandsprüfung muss erfolgreich sein, bevor ein Import freigegeben wird.
- [x] Reihen: Mehrfachauswahl, temporäre Nutzung und Sammlungsübernahme gemäß
  FEAT-024/025; **RED:** DTO-/SwiftData-Roundtrip ohne Sammlungsspiel, Duplikate und
  409 mit anschließendem Listenabgleich. **GREEN:** explizite Auswahlmodi.
- [x] **REFACTOR:** Geteilte Such-/Statusregeln ohne zweite Netzwerkimplementierung;
  API-, Swift- und Simulatorprüfungen, OpenAPI und Featuredokumentation aktualisieren.

### Weitere getrennt abzunehmende Pakete

- **Eventpartien FEAT-029/031:** Typisierte Mobile-Routen mit `apiAuth`,
  Erstellerprüfung und API-Validierung; Quelle Vorschlag/Sammlung/BGG, Snapshot und
  Gäste. RED für jede Quelle sowie 401/403/404/409, GREEN für Server und SwiftUI,
  REFACTOR gemeinsamer Spielauswahl. Keine neue Datenbankmigration voraussetzen.
- **Öffentliche Events FEAT-010–013:** Vorhandenen iOS-Plan mit Cookiebesitznachweis
  aktualisieren; RED für Cookieempfang, Wiederaufnahme, Token-/Backendwechsel und
  getrennte Kontoidentität. Erst nach GREEN Terminwahl und Gastmutationen aktivieren.
- **Abzeichen FEAT-028/032:** Neue mobile API-Verträge vor UI-Umsetzung planen;
  private Übersicht und Bedingungen zuerst, öffentliche Profile und freiwillige
  Gruppen-Challenges mit unverändertem Opt-in/Widerruf getrennt prüfen.
- **Sprache FEAT-019:** Plattformkonzept separat vorlegen; kein Mikrofonstart oder
  automatisches Speichern. Native Diktierfunktion bevorzugt prüfen, keine stillen
  Audio-/Transkriptpersistenzen ergänzen.

Für diese weiteren Pakete wird vor dem jeweiligen Beginn ein konkreter API-/UI-
Detailplan mit Fixtures und Abnahmekriterien ergänzt und vorgelegt. Paket A–C
ersetzt keine separate Freigabe neuer öffentlicher Datenflüsse oder Audiobearbeitung.

## Webpaket FEAT-034

- [x] BUG-081: **RED** Komponententest mit einer Kontostimme und zwei
  Gaststimmen erwartet „3 Stimmen“; **GREEN** Query, Typ und Anzeige zählen beide;
  **REFACTOR** denselben Stimmenvertrag wie Dashboard/Voting verwenden.
  Nachweis 19.11.2026: `npx vitest run tests/unit/components/events-overview.test.tsx` bestanden.
- [x] BUG-080: **RED** Seitentest für mindestens 21 Sessions, Seite 2 und fremde
  Konten; **GREEN** `page` parsen, serverseitig begrenzen und mit stabiler
  `playedAt`-/ID-Reihenfolge abfragen, URL-Navigation und Gesamtzahl anzeigen;
  **REFACTOR** Paginationdarstellung bei passendem Vertrag wiederverwenden.
  Nachweis 19.11.2026: `npx vitest run tests/unit/components/sessions-page.test.tsx` bestanden; Seitengrenzen, Eigentümerfilter, seitengetrennte Cache-Schlüssel und Navigation in beide Richtungen abgedeckt. Browserbelege für 320/390/768/1440 px in Hell und Dunkel: `.impeccable/critique/2026-11-19-sessions-pagination/` (emulierte Viewports, Chromium; keine Screenreader-Hardwareabnahme).
- [x] Eventlistenquery auf tatsächlich benötigte Felder reduzieren; **RED**
  Queryvertrag und sichtbare Vorschlagszahlen testen, **GREEN** `select` und
  begrenzte Vorschau, **REFACTOR** keine zusätzlichen Summarytypen nötig. Nachweis
  19.11.2026: `npx vitest run tests/unit/components/events-overview.test.tsx
  tests/unit/components/events-page-query.test.tsx` plus
  `tests/unit/lib/changelog.test.ts`; die vollständige Suite besteht mit 1.479
  Tests in 235 Dateien. Typprüfung, gezielter ESLint, Securitycheck und Build
  bestanden. Renderbelege für 320/390/768/1440 px in Hell und Dunkel unter
  `.impeccable/critique/2026-11-19-feat034/`.
- [x] Hono-Entwicklungspfad gezielt und ohne `audit fix --force` aktualisieren.
  Hono ist am 19.11.2026 auf `hono@4.13.19` und `@hono/node-server@2.1.9` aktualisiert; vollständiger Installationsaudit meldete danach 0 Befunde (BUG-090).
- [x] ESLint-Werkzeugausnahmen eng begrenzen und Runnerwarnungen prüfen.
  RED: eine versionierte Impeccable-Kopie hatte 15 Warnungen. GREEN: sieben
  explizite Spiegelpfade plus `.impeccable/preview/**` ignorieren ausschließlich
  Werkzeug-/Vorschaudateien; `npm run lint` besteht mit 0 Warnungen.
- [ ] Gerenderte Webabnahme auf lokaler isolierter Testdatenbank: 320/390/768/1440 px,
  beide Themes, große Schrift, Tastatur, Laden/Fehler/leer und Pagination. Keine
  Testdaten in Produktionsdatenbanken anlegen.

**Rendernachweis 19.11.2026:** Synthetische Vorschau in Chromium für gefüllte
Eventkarten und Sessions-Laden/Fehler/Leer/Paginierung; 320/390/768/1440 px in
Hell/Dunkel, 200-%-Zoom mit 195 CSS-Pixeln, große Schrift und Tastaturfokus ohne
Überlauf. CUA-Browserhost fehlte. Die isolierte Datenbankprüfung bleibt deshalb
als eigenständige Abschlussbedingung offen.

## Gemeinsame Abschlussbedingungen

- [x] Vor jeder Paketumsetzung HEAD, Arbeitsbaum und API-Verträge erneut prüfen.
- [x] UI-Änderungen mit Impeccable prüfen; tatsächliche gerenderte Web-/Simulator-
  Belege und Grenzen dokumentieren. Native 44-pt-Ziele und Dynamic Type beachten.
- [x] Auth, Objektbindung, Validierung und Datenschutz pro betroffenem API-Pfad
  gezielt testen; Serverrechte niemals aus sichtbaren Buttons ableiten.
- [x] Changelog, Bugs, Features, Backlog und gegebenenfalls OpenAPI/FAQ/Concept
  aktualisieren; Coveragewerte ausschließlich aus vollständiger Messung übernehmen.
- [x] `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run test:ios:contracts`, `npm run security-check:fast` und
  `npm run review-evaluate:regression` bestehen. Build nach Webruntimeänderungen.
- [x] Änderungen committen, Evaluator ausführen und Review-Snapshot, Bewertung
  sowie Prozessanpassungen mit tatsächlichen Ergebnissen aktualisieren.
  Veröffentlichung, Migration und Store-Release sind eigene Betriebsaktionen.


## Fortsetzung und Abschlussprüfung am 17.11.2026

Die Freigabe A–C besteht fort. HEAD weiterhin `4242e9e`; der Arbeitsbaum enthält
nur die begonnenen A–C-Änderungen und zugehörige Dokumentation. Kein paralleler
Produkt-/Deploymentwechsel festgestellt. Der Web-Build ist erfolgreich; die
vollständige Websuite und Coverage lagen vor dem letzten Kompatibilitätstest bei
1.456 Tests und 85,07/80,23/84,59/87,38 %. Der abschließende Messlauf nach `sortOrder`-Absicherung besteht mit 1.461 Tests
in 233 Dateien und 85,08/80,27/84,59/87,39 %. Xcode bestätigt zehn erfolgreiche
Swift-Tests im echten Simulator-Testziel. Die native Prüfung verwendet eine separate Prüfapp
mit echten Views, In-Memory-SwiftData und ausschließlich synthetischen lokalen
API-Antworten. Kein Produktionskonto und keine Produktionsdatenbank verwendet.

**Abschlussstand 17.11.2026:** Webbuild und Xcode-Testziel erfolgreich; elf gezielte Changelog-/FAQ-Tests nach Dokumentationspflege bestanden. Globale ESLint-Prüfung ohne Fehler mit 652 bestehenden Werkzeugwarnungen; Securityprüfung ohne Fehler, Review-Regressionscheck 9,9/10 ohne Regression. Vollständige Hardware-/VoiceOver-Abnahme sowie Veröffentlichung bleiben ausdrücklich offen.


**Zwischenstand des Reviews:** Commit `460ab89` und Nachlauf bestätigen keine
Regression. Der Evaluator meldet „Coverage Regression Tracking“ wegen fehlender
Coveragefelder in älteren Review-History-Snapshots; dadurch 9,9/10 statt des
vorläufigen 10/10. Die realen aktuellen Coveragewerte sind separat vollständig
gemessen und in `src/data/quality-metrics.json` enthalten. Historische Werte
werden nicht erfunden oder nachträglich hochgesetzt.


**Bestätigter letzter Nachlauf:** `history/2026-11-17_1146.json` und das zugehörige Evaluatorprotokoll melden 10/10 ohne Regression und ohne neue Hinweise. Am 18.11.2026 wurde dieser vorhandene Nachweis gegen Commitstand und unveränderten Runtimecode geprüft. Die zuvor dokumentierten 9,9/10 bleiben als historischer Zwischenstand erhalten.


**Auditfortschreibung 18.11.2026:** Der Runtimecode ist unverändert. Der aktuelle Produktionsaudit meldet einen moderaten Next.js-Paketbefund (BUG-088), ohne hohe/kritische Produktionsbefunde. Der erfolgreiche Stand vom 17.11.2026 ist ein historischer Nachweis; das erforderliche Framework-Patchupdate bleibt separate Folgearbeit.

**BUG-088-Nachlauf 19.11.2026:** Next.js, `eslint-config-next` und `@next/bundle-analyzer` auf 16.4.6 aktualisiert. `npm audit --omit=dev` bestätigt keine Produktionsbefunde. Der vollständige FEAT-034-Queryumfang bleibt unabhängig davon offen.

**Aktualitätsprüfung und FEAT-034-Queryreduktion 19.11.2026:** Unmittelbar vor
Umsetzung HEAD `9bb2f42`; der Arbeitsbaum enthielt nur den Evaluator-Nachtrag in
`docs/code-reviews/regressions.md`. Aktuelle Prisma-Felder und sichtbarer Vertrag
der Eventübersicht geprüft. Ergebnis: Eigentümerfilter, Cache und Abfragegrenzen
bleiben unverändert; Vorschläge werden auf drei Datensätze und benötigte Felder
begrenzt. Vollständige FEAT-034-Abnahme und ESLint-Werkzeugbereinigung bleiben
offen.

Aktueller Review-Regressionscheck am 18.11.2026 bestanden (Exit 0), 9,9/10; docs/code-reviews/history/2026-11-18_0806.json.
