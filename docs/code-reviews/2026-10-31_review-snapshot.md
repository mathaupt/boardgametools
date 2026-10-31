# Review-Snapshot – FEAT-003 Voting-Listen 0.50.28

Commit `9e52e23` setzt FEAT-003 in der Web-App um. Nach sichtbarem Vergleich
wählte die Nutzerin die kompakte Zeilenliste. Die Umsetzung umfasst öffentliche
Events, die Eventdetailseite und die eigene Voting-Seite. iOS bleibt separat.

- Review-Evaluator vor und nach Änderung: 10/10, 50 Findings erledigt, 0 offen, keine Regressionen. History: `history/2026-10-31_0115.json`.
- 680 Unit-Tests in 80 Dateien bestanden; TypeScript, gezieltes ESLint und Produktionsbuild erfolgreich.
- Commit-Hooks: ESLint, zugehörige Tests, Security-Check und Regressionsevaluator erfolgreich.
- Security-Check: 0 Fehler, zwei bestehende Hinweise zu Raw-SQL-Stellen und Debug-Routen; `npm audit` ohne Befunde.
- Browserprüfung mit synthetischen Daten: 0/1/10/30 Vorschläge, 390/1440 px, hell/dunkel und 200 % Zoom. Vier vollständige Zeilen im mobilen Erstbild; bei 200 % kein horizontaler Überlauf oder Textüberlagerung.
- Impeccable-Detektor auf 390 × 844 und 1440 × 900: keine Befunde. Bugregister um BUG-047 ergänzt und als behoben markiert.
- Keine Datenbank-, API- oder iOS-Änderung. Vorschau- und Browserprozess nach Prüfung beendet.

Der Evaluator-Score bewertet Quellmuster, nicht die gesamte UX- oder Security-Abnahme.

## Ergänzung: Implementierungspläne FEAT-009 bis FEAT-011 – 0.50.29

Drei eigenständige Pläne für Klartextnormalisierung und Bestandsbereinigung,
Eventzustand/Ergebnis und zugängliche Terminbedienung erstellt. FEAT-011 baut
auf den Zustandssperren aus FEAT-010 auf; FEAT-009 ist unabhängig ausführbar.
Umsetzungsfreigaben bleiben ausstehend. Keine produktiven Daten gelesen oder
geändert, keine neue Abhängigkeit installiert und keine Oberfläche implementiert.

- Planprüfung: Dateipfade und bestehende Routen untersucht; lokale Markdown-Verweise gültig; Codebeispiele und Platzhalterprüfung durchgeführt.
- Neue offene Quellbefunde: BUG-048 (fehlende Eventbindung bei Spiel-/Terminantworten) und BUG-049 (uneinheitliche Entity-Verarbeitung). BUG-037 um Backendbefund ergänzt.
- Planregeln berücksichtigen Legacy-status aus iOS, date-only-Termine, transaktionale Zustandssperren, sicheren Klartext und gesonderte Produktionsbereinigung.
- Evaluator-Vorlauf meldete 10/10 und 50 erledigte Musterfindings. Der Commit-Hook mit vollständiger Registry-Antwort bewertet Sicherheit mit 9,9/10 und SEC-45 als teilweise gelöst; eine Regression blockiert den Commit. Gesamtwert wird weiter als 10/10 gerundet.

Die neu dokumentierten fachlichen und Sicherheitsfehler sind offen. Zusätzlich
sind bestehende Paketbefunde (BUG-050) und die fehlerhafte Audit-Fehlerbehandlung
des Evaluators (BUG-051) erfasst. Paketdateien sind unverändert; keine neue
Commit-Baseline akzeptiert und kein Hook umgangen. Die Pläne sind gespeichert,
der Commit ist blockiert. Laufzeit- und Integrationsnachweise sind Bestandteil
der später freizugebenden Umsetzung.
