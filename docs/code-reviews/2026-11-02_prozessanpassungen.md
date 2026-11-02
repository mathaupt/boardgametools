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
