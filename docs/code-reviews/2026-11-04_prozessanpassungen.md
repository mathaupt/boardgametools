# Prozessanpassungen – 04.11.2026 / FEAT-025

## FEAT-026 – Spielesammlung-Pager (0.50.77)

- [x] Planaktualität und Umfang unmittelbar vor Umsetzung gegen FEAT-025, Listenservice und API-Vertrag geprüft.
- [x] Filterparser, Service, Pager und „Alle entfernen“ testgetrieben mit RED/GREEN umgesetzt; vollständige Suite 1.151/1.151 bestanden.
- [x] Authentisierung, Eigentümer-/Soft-Delete-Bedingungen, erlaubte Sortierung und begrenzte Filterwerte geprüft.
- [x] Impeccable-Renderprüfung bei fünf Viewportbreiten, inklusive schmaler 195-px-Zoom-Probe, bestanden.
- [x] Dokumentation, FAQ, OpenAPI, Changelog und Backlog aktualisiert.
- [x] TypeScript, Produktionsbuild, Security-Check und Review-Regressionscheck bestanden; 10/10 und keine offenen Findings.
- [x] Produktionsaudit mit Registryzugriff: 0 Vulnerabilities. Ungültiger Offline-Auditlauf als Prozessartefakt dokumentiert und mit gültigem Lauf aufgelöst.
- [x] Commit `3bf2d1b` mit regulären Hooks; lint-staged, Security-Check und Review-Regressionscheck bestanden.

- [x] Vor Umsetzung Planaktualität gegen Schema, Serien-APIs, FEAT-024 und mobile Verträge geprüft; Umfang und Freigabe im Plan festgehalten.
- [x] Laufzeitänderungen testgetrieben umgesetzt: neue API-, Service-, DTO-, Snapshot- und UI-Verträge; RED/GREEN für die wesentlichen Regressionen beobachtet.
- [x] Reihenbesitz, Sammlungseigentum, temporäre BGG-Identität, Konflikte und transaktionale Entkopplung geprüft.
- [x] Herkunftsangaben optional in API und BGG-Auswahl ergänzt; kein Ablauf- oder automatisches Löschverhalten.
- [x] Desktop- und 390-px-Vorschau lokal mit synthetischen Daten gerendert; temporäre Prüfroute und Skript danach entfernt.
- [x] Changelog, FAQ, OpenAPI, FEATURES, CONCEPT, Backlog, Plan und AGENTS aktualisiert.
- [x] Vitest 1139/1139, TypeScript, Build, iOS-Verträge, Prisma-Validierung und Security-Check bestanden.
- [x] Registry-Audit mit 0 Produktionsvulnerabilities; erneuter Regressionsevaluator Exitcode 0, 9,9/10 gesamt.
- [ ] Migration auf isoliertem PostgreSQL testen; lokal waren weder PostgreSQL noch Docker verfügbar. Migration nicht angewendet.
- [x] Commit `523360d` mit regulären Hooks durchgeführt: lint-staged ESLint/Tests, Security-Check und Regressionsevaluator bestanden; finale Bewertung 10/10.

## Noch erforderliche Betriebsaktion

Die generierte Migration vor einem Deployment auf einer isolierten PostgreSQL-Kopie mit repräsentativen Bestandsdaten testen. Produktionsmigration ist nicht Teil dieser Umsetzung.

## FEAT-028 – Gamification (0.50.79)

- [x] Freigegebenen Plan direkt vor der Umsetzung auf Aktualität geprüft; FEAT-025-Bestandsverhalten berücksichtigt.
- [x] Laufzeitverträge testgetrieben umgesetzt; vollständige Suite 1.199/1.199 bestanden.
- [x] Eigene lokale PostgreSQL-Testdatenbank `bgt_test_feat028` eingerichtet; Integrationstest 2/2 bestanden. Keine Produktionsdaten oder Produktionsmigration.
- [x] Öffentliche Profilprojektion, Tokenrotation/Widerruf, Rate Limit, Gruppenmitgliedschaft und freiwilliges Opt-in geprüft.
- [x] Öffentliche Profilseite lokal bei 390/195/1440 px gerendert; Überlauf, E-Mail-Leak und Browserfehler ausgeschlossen.
- [x] Changelog, Backlog, FAQ, OpenAPI, FEATURES, CONCEPT, Deployment-Notizen und Plan aktualisiert.
- [x] TypeScript, Produktionsbuild, geänderte ESLint-Dateien, Security-Check und Review-Regressionscheck bestanden.
- [x] Produktionsaudit mit Registryzugriff: 0 Vulnerabilities. Ungültigen Sandbox-Auditlauf mit gültigem Audit und erneutem Evaluatorlauf aufgelöst.
- [ ] Commit mit regulären Hooks.

Native iOS-Oberflächen und iOS-Deep-Links bleiben separat zu planen.


## BUG-072 – Produktionsmigrationen

- [x] Vor dem Schreibzugriff konsistenten Produktionsdatenexport erstellt und gzip-Lesbarkeit geprüft; vorhandene Backups nicht gelöscht.
- [x] Tatsächlichen Prisma-Produktionsstatus gelesen: drei offene Migrationen aus BUG-053, FEAT-025 und FEAT-028.
- [x] Nach ausdrücklicher Nutzerfreigabe alle drei mit `npm run prisma:deploy` angewendet.
- [x] Read-only bestätigt: keine Migrationen offen, vier Profilspalten, drei neue Tabellen, drei erfolgreiche Migrationseinträge.
- [ ] Echten Login-Smoke-Test durch Nutzer oder freigegebenen synthetischen Produktionsaccount durchführen; keine Nutzer-Zugangsdaten automatisiert verwendet.


## FEAT-029 – Umsetzungsnachweis

- [x] Freigegebenen Plan unmittelbar vor Runtimeänderungen auf Aktualität geprüft; Umfang blieb unverändert.
- [x] Sessions, Gastspieler und Eventlink mit optionalen Spiel-Snapshots ergänzt; idempotente Anlage in einer Transaktion.
- [x] Creator-Rechte, akzeptierte Eventteilnehmende, Eventvorschlagszugehörigkeit und öffentliche Datensparsamkeit geprüft und gezielt getestet.
- [x] RED/GREEN für Snapshot-Mapping, Session-Erstellung, API, Eventdarstellung, öffentliche Statusanzeige und Gewinner-Label beobachtet.
- [x] Vollständige Vitest-Suite 1.216/1.216, Typecheck, Produktionsbuild, Schema-Validierung und Security-Check bestanden.
- [x] Alle 18 Prisma-Migrationen auf frischer temporärer PostgreSQL-Testdatenbank angewendet; FEAT-029-Schemavertrag 1/1 bestanden. Datenbankinstanz anschließend gestoppt.
- [x] Lokale UI-Vorschau mit synthetischen Daten bei 390 px und 1440 px gerendert. Zwei unabhängige Impeccable-Prüfer: Gewinner-Checkbox eindeutig benannt; verschachtelte Oberfläche entfernt; Kontrast-/Typografiehinweise behoben. Detektor bei beiden Breiten ohne Befund.
- [x] OpenAPI, FEATURES, FAQ, CONCEPT, Backlog, Changelog und Review-Dokumentation aktualisiert.
- [x] Review-Regression mit Registryzugriff: Exitcode 0, 9,9/10, keine Regression; Produktionsaudit 0 Befunde.
- [ ] Commit mit regulären Hooks.

Die Produktionsmigration ist nicht Teil dieser lokalen Umsetzung.

## BUG-055 / BUG-056 – Health-Endpunkte

- [x] Gezielte Regressionstests ausgeführt: 26/26 bestanden.
- [x] Produktionsabhängigkeits-Audit und Regressionsevaluator nach Registryfehler wiederholt; 0 Produktionsbefunde, keine Regression.
- [ ] Deployment, Monitorinventar/-umstellung und isolierte echte DB-Last-/Timeout-/Erholungsabnahme nachholen, bevor die Bugs geschlossen werden.
