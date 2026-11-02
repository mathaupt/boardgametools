# Review-Snapshot – FEAT-015 Dashboard-Top-drei (0.50.48)

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
- Security-Check: 0 Fehler, 3 Warnungen. `npm audit --omit=dev` nach Registryzugriff: 0 Vulnerabilities; Warnung aus Sandbox-Audit ist in `regressions.md` aufgelöst. Raw-SQL- und Debug-Routen-Hinweise bestehen unabhängig fort.
- Review-Evaluator: 9,9/10; keine Regression. SEC-45 bleibt als bestehendes, teilweise gelöstes Finding offen. Snapshot: `history/2026-11-02_1031.json`.
- Impeccable-Detektor: 0 Regex-Findings. Browserhost nicht verfügbar; responsive/Zoom-/Dark-Mode- und Bildressourcenprüfung bleibt offen.
- Sessionliste prüft Auth vor Query und selektiert nur ID, Name und Bild-URL. Keine API-, Schema- oder Datenbankänderung. BUG-062 für ungültiges HTML wurde mit Regressionstest behoben.
