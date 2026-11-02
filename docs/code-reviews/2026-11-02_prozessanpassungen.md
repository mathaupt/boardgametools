# Prozessanpassungen – FEAT-015

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
