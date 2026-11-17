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

- [ ] BUG-081 zuerst: **RED** Komponententest mit einer Kontostimme und zwei
  Gaststimmen erwartet „3 Stimmen“; **GREEN** Query, Typ und Anzeige zählen beide;
  **REFACTOR** denselben Stimmenvertrag wie Dashboard/Voting verwenden.
  Befehl: `npx vitest run tests/unit/components/club-dashboard.test.tsx` plus neue
  zielgerichtete Eventübersichttests in derselben Testsuite.
- [ ] BUG-080: **RED** Seitentest für mindestens 21 Sessions, Seite 2 und fremde
  Konten; **GREEN** `page` parsen, serverseitig begrenzen und mit stabiler
  `playedAt`-/ID-Reihenfolge abfragen, URL-Navigation und Gesamtzahl anzeigen;
  **REFACTOR** Paginationdarstellung bei passendem Vertrag wiederverwenden.
  Befehl: `npx vitest run tests/unit/components/sessions-page.test.tsx`.
- [ ] Eventlistenquery auf tatsächlich benötigte Felder reduzieren; **RED**
  Queryvertrag und sichtbare Teilnehmer-/Vorschlagszahlen testen, **GREEN** `select`
  und begrenzte Vorschau, **REFACTOR** gemeinsame Summarytypen.
- [ ] ESLint-Werkzeugausnahmen eng begrenzen und tatsächliche Runnerausgabe prüfen.
  Hono-Entwicklungspfad gezielt aktualisieren, ohne `audit fix --force`; vorab
  Dependency-Impact und Evaluatorreport, danach Typprüfung, Lint, Tests und Build.
- [ ] Gerenderte Webabnahme auf lokaler isolierter Testdatenbank: 320/390/768/1440 px,
  beide Themes, große Schrift, Tastatur, Laden/Fehler/leer und Pagination. Keine
  Testdaten in Produktionsdatenbanken anlegen.

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


**Finaler Reviewhinweis:** Commit `460ab89` und Nachlauf bestätigen keine
Regression. Der Evaluator meldet „Coverage Regression Tracking“ wegen fehlender
Coveragefelder in älteren Review-History-Snapshots; dadurch 9,9/10 statt des
vorläufigen 10/10. Die realen aktuellen Coveragewerte sind separat vollständig
gemessen und in `src/data/quality-metrics.json` enthalten. Historische Werte
werden nicht erfunden oder nachträglich hochgesetzt.
