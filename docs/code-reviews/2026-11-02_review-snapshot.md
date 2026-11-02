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
