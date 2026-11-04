# FEAT-029 – Sessions aus Eventspielen: Implementierungsplan

> **Status:** Umsetzung am 04.11.2026 freigegeben. Aktualitätsprüfung unmittelbar vor dem ersten Runtime-Edit durchgeführt; Ergebnis siehe Prüfgrenzen.

**Ziel:** Event-Ersteller erfassen tatsächlich gespielte Vorschläge als normale Sessions mit Teilnehmern, Gästen und Ergebnissen; interne Eventberechtigte sehen Details, öffentliche Links nur die gespielten Spiele.

**Architektur:** `GameSession` bleibt die Quelle für Partiedaten. Ein Event-Partie-Link verbindet Session, Event und Spielvorschlag; eine Operations-ID macht erneute Übermittlungen idempotent, während absichtlich neu angelegte Partien erlaubt bleiben. Sessions unterstützen optional einen Spiel-Snapshot, damit BGG-only-Vorschläge und fremde Sammlungsspiele ohne Sammlungseintrag oder Übernahme fremder Spielbesitzdaten getrackt werden können. Gäste werden als getrennte Session-Gastspieler ohne Nutzerkonto gespeichert. Öffentliche Eventdaten erhalten eine eigene, minimierte Projektion.

**Technik:** Next.js 16 App Router, TypeScript, Prisma 7/PostgreSQL, Vitest, Testing Library, bestehendes Session-/Event-Service- und DTO-Muster, Tailwind/shadcn.

---

## Bestätigter Umfang und konkrete Architekturverträge

- Web zuerst. Mobile APIs bleiben rückwärtskompatibel; native iOS-Oberflächen sind nicht Teil dieses Plans.
- Neue Eventroute: `POST /api/events/{id}/played-sessions`; authentifiziert, ausschließlich Event-Ersteller. Sie akzeptiert `proposalId`, `operationId`, `playedAt`, optionale Dauer/Notizen, registrierte `players` samt Ergebnisfeldern und `guestPlayers` mit Nickname und Ergebnisfeldern.
- `operationId` ist ein vom Client einmal je bewusster Anlage erzeugtes CUID/UUID-Format. Retry derselben Operation liefert dieselbe verknüpfte Session. „Weitere Partie“ erzeugt eine neue ID. Ein eindeutiger DB-Index auf `(eventId, operationId)` und Transaktion schützen parallele Retries.
- Für Event-Sessions werden Spielname sowie optionale BGG-ID, Bild, Spielerzahl, Spieldauer und Komplexität als Snapshot gespeichert. `gameId` bleibt nur gesetzt, wenn das Spiel dem Event-Ersteller gehört. Ein fremdes Sammlungsspiel wird daher wie BGG-only als Snapshot behandelt. Keine automatische Sammlungsänderung.
- `GameSession.gameId` wird optional und die Relation auf `onDelete: SetNull` umgestellt. Bestehende Sessions bleiben verknüpft; vorhandene Sessionanlage setzt den Snapshot für eigene Spiele, damit ein später entferntes Spiel in der Historie lesbar bleibt.
- Neue Tabelle `SessionGuestPlayer` speichert `sessionId`, `name`, `score`, `isWinner`, `placement`; kein `userId`, keine Profilverknüpfung und keine Benachrichtigung. Nutzer- und Gastspieler-IDs dürfen in einer Session nicht doppelt vorkommen; gleiche Anzeigenamen allein werden nicht zusammengeführt.
- Neue Tabelle `EventPlayedSession`: `eventId`, `proposalId`, `sessionId`, `operationId`, Erstellzeit; `sessionId` und `(eventId, operationId)` eindeutig. Löschen eines Events oder Vorschlags entfernt nur den Link (FK `Cascade`); die Sessionhistorie bleibt erhalten. Session-Soft-Delete erhält Link und Operations-ID; Eventansichten zeigen nur aktive Sessions. Ein Soft-Delete kann nicht versehentlich eine zweite Partie aus einer Retry-Anfrage erzeugen.
- Eventvorschläge bleiben die Spielquelle; gelöschte, nicht existente oder einem anderen Event zugehörige Vorschläge werden abgelehnt. Wiederholte Sessions desselben Vorschlags sind ausdrücklich zulässig.
- Intern: eingeladene angemeldete Berechtigte gemäß `privateEventAccessFilter` sehen gespielte Titel und Sessiondetails. Gruppenmitgliedschaft allein erweitert die Webberechtigung nicht; die mobile Sync-Sichtbarkeit wird nicht erweitert. Nur der Event-Ersteller erhält Erstellen-/Bearbeiten-/Löschen-Aktionen. Öffentlich: serialisierte Eventdaten enthalten lediglich Spielnamen und `played`-Status, ohne Gast-/Mitspielernamen, Ergebnisse, Dauer, Notizen oder Session-IDs.
- Bestätigte Teilnehmer-Vorauswahl: Event-Ersteller, akzeptierte eingeladene Nutzer und Eventgäste; Nutzer und Gäste können im Formular angepasst werden.
- Sessiondetails bleiben in normaler Sessionhistorie und Statistik nutzbar. Snapshots ohne `gameId` werden mit Titel/Bild angezeigt; spielbezogene Aggregationen, die zwingend ein Collection-Game benötigen, ignorieren solche Sessions nachvollziehbar, ohne bestehende Kennzahlen oder DTOs abstürzen zu lassen.

## Betroffene Dateien und Zuständigkeiten

- `prisma/schema.prisma`, neue Migration unter `prisma/migrations/`: optionale Game-Relation, Snapshots, Gastspieler, Event-Partie-Link.
- `src/lib/services/session.service.ts`: normale Sessions um Snapshot/Gastspieler-Erfassung ergänzen; historische List-/Detailantworten und Soft-Delete beibehalten.
- `src/lib/services/event-played-session.service.ts` (neu): Event-/Vorschlagsprüfung, Erstellerberechtigung, Teilnehmerprüfung, transaktionale und idempotente Anlage, aktive Eventlinks lesen und löschen.
- `src/app/api/events/[id]/played-sessions/route.ts` (neu): Auth, JSON-/Zod-Validierung, Serviceaufruf und Fehlerstatus.
- `src/app/(dashboard)/dashboard/events/[id]/page.tsx`: interne Eventberechtigung und aktive Sessions mit expliziten Selects abfragen; keine sensiblen Felder an öffentliche Komponenten weiterreichen.
- `src/app/(dashboard)/dashboard/events/[id]/played-sessions-card.tsx` und `played-session-form.tsx` (neu): Liste, Status, Erstelleraktionen und responsive Erfassungsdialog/-formular.
- `src/lib/public-event.ts`, `src/app/public/event/[token]/page.tsx`, `src/components/public-event/*`: öffentliche Serialisierung nur um gespielte Namen/Status erweitern; öffentliche React-Oberfläche zeigt keine Partie-Details.
- `src/lib/dto-mappers/session.ts`, `src/app/(dashboard)/dashboard/sessions/[id]/page.tsx`, `src/app/(dashboard)/dashboard/sessions/[id]/edit/page.tsx`, Session-Detail-/Listenkomponenten, Statistiken und `src/app/api/mobile/v1/sessions/**`: nullable `gameId` und optionale Snapshot-/Gastspielerfelder rückwärtskompatibel abbilden.
- `docs/openapi.yaml`, `docs/FEATURES.md`, `src/lib/faq.ts`, `CONCEPT.md`, `docs/FEATURE-BACKLOG.md`, `src/lib/changelog.ts`: API, UX, Datenschutz, FAQ, Konzept, Status und Änderungsverlauf dokumentieren.
- Tests: `tests/unit/lib/services/event-played-session.service.test.ts`, `tests/unit/api/event-played-sessions.test.ts`, `tests/unit/lib/public-event.test.ts`, `tests/unit/components/played-sessions-card.test.tsx`, Session-Service-/DTO-/Mobile-Vertragstests neben den bestehenden Dateien.

## Task 1: Datenmodell und Snapshot-/Gastspieler-Verträge

**Dateien:** `prisma/schema.prisma`, neue Migration, `tests/unit/lib/services/session.test.ts` (vorhanden) und neue Schema-/Service-Tests.

- [x] **RED:** Snapshot-DTO- und Session-Service-Verträge vor Produktionscode rot ausgeführt. Schemavertrag für `information_schema` wurde ergänzt; wegen nicht verfügbarer ursprünglicher DB-Instanz lief er erst nach erfolgreicher Migration (also kein behaupteter RED-Lauf für DDL).
- [x] **GREEN:** `gameId` nullable, Snapshotfelder, `SessionGuestPlayer` und `EventPlayedSession` ergänzt. Alle 18 Migrationen einschließlich FEAT-029 ausschließlich auf einer frischen temporären lokalen DB `bgt_test_feat029` erfolgreich angewendet.
- [x] **REFACTOR:** Migration/Schema validiert, eindeutige Indizes und FKs geprüft. Integrationstest 1/1 bestanden; keine Produktionsdatenbank verwendet.

## Task 2: Session-Service, Ergebnisfelder und mobile DTO-Kompatibilität

**Dateien:** `src/lib/services/session.service.ts`, Session DTO-Mapping (Pfad bestätigen), Sessiondetail/-liste, Statistikabfragen, mobile Sessionrouten/Mapper und zugehörige Tests.

- [x] **RED:** Tests für Snapshot-Daten, Gastmitspieler und Bearbeitung vor der Implementierung rot ausgeführt; bestehende Sessionverträge bleiben in der Suite enthalten.
- [x] **GREEN:** Service legt Event-Snapshots und Gäste an; DTOs bleiben rückwärtskompatibel. Dashboard, Profil, Statistiken und Gruppenziele verarbeiten Snapshot-Sessions ohne nullable-ID-Fehler.
- [x] **REFACTOR:** Sessionansichten bearbeiten und zeigen snapshotbasierte Spiele; User-Selects bleiben explizit und leaken keine Passworthashes. Vollständige Testsuite bestanden.


## Task 3: Eventservice und autorisierte API

**Dateien:** neuer Service und Route oben, `docs/openapi.yaml`, `tests/unit/api/event-played-sessions.test.ts`, `tests/unit/lib/services/event-played-session.service.test.ts`.

- [x] **RED:** API- und Servicetests für erfolgreichen Zugriff, fehlerhafte Eingaben, Nicht-Ersteller, nicht eingeladene Nutzer, fremde Vorschläge und Idempotenz vor Implementierung rot ausgeführt.
- [x] **GREEN:** Authentifizierte API, Zod-Schema, Event-Erstellerprüfung, Invite-/Gast-ID-Prüfung und atomare Session-/Linkanlage umgesetzt. Proposal-Snapshot wird ausschließlich serverseitig geladen. OpenAPI ergänzt.
- [x] **REFACTOR:** Validierung, deutsche Fehler, Transaktion und sichere Benutzerprojektion geprüft. Service-/API-Tests und Security-Check bestanden.

## Task 4: Interne Eventdarstellung und Pflegeaktionen

**Dateien:** Eventdetailseite, neue `played-sessions-card.tsx` und `played-session-form.tsx`, Tests unter `tests/unit/components/` sowie Eventdetailtests.

- [x] **RED:** Tests für Gespielt-Status, Creator-Aktion und personenbezogenes Gewinner-Label rot ausgeführt.
- [x] **GREEN:** Event-Detail zeigt Sessions eingeloggten Berechtigten; Event-Ersteller kann neue Partien erfassen und Sessions über die vorhandene Sessionansicht pflegen. Eventgäste werden vorausgewählt und als Session-Gäste übernommen.
- [x] **REFACTOR:** Komponenten sind aufgeteilt, Labels/Fehler- und Leerzustände vorhanden. Gerenderte Desktop-/Mobilansicht geprüft; vollständige Unit-Suite bestanden.

## Task 5: Öffentliche Projektion und Datenschutzgrenze

**Dateien:** `src/lib/public-event.ts`, öffentliche Eventserverseite/Komponenten und `tests/unit/lib/public-event.test.ts`, `tests/unit/components/public-event-client.test.tsx`.

- [x] **RED:** Privacy- und UI-Regressionstests vor öffentlicher Statusanzeige rot ausgeführt.
- [x] **GREEN:** Öffentliche Projektion enthält nur `played`; Sessiondetails bleiben auf angemeldete Eventberechtigte beschränkt. Soft-gelöschte Sessions zählen nicht als gespielt.
- [x] **REFACTOR:** Privacy-Tests sowie 390-/1440-px-Detektor und Playwright-Screenshotprüfung bestanden. Share-Token kann keine Schreibroute autorisieren.

## Task 6: Dokumentation, Impeccable, Security und Abnahme

**Dateien:** alle oben genannten Dokumentationsdateien, Changelog, Backlog, `docs/openapi.yaml`, UI-Berichte in `.impeccable/critique/`.

- [x] **RED:** Vor Umsetzung keine Produktionsänderung; isolierte lokale Test-DB verwendet. Datenschutzgrenze durch API-/Serializer-Tests abgedeckt.
- [x] **GREEN:** OpenAPI, FEATURES, FAQ, CONCEPT, Backlog und Changelog aktualisiert. Impeccable-Render bei 390 px und 1440 px; Detector ohne Befund. Zwei unabhängige Prüfer; Kontrast-, Typografie- und Screenreader-Labelbefunde behoben.
- [x] **REFACTOR:** 1.216 Tests, Typecheck, Prisma-Validate, Produktionsbuild, Security-Check, Lint (0 Fehler) und Review-Regression (9,9/10, keine Regression) bestanden.

## Prüf- und Freigabegrenzen

- **Aktualitätsprüfung vor Implementierung – 04.11.2026, HEAD `d98d2b3`:** Schema und Session-/Eventservices entsprachen dem Plan; `GameSession.gameId` war verpflichtend, Eventdetail nutzte `privateEventAccessFilter`, Session-Service prüfte Spielbesitz. Architektur/Umfang unverändert. `BGT_TEST_DATABASE_URL` zeigt auf isoliertes `bgt_test_feat028`. Der lokale PostgreSQL-Dienst war gestoppt; Startversuch scheiterte an einer belegten Shared-Memory-Ressource. Daher keine Migration ausgeführt und keine Produktionsdatenbank verwendet.
- Vor Umsetzung: `git status --short`, FEAT-029-Spec, Schema, Session-/Eventservices, Deploymentstand, offene Änderungen und bestehende Review-Findings vergleichen; Ergebnis/Datum in diesem Plan ergänzen. Bestehende uncommittierte FEAT-029-Dokumentänderungen sind Teil der Vorbereitung und dürfen nicht überschrieben werden.
- Migration im Plan bleibt additive und wird zuerst ausschließlich in der isolierten Testdatenbank verifiziert. Produktionsbackup, Deployment und Produktionsmigration sind separate, ausdrücklich freizugebende Betriebsschritte.
- Abnahme erwartet Datenbankmigrationstest, Unit/API/Komponententests, mobile DTO-Vertrag, gerenderte Impeccable-Prüfung und vollständige Privacy-/IDOR-Prüfung. iOS-UI ist ausgeschlossen.
- **Freigabe:** Nutzer hat den Plan am 04.11.2026 ausdrücklich zur Umsetzung freigegeben.
- **Abnahme:** Vollständige Vitest-Suite 1.216/1.216 bestanden; Prisma-Validierung, Typecheck, Produktionsbuild, Lint ohne Fehler, Security-Check und Review-Regressionscheck 9,9/10 ohne Regression bestanden. Alle 18 Migrationen und der FEAT-029-Schemavertrag wurden auf einer frischen lokalen temporären PostgreSQL-14-Instanz geprüft. Gerenderte lokale Vorschau wurde bei 390 px und 1440 px mit Playwright geprüft; Impeccable-Detektor meldete nach Behebung der Findings keine Befunde. Produktionsmigration nicht ausgeführt.
