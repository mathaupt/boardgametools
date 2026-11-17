# Prozessanpassungen – FEAT-033 A–C

- [x] Freigabe „Umsetzung A-C“ und Aktualitätsprüfung dokumentiert.
- [x] Reale Swift-DTOs und SwiftData statt paralleler Testmodelle geprüft.
- [x] Datumsabhängige Tests mit fester Date-Uhr und Cleanup stabilisiert.
- [x] Mobile und Web teilen die validierte Reihenanlage; Auth bleibt je Route.
- [x] Snapshot-/Gastpartien vor verlustbehafteter Bearbeitung geschützt.
- [x] Duplikate erst nach verifiziertem Listenabgleich als abgeschlossen behandelt.
- [x] Native Sichtprüfung trotz fehlendem Browserhost über Simulator durchgeführt.
- [x] Größte Schrift geprüft, Suchfeld-Clipping korrigiert und nachgerendert.
- [x] Vollständige Coverage gemessen und generiertes Qualitätsartefakt übernommen.
- [x] Security-/Review-Regressionscheck bestanden; reale Testnachweise separat erfasst.
- [ ] Vollständige gesprochene VoiceOver-Abnahme auf echter Hardware.
- [ ] Produktionsbackend vor späterer nativer Veröffentlichung ausrollen.
- [ ] BUG-086: historische OpenAPI-Komponenten separat vervollständigen.

Erfolgsmessung: 1.461 erfolgreiche Webtests, zehn erfolgreiche Xcode-Tests,
alle globalen und `src/lib`-Coverage-Gates bestanden, Evaluator 9,9/10 ohne Regression.


**Finaler Reviewhinweis:** Commit `460ab89` und Nachlauf bestätigen keine
Regression. Der Evaluator meldet „Coverage Regression Tracking“ wegen fehlender
Coveragefelder in älteren Review-History-Snapshots; dadurch 9,9/10 statt des
vorläufigen 10/10. Die realen aktuellen Coveragewerte sind separat vollständig
gemessen und in `src/data/quality-metrics.json` enthalten. Historische Werte
werden nicht erfunden oder nachträglich hochgesetzt.
