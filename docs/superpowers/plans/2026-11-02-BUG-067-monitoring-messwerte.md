# BUG-067 – Veraltete Qualitätsmesswerte im Monitoring

Freigabe: Fehlerbericht des Nutzers am 02.11.2026; Bug-Fix innerhalb des bestehenden Monitorings, keine neue Featurefreigabe nötig.

## Aktualitätsprüfung und Ursache

Ausgangsstand: sauberer Commit `19ce8da` (0.50.64). Die Qualitätsroute liest lokale Review-History, von der nur ein älterer Snapshot versioniert ist. Testzahlen und Coverage-Vergleich sind hart kodiert. Das Deployment kann aktuelle lokale Dateien daher nicht kennen. Das Ziel von 80 % ist bei `src/lib` erreicht; die gesamte gemessene Anwendung liegt darunter.

## Umsetzung und TDD

1. RED: `npx vitest run tests/unit/scripts/quality-metrics.test.ts` – Generator darf Messwerte nicht verlieren/verfälschen oder fehlgeschlagene, unvollständige und gefilterte Berichte veröffentlichen. Zunächst fünf erwartete Fehlschläge gegen einen leeren Generator.
2. GREEN: `scripts/update-quality-metrics.mjs` erzeugt aus vollständigen Vitest-JSON- und Coverage-Berichten eine versionierte `src/data/quality-metrics.json` mit Version, Messzeitpunkt, Gesamtwerten, gewichteten `src/lib`-Werten und tatsächlichen Testzahlen. Testdateiinventar gegen Runner-Bericht abgleichen. Nur ein vollständiger erfolgreicher Coverage-Lauf aktualisiert atomar die Datei.
3. RED/GREEN API: `npx vitest run tests/unit/api/monitoring-quality.test.ts` reproduziert alte 25/24/21/25-Prozente trotz neuer Messdatei. Danach liest die authentifizierte Adminroute die gebündelte Messdatei, entfernt den erfundenen Vergleich und liefert `private, no-store`.
4. RED/GREEN UI: `npx vitest run tests/unit/components/quality-coverage.test.tsx tests/unit/components/quality-tab.test.tsx tests/unit/components/monitoring-quality-label.test.tsx` – fehlende Messstände, historische Einordnung und falscher Umlaut zuerst rot. Danach Gesamtumfang und Bibliothek trennen, deutsche Zahlenformatierung und zugängliche Balken ergänzen; übrige Kennzahlen ausdrücklich als historischen Reviewstand kennzeichnen.
5. REFACTOR/Abnahme: dieselben gezielten Tests, `npm run test:coverage`, `npm run typecheck`, `npm run lint`, `npm run build`, Security und Regressionsevaluator. Tatsächliche Reporter-/Generatorausgabe prüfen. Impeccable und gerenderte lokale Safari-Prüfung bei 390/1024 px, Hell/Dunkel und 200 % Schrift.
6. Dokumentation: BUG-067, Changelog 0.50.65, Monitoring-API-Vertrag, FEATURES, FAQ, Deployment, AGENTS und Review-Dokumente aktualisieren; Commit mit vorgeschriebenen Hooks. Kein automatisches Deployment, keine Datenbankmigration oder schreibende Produktionsprüfung.

## Begrenzung

Der Fix verbindet Coverage und Testzahlen mit echten Messergebnissen. Er macht keine manuell gepflegten Deep-Dive-, Architektur-, Dependency- oder Lintzahlen zu Live-Messungen; diese werden mit historischem Stand beschriftet. Die Messdatei enthält keine absoluten lokalen Dateipfade, Testausgaben oder Zugangsdaten.

## Abschluss – 0.50.65

- Alle RED-Nachweise bestätigt, anschließend 12/12 gezielte Tests grün. Zusätzlicher Test für gefilterte Runner-Berichte bewahrt die vorherige Messdatei.
- Tatsächlicher vollständiger `npm run test:coverage`: 152 Testdateien, 1.048 Tests und bestehende Coverage-Gates bestanden. JSON-Reporter hat `coverage/test-results.json` geschrieben; der nachgeschaltete Generator hat die versionierte Messdatei aktualisiert. Messzeitpunkt `2026-11-02T14:20:45.841Z`; keine absolute lokale Pfadangabe im Artefakt.
- Gesamt: Anweisungen 60,91 %, Zweige 57,07 %, Funktionen 66,00 %, Zeilen 62,31 %. `src/lib` gewichtet: 89,01/80,48/90,93/91,53 %. Keine Messschwellen abgesenkt oder Runtime-Dateien aus der Coverage entfernt.
- `npm run build` mit Typprüfung erfolgreich; `npm run lint`: 0 Fehler, 651 bestehende Werkzeug-/Testwarnungen. Security-Check: 0 Fehler, zwei bekannte Hinweise. Regressionsevaluator mit Registryzugriff: 10/10 gesamt, Sicherheit 9,9/10; keine Regressionen (`history/2026-11-02_1522.json`). Sandbox-Audit ohne gültige Netzantwort im Regressionslog erklärt und durch gültigen Lauf aufgelöst.
- Impeccable: 0 Regex-Antipatterns; bestehende Typografie-Advisories im übrigen Monitoring sind kein Nachweis einer vollständigen Designabnahme. Neue Anzeige zusätzlich gerendert geprüft: reales QualityTab mit echter Messdatei und synthetischen übrigen Daten über lokalen Vite-Server, native Safari-Steuerung. 1024 px hell sowie 390 px dunkel und 200 % Schrift, Prozentwerte und Messquelle sichtbar; keine überlaufenden Coverage-Flächen oder Dokumentbreiten.
- Sicherheit: ADMIN-Schutz bleibt erhalten und ist getestet. API liefert `private, no-store`. Keine neue externe Ressource, Datenfreigabe, Zugangsdaten oder Datenbankmutation. Dashboardprüfung nutzt Fixtures; kein angemeldeter Produktions-E2E behauptet.
- Die Korrektur ist im Code abgeschlossen; Liveanzeige erst nach regulärem Deployment. Andere historische Review-Kennzahlen werden nicht als aktuelle Messungen ausgegeben.
