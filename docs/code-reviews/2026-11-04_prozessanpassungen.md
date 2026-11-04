# Prozessanpassungen – 04.11.2026 / FEAT-025

## FEAT-026 – Spielesammlung-Pager (0.50.77)

- [x] Planaktualität und Umfang unmittelbar vor Umsetzung gegen FEAT-025, Listenservice und API-Vertrag geprüft.
- [x] Filterparser, Service, Pager und „Alle entfernen“ testgetrieben mit RED/GREEN umgesetzt; vollständige Suite 1.151/1.151 bestanden.
- [x] Authentisierung, Eigentümer-/Soft-Delete-Bedingungen, erlaubte Sortierung und begrenzte Filterwerte geprüft.
- [x] Impeccable-Renderprüfung bei fünf Viewportbreiten, inklusive schmaler 195-px-Zoom-Probe, bestanden.
- [x] Dokumentation, FAQ, OpenAPI, Changelog und Backlog aktualisiert.
- [x] TypeScript, Produktionsbuild, Security-Check und Review-Regressionscheck bestanden; 10/10 und keine offenen Findings.
- [x] Produktionsaudit mit Registryzugriff: 0 Vulnerabilities. Ungültiger Offline-Auditlauf als Prozessartefakt dokumentiert und mit gültigem Lauf aufgelöst.
- [ ] Commit mit regulären Hooks.

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
