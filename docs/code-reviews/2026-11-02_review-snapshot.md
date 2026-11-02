# Review-Snapshot – FEAT-015 Dashboard-Top-drei (0.50.48)

## BUG-064 / FEAT-020 – Einheitliche Vorschlagssuche (0.50.61)

- Gemeinsame deckende Panels und abgesetzte Listenflächen für Sammlung und BGG; sichtbare Suchlabels und eindeutige deutsche Aktionen.
- RED: fehlende Sammlungsbeschriftung und doppelter BGG-Hinweis; anschließend 13/13 gezielte Public-Event-Tests grün, einschließlich Axe.
- Lokaler Vite-Server mit realen Komponenten/Styles und ausschließlich synthetischen Daten: Chrome-Vorheransicht und Safari-Nachprüfung über native CUA.
- Gerendert: 390/1024 px, Hell/Dunkel, 200 % Schrift, lange Titel, Suchtreffer, Leer- und Fehlerzustand. Sammlungsliste lief bei 200 % zunächst seitlich über; nach Korrektur keine horizontalen Überläufe in beiden Listen.
- Minimale gemessene Textkontraste: 5,59:1 hell, 5,33:1 dunkel; Kontrollen mindestens 44 px hoch bei normaler Schrift.
- Build mit Typprüfung und gezieltes ESLint bestanden; Impeccable-Detektor 0 Findings. Regressionsevaluator 10/10, Sicherheit 9,9/10, keine offenen/neuen Findings oder Regressionen (`history/2026-11-02_1305.json`).
- API-/Auth-/Datenbankverträge unverändert; keine Produktionsdaten oder schreibenden Datenbank-E2E verwendet. Lokale UI-Prüfung ist kein vollständiger Backend-E2E-Nachweis.
- Commit `1686bc0`: lint-staged-ESLint und relevante Tests, Security-Check (0 Fehler, 0 Vulnerabilities, 2 bestehende Hinweise zu Raw SQL/Debug-Routen) und Regressionsevaluator bestanden. Evaluator 10/10, Sicherheit 9,9/10; Snapshot `history/2026-11-02_1315.json`. Lokaler Vorschau-Server nach Abschluss gestoppt. Versionsnummer auf 0.50.61 gesetzt, da die parallele Coveragearbeit ebenfalls 0.50.60 verwendete.

## FEAT-018 – Coveragepaket 4 aktualisiert (0.50.60)

- 994/994 Tests in 141 Dateien; global 59,45/55,70/64,14/60,96 %.
- `src/lib`: 88,94/80,00/90,60/91,47 %; alle vier 80-%-Gates bestehen.
- Neue BGG-Transportfälle: Retry/Abbruch bei 202, übergroßer Stream und Netzwerkfehler.
- Globale Gates 55/55/61/56 % bestehen; 65-%-Stufe und globales 80-%-Ziel bleiben offen.
- Typecheck und gezieltes ESLint bestanden; Security-Check 0 Fehler und 3 bestehende Warnungen.
- Regressionsevaluator mit Registryzugriff: 10/10, Sicherheit 9,9/10, keine offenen/neuen Findings oder Regressionen (`history/2026-11-02_1309.json`).

## FEAT-018 – Coveragepaket 4 (0.50.59)

- 979/979 Tests in 140 Dateien; global 59,24/55,07/64,06/60,82 %.
- `src/lib`: 88,23/81,79/89,16/90,95 %; das `src/lib`-Gate ist jetzt 80/80/80/80 %.
- Neue Verhaltenstests decken BGG-API, Barcode-Lookup, Cover-Scan und Barcode-Scanner ab.
- Globales Coverage-Gate nach bestandenem Lauf auf 55/55/61/56 % angehoben.
- Nächste globale Stufe 65/65/65/65 %; 80-%-Ziel bleibt offen.
- Für diesen historischen Messstand war der finale Evaluatorlauf noch offen; der Abschlussnachweis steht im Eintrag 0.50.60 oben.

## FEAT-018 – Coveragepaket 1 (0.50.57)

- Globales und `src/lib`-Coverage-Gate auf 50/50/60/55 % angehoben.
- 953/953 Tests in 136 Dateien; global 54,90/51,60/61,07/56,18 %.
- `src/lib`: 88,23/81,79/89,16/90,95 %; alle vier Metriken überschreiten 80 %.
- Bibliotheks-, Spiele-, Session-, Event-, Gruppen- und Barcodepfade ergänzt; 62 neue Tests seit Planbaseline.
- 100-%-CLI-Override blockiert erwartungsgemäß; keine Laufzeitkorrektur oder Datenbankänderung in diesem Paket.
- `npm audit --omit=dev`: 0 Vulnerabilities. Regressionsevaluator nach Registryfreigabe: 10/10, Sicherheit 9,9/10, 0 offene/neue Findings, keine Regression; Snapshot `history/2026-11-02_1235.json`.
- Security-Check: 0 Fehler, 3 bestehende Warnungen (Audit ohne Registry im Sandboxlauf, Raw SQL, Debug-Routen); separater Registry-Audit sauber.
- Gezieltes ESLint und Security-Check bestanden. TypeScript und gezieltes ESLint bestanden. Commit `6c7f7f9`; Pre-Commit-Hook: lint-staged-ESLint/Tests, Security-Check und Regressionsevaluator bestanden.

## Public Event – Kontrast der Spielvorschläge

- Design-Spec für semantische Kartenflächen auf BGG- und Sammlungstreffern erstellt.
- FEAT-020 freigegeben und umgesetzt: BGG- und Sammlungstreffer verwenden `bg-card`, `text-card-foreground` und `border-border`.
- Gezielte Public-Event-Tests: 6/6 bestanden; TypeScript, ESLint und Build bestanden.
- Impeccable-Detektor: 0 Regex-Findings; gerenderte Prüfung nicht möglich, Browserhost nicht verfügbar.
- Commit-Hook: Security-Check ohne Fehler; 0 Vulnerabilities, 2 bestehende Hinweise zu Raw SQL und Debug-Routen.
- Review-Evaluator: 10/10, Sicherheit 9,9/10, 0 offen/neu und keine Regression. Snapshot `history/2026-11-02_1204.json`.

## BUG-063 – Dashboard-Cache-Datum

- Regressionstest reproduzierte Digest `113253834`: `createdAt.getTime is not a function` bei gecachtem ISO-String.
- Ranglogik normalisiert jetzt Prisma-`Date`- und Cache-Stringwerte vor dem Tie-Breaker.
- Regressionstests für Rangfolge und Dashboard-Datumsnormalisierung: 6/6 bestanden.
- TypeScript, gezieltes ESLint, Produktionsbuild, Security-Check und Commit-Hook bestanden.
- Review-Evaluator: 10/10, Sicherheit 9,9/10, 0 offene/neue Findings, keine Regression; Snapshot `history/2026-11-02_1119.json`.

FEAT-015 ergänzt die hervorgehobene Eventkarte um eine Rangliste der drei meistgewählten Vorschläge. Konto- und Gaststimmen fließen ein. Für das autorisierte nächste Event liest die Abfrage nur Rangdaten aller Vorschläge und lädt vollständige Spiel-/Bilddetails nur für die angezeigten Top drei.

- Gezielte Unit-Tests: 7/7 bestanden (Rangfolge, gemischte Stimmen, Tie-Breaker, Vorschlagslimit, Cover-Fallback, ausgewähltes Spiel und geschlossenes Voting).
- `npm run typecheck`: bestanden.
- Gezieltes ESLint für alle geänderten TypeScript-Dateien: bestanden, 0 Warnungen. Der vollständige Repository-Lauf hatte 651 Warnungen aus versionierten lokalen Impeccable-Skripten, 0 Fehler.
- Produktionsbuild: bestanden; Next.js-Dashboardroute dynamisch gerendert.
- Security-Check: 0 Fehler, 2 vorhandene Hinweise zu Raw-SQL und Debug-Routen. `npm audit --omit=dev`: 0 Vulnerabilities.
- Review-Evaluator: 10/10, Sicherheit 9,9/10, keine offenen Findings/Regressionen. Snapshot: `history/2026-11-02_0913.json`.
- Impeccable-Detektor: 0 statische Findings für `event-preview.tsx`. Browserhost nicht verfügbar; 390-px-/200-%-Zoom-Ansicht bleibt offen.
- Keine Datenbankmigration, API-Änderung oder Produktionsdatenbankabfrage.

Ein erster Regressionsevaluatorlauf konnte die npm-Registry in der Sandbox nicht erreichen und markierte SEC-45 vorübergehend offen. Nach `npm audit --omit=dev` mit Registryzugriff (0 Befunde) bestand der erneute Regressionlauf mit Exitcode 0. Root Cause und Beleg stehen im Regressionslog.

## Ergänzung: FEAT-016 aufgenommen

Die Spielauswahl im Session-Formular ist derzeit ein nicht durchsuchbares
Dropdown. FEAT-016 hält eine Texteingabe zum Filtern der eigenen Spiele als
Backlog-Anforderung fest. Es wurde kein Produktionscode geändert und keine
Umsetzungsfreigabe erteilt.

## Ergänzung: FEAT-017 Impeccable-Prüfung der Sessions-Liste

Die aktuelle Liste wiederholt ein Würfelzeichen statt spielbezogener Bilder.
Die unabhängige Designprüfung bewertete sie mit 21/40; der Impeccable-Detektor
meldete 0 statische Findings. Eine Browserprüfung war wegen des nicht verfügbaren
Browserhosts nicht möglich. Cover in Sessionkarten wurden als FEAT-017
aufgenommen; Plan und Umsetzungsfreigabe stehen aus.

## Ergänzung: FEAT-018 Coverage-Ausgangsstand

`npm run test:coverage`: 849/849 Tests in 117 Dateien bestanden. Coverage:
46,84 % Statements, 44,59 % Branches, 48,65 % Functions, 48,08 % Lines;
`src/lib`: 81,69 %, 75,65 %, 83,16 %, 83,67 %. Coverageplan und stufenweises
80-%-Ziel sind dokumentiert. 91 erfasste Produktionsdateien liegen bei 0 %
Lines; diese werden im Plan nach Risiko priorisiert. Es wurde keine Schwelle
geändert.

## Planungsabgleich FEAT-016 bis FEAT-018 – 0.50.51

- FEAT-016: Web-Picker mit lokaler Suche, gültiger ID-Bindung, Fokus-/Tastaturvertrag und gezielten Form-/Filtertests geplant.
- FEAT-017: kleine dekorative Cover neben Titel/Datum mit Quellenprüfung und Ladefehler-Fallback empfohlen; Variantenwahl vor Umsetzung bestätigen. Lesende Browserabnahme und iOS separat.
- FEAT-018: Quellenabgleich korrigiert die frühere falsche Aussage, es gebe kein globales Gate. `vitest.config.ts` setzt tatsächlich 22 % je globaler Metrik und 50/45/50/50 % für `src/lib`.
- Die 849 Tests und Coveragewerte oben sind historische Messwerte; in diesem Planungsschritt wurde kein neuer Coverage-Lauf behauptet.
- Pläne und Dokumentation geändert; keine Produktfunktion oder Coverage-Konfiguration umgesetzt. Freigaben stehen aus.

## FEAT-017 – Spielcover in der Sessions-Übersicht (0.50.52)

- Gezielte Tests: 20/20 bestanden, einschließlich Quell-URL-Allowlist, fehlender/defekter Cover, Wechsel auf neue URL, Sessionliste/Login-Guard und `jest-axe`.
- `npm run typecheck`, gezieltes ESLint und `npm run build`: bestanden.
- Security-Check im Commit-Hook: 0 Fehler, 2 bestehende Warnungen. `npm audit` meldete 0 Vulnerabilities; Raw-SQL- und Debug-Routen-Hinweise bestehen unabhängig fort.
- Review-Evaluator nach Commit: 10/10; Sicherheit 9,9/10, keine offenen Findings und keine Regression. Snapshot: `history/2026-11-02_1035.json`.
- Security-Check im Commit-Hook: 0 Fehler, 2 bestehende Warnungen zu Raw-SQL und Debug-Routen; `npm audit` meldete 0 Vulnerabilities.
- Impeccable-Detektor: 0 Regex-Findings. Browserhost nicht verfügbar; responsive/Zoom-/Dark-Mode- und Bildressourcenprüfung bleibt offen.
- Sessionliste prüft Auth vor Query und selektiert nur ID, Name und Bild-URL. Keine API-, Schema- oder Datenbankänderung. BUG-062 für ungültiges HTML wurde mit Regressionstest behoben.

## FEAT-016 – durchsuchbare Spielauswahl (0.50.54)

- 37/37 gezielte Unit-Tests bestanden (Filter, Picker, Sessionformular,
  Sessions-CRUD und Session-Service); TDD-RED für zuvor fehlenden Filter,
  Picker und Formularvalidierung beobachtet.
- `npm run typecheck`, gezieltes ESLint und `npm run build` bestanden.
- Security-Check: 0 Fehler, 2 bestehende Hinweise zu Raw-SQL und Debug-Routen;
  Registry-Audit meldet 0 Vulnerabilities.
- Pre-Commit-Review-Evaluator: 10/10 gesamt, Sicherheit 9,9/10, 49 Findings
  erledigt, 0 offen, 0 neu und keine Regression. Snapshot:
  `history/2026-11-02_1115.json`.
- Impeccable-Detektor: 0 Regex-Findings. Die Prüfung ist statisch und hat keine
  gerenderte Seite erhalten.
- Browserhost nicht verfügbar; 390/1440 px, Hell/Dunkel, 200-%-Zoom und
  manuelle VoiceOver-Abnahme bleiben offen. Schreibendes Browser-E2E wurde
  nicht ausgeführt.
- Keine API-, Datenbankschema-, Migrations- oder Produktionsdatenänderung;
  serverseitige Session-Besitzprüfung bleibt erhalten.

## FEAT-021 – 0.50.63

Deutsche BGG-Ausgabenwahl in beiden Einzelimporten mit erneuter serverseitiger Prüfung umgesetzt. 1.029/1.029 Tests und Coverage-Gates, TypeScript, gezieltes ESLint sowie Produktionsbuild bestanden. Regressionsevaluator erfolgreich (Snapshot `history/2026-11-02_1426.json`); vorhandene Findings nicht erneut geöffnet. BUG-065 bei lokaler Safari-Prüfung mit großer Schrift entdeckt und behoben. Keine zusätzlichen Datenfreigaben oder Schemaänderungen.

## FEAT-022 – 0.50.64

Gemeinsamer Server-Footer mit lokalem Original-BGG-Logo auf allen Webseiten einschließlich Login. Keine API-, Auth-, Schema- oder CSP-Änderungen. Sieben gezielte Tests einschließlich Axe/Tastatur; 1.036/1.036 Tests und vorhandene Coverage-Gates bestanden. Produktionsbuild, anschließende Typprüfung und ESLint ohne Fehler (651 bestehende Warnungen). Review 10/10, Sicherheit 9,9/10, keine Regressionen (`history/2026-11-02_1455.json`); Security-Check ohne Fehler, zwei bekannte Hinweise. Gerenderte Safari-Abnahme mit realen Login-/Landing-Komponenten und Anwendungs-CSS: Desktop hell, mobile Breite dunkel, 200 % Schrift und kurzer Viewport. BUG-066 dabei testgetrieben behoben. Keine Produktionsdaten geschrieben; Dashboard-Footer über Root-Layout-Vertrag geprüft.
