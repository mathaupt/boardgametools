# FEAT-033 – iOS-Nachzug und Weboptimierung: Umsetzungsplan

**Ziel:** Den nativen Client schrittweise an den bestätigten Webumfang angleichen
und die im Audit belegten Webprobleme beheben.

**Status:** Zur konkreten Freigabe vorgelegt. Der Auftrag vom 16.11.2026 ist
erfasst; die nach Projektregel erforderliche Freigabe dieses neuen Plans steht aus.
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

## Ansatz und Umfang

Empfohlen ist ein Nachzug in abnehmbaren Paketen. Ein vollständiger Umbau in einem
Commit erschwert die Eingrenzung von Vertragsfehlern. Ein reiner optischer Nachzug
lässt dagegen den reproduzierten Synchronisationsfehler bestehen.

### Paket A – Datenvertrag und verlässliche Prüfungen (zuerst)

Dateien: `Networking/DTOs.swift`, `Models/LocalSession.swift`,
`BoardGameToolsTests/BoardGameToolsTests.swift`; die drei Testdateien aus BUG-082.
Pfadpräfix für Swiftdateien: `BoardGameTools/BoardGameTools/`.

- [ ] **RED:** Im tatsächlichen Swift-Runner eine API-Fixture mit `gameId: null`,
  Spiel-Snapshot und Gastmitspielern ergänzen. `npm run test:ios:contracts` muss
  vor Änderung mit `valueNotFound` für `gameId` fehlschlagen.
- [ ] **GREEN:** `SessionDTO.gameId` und `LocalSession.gameId` optional machen;
  Snapshotfelder und Gastmitspieler gemäß `src/lib/sync-types.ts` abbilden.
  In-Memory-SwiftData speichern, neu laden und `toDTO()` auf identische
  Snapshot-/Gastdaten prüfen. Alte Antworten ohne Zusatzfelder bleiben lesbar.
- [ ] **REFACTOR:** Gemeinsame Sessionanzeige aus Relation/Snapshot ableiten.
  `SessionEditView` erhält bei fehlendem Spielbezug keine erfundene ID; bestehende
  Gäste oder Snapshots dürfen beim Bearbeiten nicht unbemerkt verloren gehen.
  Bis der vollständige Bearbeitungsvertrag besteht, solche Sessions nur lesen.
- [ ] **RED-Nachweis BUG-082:** Die drei betroffenen Dateien einzeln ausführen:
  `npx vitest run tests/unit/api/event-state-guards.test.ts tests/unit/lib/services/event.test.ts tests/unit/app/api/mobile/v1/events.test.ts`.
  Erwartet vor Korrektur: 19 lifecyclebedingte Fehler am 16.11.2026.
- [ ] **GREEN:** Testuhr auf einen definierten Zeitpunkt vor den Fixtureevents
  setzen (`vi.useFakeTimers({ toFake: ["Date"] })`,
  `vi.setSystemTime(new Date("2026-11-01T12:00:00Z"))`), in `afterEach`
  `vi.useRealTimers()` wiederherstellen. Explizite Past-Event-Fälle beibehalten.
- [ ] **REFACTOR:** Fixtureuhr statt beweglicher Zukunftsdaten dokumentieren;
  obigen Befehl und `npm run test` grün nachweisen.

### Paket B – Native Sessions und Eventvoting

- [ ] Den vorhandenen Plan `2026-11-01-ios-FEAT-001-004-voting.md` aktualisieren:
  aktuelle Proposalantworten, Bearbeitungsrechte, gespeichertes Ergebnis und
  Mutation nach bestätigtem Nachladen. Eventdetail in kleine Komponenten teilen.
- [ ] **RED:** Swift-Verträge für Gesamtstimmen, stabile Sortierung, eigene
  Stimme, Löschrechte und geschlossenes Event ergänzen; fehlschlagen lassen.
- [ ] **GREEN:** Authentifiziertes Voting mit Detailsheet, Sortierauswahl,
  Bestätigung für Löschen, sichtbaren Fehlern und Retry umsetzen.
- [ ] Session-Spielauswahl in ein suchbares natives Sheet auslagern; ausschließlich
  vorhandene IDs übernehmen. **RED:** Suchnormalisierung und Auswahlvertrag mit
  leerer Liste und gleichnamigen Spielen testen. **GREEN:** Filter und Auswahl
  ergänzen. **REFACTOR:** Eine gemeinsame aufgelöste Spielansicht für Übersicht,
  Liste und Detail nutzen; Coverfallback und Snapshotdaten berücksichtigen.
- [ ] `npm run test:ios:contracts`, Simulatorbuild und Screenshots für Hell/Dunkel
  und große Schrift; VoiceOver-Abnahme für Suche, Details, Votes und Fehler.

### Paket C – BGG und Spielereihen

- [ ] **RED:** Mobile-API-Tests für wiederholten Import, kontofremden Bestand,
  parallelen Import und Erhalt selbst bearbeiteter Daten (BUG-083).
- [ ] **GREEN:** Mobileimport an `createOrReuseBggGame` anbinden; optionale
  BGG-Ausgabenwahl nur mit geprüfter Zuordnung zum Hauptspiel.
- [ ] **RED/GREEN:** Native Suchzustände idle/loading/empty/results/error und
  verspätete Antworten testen und implementieren; aktive Importe gegen Doppeltipp
  schützen. Bestandsprüfung muss erfolgreich sein, bevor ein Import freigegeben wird.
- [ ] Reihen: Mehrfachauswahl, temporäre Nutzung und Sammlungsübernahme gemäß
  FEAT-024/025; **RED:** DTO-/SwiftData-Roundtrip ohne Sammlungsspiel, Duplikate und
  409 mit anschließendem Listenabgleich. **GREEN:** explizite Auswahlmodi.
- [ ] **REFACTOR:** Geteilte Such-/Statusregeln ohne zweite Netzwerkimplementierung;
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

- [ ] Vor jeder Paketumsetzung HEAD, Arbeitsbaum und API-Verträge erneut prüfen.
- [ ] UI-Änderungen mit Impeccable prüfen; tatsächliche gerenderte Web-/Simulator-
  Belege und Grenzen dokumentieren. Native 44-pt-Ziele und Dynamic Type beachten.
- [ ] Auth, Objektbindung, Validierung und Datenschutz pro betroffenem API-Pfad
  gezielt testen; Serverrechte niemals aus sichtbaren Buttons ableiten.
- [ ] Changelog, Bugs, Features, Backlog und gegebenenfalls OpenAPI/FAQ/Concept
  aktualisieren; Coveragewerte ausschließlich aus vollständiger Messung übernehmen.
- [ ] `npm run typecheck`, `npm run lint`, `npm run test`,
  `npm run test:ios:contracts`, `npm run security-check:fast` und
  `npm run review-evaluate:regression` bestehen. Build nach Webruntimeänderungen.
- [ ] Änderungen committen, Evaluator ausführen und Review-Snapshot, Bewertung
  sowie Prozessanpassungen mit tatsächlichen Ergebnissen aktualisieren.
  Veröffentlichung, Migration und Store-Release sind eigene Betriebsaktionen.
