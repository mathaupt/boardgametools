# FEAT-036 – Split-Flap-Redesign für die Weboberfläche

## Ziel und Umfang

Die bestätigte Gestaltung „Spielabend-Anzeigetafel“ ersetzt Club Programme als visuelle Sprache der Webanwendung. Der nächste Spieleabend führt das Dashboard; Navigation B (fünf Hauptziele plus „Mehr“), Seiten, Daten, Abläufe und Berechtigungen bleiben erhalten. Webweit gelten dunkle Stahl-/Schwarzflächen, helle Schrift und Bernstein für den nächsten Termin. Datums- und Statusangaben erhalten eine präzise, geteilte Anzeigetafel-Anmutung. Keine iOS-Änderung, API-, Schema- oder Berechtigungsänderung.

## Freigabe und Aktualitätsprüfung

**Freigegeben:** 19.11.2026; Umsetzung ausdrücklich durch den Nutzer beauftragt. Ausgewählte Impeccable-Skizze: `.impeccable/mocks/decision/full-dashboard-board.html`; Konzept-Seed-Referenz `seed:c5f23fe40c3f189d`. Code-led gemäß Projektkonfiguration.

**Aktualität geprüft:** 19.11.2026, HEAD `5a4cdfb`; Arbeitsbaum bei Prüfung sauber. FEAT-035 ist in 0.50.103 abgeschlossen; aktueller Changelogstand 0.50.108. Navbar und Dashboard verwenden bereits fünf Hauptziele plus „Mehr“ und die gewählte Event-first-Hierarchie. Keine Daten-, API-, Deployment- oder Sicherheitsverträge betroffen.

## Umsetzung

1. RED: gezielter Vitest-Vertrag prüft die neuen semantischen Farbrollen, vorhandene Datentypografie, Navigation und Split-Flap-Datumsdarstellung; er muss mit dem bisherigen Farbsystem scheitern. `npx vitest run tests/unit/app/split-flap-design.test.ts`.
2. GREEN: semantische globale Tokens, Geist Mono für kompakte Datenwerte und gemeinsames Shell-/Dashboard-CSS auf die gewählte Welt umstellen. Bestehende Interaktion und Serverdaten unverändert lassen. Derselbe gezielte Test muss bestehen.
3. REFACTOR: Styles bündeln, Dark-/Light-Theme, Fokus, Reduced Motion und kleine Viewports prüfen; Impeccable-Detector einmalig ausführen und dokumentierte Treffer korrigieren.
4. Gerenderte Abnahme: lokale App mit vorhandenen sicheren Testdaten; Dashboard und repräsentative Sammlung/Eventseiten bei 390 und 1440 CSS-Pixeln, hell/dunkel, Tastaturfokus und Navigation. CUA/native Browseroberfläche nutzen, falls der DOM-Host fehlt.

## Dokumentation und Abschluss

Surface-Brief, `DESIGN.md`, `.impeccable/design.json`, Changelog, Backlog und Featureübersicht aktualisieren. Keine neuen Assets; Referenzbilder bleiben lokal und werden nicht ausgeliefert. Danach Impeccable-Finish-Review, Review-Evaluator samt Regressionsprüfung, gezielte Tests, Typecheck/Lint und Build; Commit gemäß Projektworkflow.

## Umsetzungsnachweis – 19.11.2026

- **Aktualitätsprüfung vor Umsetzung:** HEAD `5a4cdfb`; Feature-Plan geprüft; FEAT-035 bereits abgeschlossen. Es gab keine Änderung an Datenmodell, APIs, Berechtigungen oder iOS.
- **RED/GREEN:** Der gezielte Split-Flap-Vertragstest schlug zuerst gegen das alte Farbsystem fehl. Der Dashboard-Vertrag für den entfernten Kicker schlug vor dessen Entfernung fehl. Für die 3px Eventkarten-Oberkante wurde der gezielte Vertragstest ebenfalls zuerst rot ausgeführt. Nach den Änderungen bestanden beide UI-Vertragsdateien mit 8 Tests; die vollständige Suite bestand mit 1.482 Tests in 236 Dateien.
- **Laufzeit:** Dashboard-Kicker entfernt; Barlow Condensed (lokale WOFF2-Dateien mit OFL) ergänzt; Eventkarte erhält eine 3px-Amber-/Stahl-Oberkante mit vorhandener semantischer `--border`-Farbe. Das globale Webtheme, die geteilte Datumskachel, Navigation und gemeinsamen Arbeitsflächen wurden aktualisiert.
- **Render:** Produktionsseite mit echten Navbar- und Dashboardkomponenten, synthetischen Fixtures und klarer Vorschaukennzeichnung bei 1440×1200 und 390×844 CSS-Pixeln gerendert. Beide Viewports: keine horizontale Überbreite, keine Browserfehler; die 3px-Oberkante berechnet sich als Amber `rgb(255, 176, 0)` plus Stahlkante `rgb(59, 62, 66)`. Vorschau-Route und Server anschließend entfernt/gestoppt.
- **Impeccable:** `concept-seed --check-seed seed:c5f23fe40c3f189d` bestätigt `SEED KNOWN`. Finish-Review nach Korrekturrunde: **ship**; alle vier Materialkorrekturen auf Desktop/Mobil `resolved`, keine Regressionen.
- **Qualität:** `npm run lint` und abschließender `npm run build` erfolgreich; vollständige Testsuite mit 1.482 Tests bestanden, abschließende gezielte Wiederholung mit 8 Tests in 2 Dateien erfolgreich. Ein früher Buildlauf wurde nur durch veraltete `.next/dev/types` einer bereits entfernten Vorschau-Route verhindert; nach Bereinigung des generierten Dev-Caches bestand der Build.
- **Grenzen:** Die Vorschau verwendete ausschließlich synthetische Daten. Keine Datenbankänderung oder produktive Veröffentlichung.
- **Post-Commit:** Pre-Commit-Securitycheck fand 0 Vulnerabilities; Regressionsevaluator und vollständige Reviewwertung bestanden mit 10/10, 0 offenen Findings und ohne Regression. Commit `3049f43`.

## Abnahmekriterien

- Webnavigation behält ihre vorhandenen Routen, fünf Hauptziele plus „Mehr“, Tastatur- und Screenreader-Verträge.
- Alle semantischen Tailwind-Komponenten nutzen das neue dunkle System; Dashboard zeigt das nächste Event mit bernsteinfarbenem Datum und lesbaren, ausgerichteten Termin-/Statusinformationen.
- Kontrast, 44-px-Zielflächen, sichtbarer Fokus, Reduced Motion, beide Themes und 390/1440px gerendert geprüft.
- RED/GREEN-Nachweis, Impeccable-Verdikt, Dokumentation und Regressionsevaluator liegen im Plan vor.
