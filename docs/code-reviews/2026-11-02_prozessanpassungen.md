# Prozessanpassungen – FEAT-015

## BUG-064 / FEAT-020 – Lokale UI-Abnahme abschließen

- [x] Commit `1686bc0` mit allen Hooks erfolgreich; 0 Vulnerabilities, keine Regression; Snapshot `history/2026-11-02_1315.json`. Lokaler Server gestoppt. Release 0.50.61 verhindert eine Versionskollision mit paralleler Coveragearbeit.

- [x] Fehlenden DOM-Browserhost durch lokalen Server und native Browsersteuerung ergänzt.
- [x] Screenshot in Chrome reproduziert; Nachbesserung in Safari mit realen Komponenten und synthetischen Daten geprüft.
- [x] Gemeinsame Darstellung für beide Vorschlagsquellen eingeführt; verschachtelte Ergebniskarten durch geteilte Listen ersetzt.
- [x] Zugängliche Such-/Reset-/Listenverträge vor dem Fix rot, anschließend grün; Kontrast und 200-%-Layout gerendert gemessen.
- [x] Bei 200 % gefundenen Listenüberlauf korrigiert und ohne horizontale Überläufe nachgemessen.
- [x] TypeScript/Build, gezieltes ESLint und Impeccable-Detektor bestanden. Regressionsevaluator ohne Regression, 10/10 (`history/2026-11-02_1305.json`).

## FEAT-018 Coveragepaket 4

- [x] BGG-Transporttests für 202-Retry, anhaltendes 202, Abbruch während Wartezeit, gestreamte Größenbegrenzung und Netzwerkfehler ergänzt.
- [x] Vollständige Suite: 994/994 Tests in 141 Dateien; global 59,45/55,70/64,14/60,96 %, `src/lib` 88,94/80,00/90,60/91,47 %.
- [x] Globales Gate 55/55/61/56 % und alle vier `src/lib`-Gates bei 80 % bestehen.
- [ ] 80 % global und Coverage-Artefakt im CI-Job erreichen.
- [x] Typecheck und gezieltes ESLint bestanden; Security-Check: 0 Fehler, 3 bestehende Warnungen.
- [x] Regressionsevaluator nach Sandbox-Auditfehler mit Registryzugriff wiederholt: 10/10, Sicherheit 9,9/10, keine offenen/neuen Findings oder Regressionen (`history/2026-11-02_1309.json`).
- [ ] 65-%-globales Coverage-Gate erst nach vollständigem Messlauf über alle vier Metriken anheben.

- [x] Charakterisierungstests zuerst ergänzt und gegen reale BGG-/Barcode-Handler und Scan-Komponenten ausgeführt.
- [x] 25 gezielte Testfälle für BGG-Suche/Details, Barcode-Lookup, OCR, Kamera-Fehler und Barcode-Dialog ergänzt.
- [x] Vollständige Suite: 979/979 Tests in 140 Dateien; Coverage 59,24/55,07/64,06/60,82 %.
- [x] Globales Gate auf 55/55/61/56 % und `src/lib`-Gate auf 80/80/80/80 % angehoben; Coverage-Lauf besteht.
- [ ] 80 % global und Coverage-Artefakt im CI-Job erreichen.
- [ ] Typecheck, Security-Check und Regressionsevaluator für dieses Paket ergänzen.

## FEAT-018 Coveragepaket 1

- [x] Frische Baseline gegen `c497641` aufgenommen und Coverage-Inventar unverändert gelassen.
- [x] Globales und `src/lib`-Gate auf 50/50/60/55 % angehoben; der frische Coverage-Lauf besteht.
- [x] CLI-Override mit 100 % Statements scheitert am tatsächlichen Messwert; normaler Gate-Lauf bleibt grün.
- [x] Auth-, Apple-Auth-, Einladungs-, Serien-DTO-, Storage-, Rate-Limit-, Games-, Sessions-, Event-, Gruppen- und Barcodeverhalten erweitert.
- [ ] 80 % in allen globalen und `src/lib`-Metriken sowie CI-Coverage-Artefakt erreichen.
- [x] Typecheck und gezieltes ESLint bestanden; Security-Check ohne Fehler.
- [x] Separater Registry-Audit meldet 0 Vulnerabilities; freigegebener Regressionsevaluator 10/10, 0 offen/neu und keine Regression (`history/2026-11-02_1223.json`).
- [ ] Commit-Hook und Abschluss-Snapshot nach Commit bestätigen.

## Public Event – Kontrast der Spielvorschläge

- [x] Aktuelle Komponenten und Club-Programme-Farbrollen geprüft.
- [x] Flächenkontrast als bestätigte Lösung festgehalten; BGG- und Sammlungstreffer bleiben funktional unverändert.
- [x] Design-Spec geprüft und vom Nutzer freigegeben.
- [x] FEAT-020-Implementierungsplan, Backlogverknüpfung und Changelog erstellt.
- [x] Implementierungsplan vor Umsetzung gegen `caa78ae` und tatsächliche Theme-Tokens geprüft; keine neuen Runtime-Änderungen seit Planung.
- [x] TDD-RED für beide Oberflächen beobachtet, danach semantische `card`-Flächen eingebaut; gezielte Suites 6/6 grün.
- [x] TypeScript, gezieltes ESLint, Produktionsbuild und statischer Impeccable-Detektor abgeschlossen.
- [x] Browserprüfung angefragt; Browserhost nicht verfügbar, gerenderte Light/Dark-/Viewportabnahme offen dokumentiert.
- [x] Backlog, Feature-Doku, Plan, Changelog und Review-Dokumentation aktualisiert.
- [x] Commit `d93118a`: Security-Check ohne Fehler und ohne Dependency-Vulnerabilities; zwei vorhandene Raw-SQL-/Debug-Routen-Hinweise.
- [x] Review-Evaluator 10/10, Sicherheit 9,9/10, 0 offen/neu und keine Regression; Snapshot `history/2026-11-02_1204.json`.

## BUG-063 Dashboard-Datumsregression

- [x] Gemeldeten Produktionsdigest `113253834` der Rangfolge in `dashboard-event-proposals.ts` zugeordnet.
- [x] Test zuerst ergänzt und RED mit identischem `createdAt.getTime is not a function` beobachtet.
- [x] Minimalfix: `Date | string` normalisieren, bevor gleich bewertete Vorschläge zeitlich sortiert werden.
- [x] Gezielte Rangfolgetests: 4/4 bestanden.
- [x] BUG-063, Root Cause/Regressionslog und Changelog 0.50.55 ergänzt.
- [x] TypeScript, gezieltes ESLint und Produktionsbuild bestanden.
- [x] Commit `dcf269b`: Security-Check ohne Fehler; Regressionsevaluator 10/10, Sicherheit 9,9/10, 0 offen/neu, keine Regression.
- [x] Ergebnis im Review-Snapshot `history/2026-11-02_1119.json` dokumentiert.

- [x] FEAT-015-Plan unmittelbar vor Umsetzung gegen `ad316d0`, vorhandene Änderungen, Votingsemantik und Dashboardquery geprüft und aktualisiert.
- [x] Stimmenzahl aus Konto- und Gaststimmen berechnet; Gleichstand deterministisch nach älterem Vorschlag und ID aufgelöst.
- [x] Dashboardabfrage auf das nächste Event ohne festgelegtes Spiel und minimale Vorschlagsfelder beschränkt.
- [x] Regressionstests vor dem Produktionscode geschrieben; Red-/Green-Zyklus beobachtet.
- [x] Gezielte Unit-Tests (7/7), Typecheck, geänderte TS-Dateien mit ESLint und Produktionsbuild bestanden.
- [x] Impeccable-Detektor ohne statische Findings; Farbrollen aus Club Programme genutzt.
- [x] Sicherheitsprüfung ohne neue Befunde; Konto-/Gaststimmen stammen aus aggregierten Counts, keine personenbezogenen Abstimmungsdaten serialisiert.
- [x] SEC-45 Regression durch fehlenden Registryzugriff identifiziert, mit Registry-Audit (0 Vulnerabilities) geprüft und durch erfolgreichen Regressionsevaluator aufgelöst; `docs/code-reviews/regressions.md` ergänzt.
- [x] Backlog, Implementierungsplan, Feature-Dokumentation, FAQ, Changelog und Review-Dokumentation aktualisiert.
- [ ] Browser-Viewportabnahme bei 390 px und 200-%-Zoom nach Verfügbarkeit des Browserhosts durchführen.

Erfolgsmessung: FEAT-015 ist im Web-Dashboard umgesetzt. Keine API- oder
Schemaänderung; native iOS-Oberfläche bleibt separat. Automatisierte Checks
bestanden. Die fehlende gerenderte Browserabnahme bleibt ausdrücklich offen.

### FEAT-016 Aufnahme

- [x] Fortlaufende Feature-ID vergeben und aktuelle Session-Spielauswahl im Code geprüft.
- [x] Scope auf Eingabefilter für eigene Spiele bei der Session-Anlage begrenzt; Spielerwahl separat gehalten.
- [x] Backlog, Changelog und Review-Dokumentation aktualisiert.
- [ ] Implementierungsplan mit Impeccable-, Accessibility-, Security- und Testabnahme erstellen.
- [ ] Keine Umsetzung freigegeben.

### FEAT-017/018 Aufnahme und Agentenprozess

- [x] Sessions-Liste geprüft: Spielcover fehlen; Designreview 21/40, Detektor 0 statische Findings.
- [x] Live-Browserprüfung mangels verfügbarem Browserhost ausgelassen und protokolliert.
- [x] Coverage-Baseline mit `npm run test:coverage` erhoben: 849 Tests bestanden; 46,84/44,59/48,65/48,08 % global.
- [x] 80-%-Plan mit Ratchet-Stufen und unverändertem Coverage-Inventar erstellt.
- [x] TDD als Pflicht für Laufzeitänderungen in `AGENTS.md` und Testing-Skill festgeschrieben.
- [x] Vercel React Best Practices und Next.js Best Practices als lokale Agenten-Skills aufgenommen.
- [ ] Keine Umsetzung des Coverage-Ausbaus freigegeben; Coverage-Schwellen unverändert.

### Implementierungspläne FEAT-016–018

- [x] Zwei neue Web-Pläne mit Aufgaben, konkreten Dateien, fachlichen Tests, Fehlerzuständen, Accessibility-, Security- und Impeccable-Abnahme erstellt.
- [x] iOS-Bestand geprüft; native Suche und Sessioncover als getrennten späteren Umfang ausgewiesen.
- [x] FEAT-018 mit tatsächlichem globalem 22-%-Gate abgeglichen; fehlerhafte Vorannahme und exakter Konfigurations-Spiegeltest entfernt.
- [x] Schrittweise Coveragepakete, aktuelle Messung vor jeder Umsetzung und CI-Artefakte eingeplant.
- [ ] Empfohlene UI-Varianten und Implementierungsumfang freigeben; keine Produktumsetzung erfolgt.

### FEAT-017 Umsetzung

- [x] Plan vor Implementierung gegen `4c9e70d`, Query, Bildquellen, Cache und Auth-Verhalten abgeglichen; Auth-Lücke und `game: true` korrigiert.
- [x] Coverquellen auf lokale Uploadpfade und die konfigurierte HTTPS-BGG-Domain begrenzt; unbekannte Blob-Hosts zeigen Fallback.
- [x] Regressionstests vor UI-/Query-Änderung erstellt; RED für fehlende Cover und fehlenden Auth-Guard beobachtet.
- [x] 20/20 gezielte Tests, TypeScript, ESLint, Produktionsbuild und Security-Check ohne Fehler abgeschlossen; Produktionsaudit nach Registryzugriff mit 0 Vulnerabilities.
- [x] Impeccable-Detektor ohne Regex-Findings; gerenderte Browserabnahme wegen nicht verfügbarem Browserhost offen dokumentiert.
- [x] Backlog, Feature-Doku, FAQ, Changelog, Bug-Tracking, Implementierungsplan und Review-Dokumente aktualisiert.
- [x] SEC-45-Auditregression nach `ENOTFOUND` mit `npm audit --omit=dev` (0 Vulnerabilities) und erfolgreichem Regressionsevaluator aufgelöst.
- [ ] 390/1440-px-, Dark-Mode-, 200-%-Zoom-, `srcset`- und manuelle VoiceOver-Prüfung nach Verfügbarkeit des Browserhosts abschließen.

Erfolgsmessung: Cover und semantischer Fallback sind in der Web-Sessions-Liste
integriert. 20/20 gezielte Tests sind erfolgreich. iOS und unbekannte
Vercel-Blob-Hosts sind separat offen; es wurde keine Datenbank oder API geändert.

### FEAT-016 Umsetzung

- [x] Plan vor Implementierung gegen Commit `14271bb`, FEAT-017/018, aktuelle Session-Query und Service-Berechtigungen geprüft; fehlende Popover-Hülle als Planabweichung dokumentiert.
- [x] Filtertests zuerst geschrieben; RED für fehlende Filterfunktion, Picker und Auswahlvalidierung gesehen; danach GREEN.
- [x] 37/37 gezielte Unit-Tests einschließlich API- und Service-Regressions bestanden.
- [x] TypeScript, gezieltes ESLint und Produktionsbuild bestanden.
- [x] Security-Check mit Registryzugriff: 0 Fehler, `npm audit` 0 Vulnerabilities; 2 vorhandene Hinweise zu Raw-SQL/Debug-Routen.
- [x] Impeccable-Detektor: 0 Regex-Findings; CLI kennzeichnet fehlende Render-/Layoutprüfung.
- [x] Backlog, Plan, Feature-Doku, FAQ, Konzept, Changelog und Agentenhinweise aktualisiert; API/OpenAPI unverändert.
- [x] Commit `7fba032` erstellt; Pre-Commit-ESLint, related Vitest, Security-Check und Regressionsevaluator bestanden.
- [x] Review-Evaluator: 10/10 gesamt, Sicherheit 9,9/10, 49 erledigte Findings, 0 offen/neu, keine Regression; Snapshot `history/2026-11-02_1115.json` dokumentiert.
- [ ] Browser-Viewport-/Dark-Mode-/200-%-Zoom- und manuelle VoiceOver-Abnahme nach Wiederverfügbarkeit des Browserhosts.
- [ ] Schreibendes Browser-E2E nur mit isolierter Testdatenbank.

Erfolgsmessung: Die Web-Spielauswahl filtert lokal und speichert ausschließlich
eine gültige ID aus den aktuellen Optionen. Die bestehende Serverautorisierung
bleibt aktiv. Responsive und manuelle Screenreaderabnahmen sind offen.


- [x] Evaluator erneut mit Registryzugriff ausgeführt: 10/10, Sicherheit 9,9/10, 0 offene/neue Findings, keine Regression; Snapshot `history/2026-11-02_1235.json`.
