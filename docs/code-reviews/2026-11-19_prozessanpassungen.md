# Prozessanpassungen – Bugabschluss 19.11.2026

## FEAT-036 – Split-Flap-Redesign

- [x] Freigegebenen FEAT-036-Plan unmittelbar vor Implementierung gegen HEAD und Arbeitsbaum geprüft.
- [x] Laufzeitänderungen testgetrieben umgesetzt; gezielte Tests einschließlich der neuen Amber-/Stahl-Oberkante bestanden.
- [x] Impeccable-Detector einmal ausgeführt; nach dem Finish-Review die Oberkante nachgeschärft und Desktop/Mobil bei 1440×1200 und 390×844 neu gerendert.
- [x] Seedreferenz mit `concept-seed --check-seed seed:c5f23fe40c3f189d` verifiziert; Finish-Review `ship`.
- [x] Vollsuite (1.482 Tests), Lint, Produktionsbuild und Regressionsevaluator bestanden.
- [x] Vollständigen npm-Registryaudit im Pre-Commit-Lauf wiederholt: 0 Vulnerabilities; SEC-45 aufgelöst. Post-Commit-Evaluator 10/10 ohne Regression.

- [x] Offene Bugliste und Backlog gegen aktuellen Commit `2ab7ded` geprüft.
- [x] Für die Laufzeitfixes BUG-080/081 gezielte Tests vor der Codeänderung erstellt und erwartete RED-Ergebnisse beobachtet; BUG-088/090 als Dependencyänderungen mit Registryaudits verifiziert.
- [x] Cache-Schlüssel der Sessionseiten separat regressionsgetestet.
- [x] OpenAPI-YAML und alle lokalen `$ref`-Ziele geprüft.
- [x] Next.js 16.4.6 und Hono 4.13.19 / `@hono/node-server` 2.1.9 innerhalb kompatibler Bereiche aktualisiert; kein `audit fix --force`.
- [x] Produktions- und vollständigen npm-Audit mit Registryzugriff geprüft; 0 Befunde.
- [x] Gerenderte Sessions-Paginierung in Chromium bei 320/390/768/1440 px und Hell/Dunkel geprüft.
- [x] Vollständige Testsuite, TypeScript, geänderte Dateien mit ESLint `--max-warnings=0`, Build und OWASP-Check bestanden.
- [x] Commit `2ecbadb` erstellt; Post-Commit-Regressionsevaluator 10/10 ohne Regression.
- [ ] FEAT-034 separat fortsetzen: Eventlistenquery reduzieren und restliche Lade-/Fehler-/Leer-/Tastatur-/Großschriftzustände vollständig abnehmen.

Erfolgsmessung: 1.478 Tests in 234 Dateien; 0 offene Bugs; 90 behobene Bugs;
Review 10/10; vollständiger npm-Audit ohne Befunde.

## FEAT-034 Eventlistenquery – Fortsetzung

- **RED:** Queryvertrag mit Begrenzung auf drei Vorschläge und sichtbarem Gesamtzähler zuerst fehlschlagen lassen.
- **GREEN:** `select` mit Übersichtsfeldern und `_count`; 1.479 Tests, Typprüfung, gezieltes ESLint, Build und Securitycheck bestanden.
- **Render:** CUA-Browserhost fehlte. Lokale Vorschau mit synthetischen Daten in Playwright Chromium geprüft (acht Viewport-/Themekombinationen); Vorschau-Route entfernt und Server gestoppt.
- **Review:** Commit `1ec403f`; Evaluator 10/10, keine Regression. Pre-Commit-Audit mit Registryzugriff fand 0 Vulnerabilities. Der erste Evaluatorlauf ohne Registry wurde als vorübergehender SEC-45-Infrastrukturstatus dokumentiert und nach erfolgreichem Lauf aufgelöst.
- TypeScript und Build beim ersten Prüflauf nicht parallel ausführen: Build erneuert `.next/types`; isolierter Typecheck nach Build bestand.
- Erfolgsmessung: Eventkarten laden keine vollständigen Einladungs- oder Stimmenlisten und zeigen bei drei Vorschauen weiterhin die korrekte Zahl weiterer Vorschläge.

## FEAT-034 ESLint und Zustandsabnahme – 0.50.106

- ESLint-RED auf einer Impeccable-Spiegeldatei: 15 Warnungen, Exit 1 mit `--max-warnings=0`.
- ESLint-GREEN nach exakt begrenzten Pfadausnahmen: gezielter Lauf und globales `npm run lint` mit 0 Warnungen.
- Visueller Nachweis für gefüllte/leere Events, Laden, Fehler und Paginierung in 320/390/768/1440 px Hell/Dunkel; 200-%-Zoom über halbe CSS-Viewportbreite und Tastaturfokus ohne horizontalen Überlauf.
- Datenbankzugriff/Testsaat wurde nicht verwendet; die Vorschau besteht aus synthetischen lokalen Fixtures. Isolierte DB-Abnahme bleibt offen.

## FEAT-034 Abschluss und BUG-091 – 0.50.107

- [x] BUG-091 im RED-GREEN-Zyklus behoben; 44 px Mindesthöhe und umbrechende Aktionen.
- [x] Authentifizierte DB-Abnahme ausschließlich in `bgt_test_feat028`; Testkonten und Datensätze kaskadierend bereinigt.
- [x] Event-/Sessionansichten bei vier Viewports in Hell/Dunkel, Seitenzählung, 200-%-Zoom und Tastaturfokus geprüft.
- [x] 1.480 Tests, `npm run typecheck`, `npm run lint`, `npm run build` und `npm run security-check:fast` bestanden.
- [x] Vollständiger npm-Audit meldet 0 Befunde; Regressionsevaluator mit Registryzugriff 10/10 ohne Regression.

Erfolgsmessung: 1.480 Tests in 235 Dateien; 0 offene Bugs; 91 behobene Bugs;
Review 10/10; keine horizontale Überbreite bei 200-%-Zoom.
