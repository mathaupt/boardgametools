# Prozessanpassungen – FEAT-035

- [x] Design und Navigation B mit der Nutzerin abgestimmt; konkrete Spezifikation und Implementierungsplan freigegeben.
- [x] Plan unmittelbar vor Umsetzung gegen HEAD und Arbeitsbaum geprüft.
- [x] Neue Einladungs-, Dashboard-, Navigations- und Copy-Verträge zuerst als RED-Tests erfasst.
- [x] Parallele Einladungsantworten und getrennte Fehler je Einladung durch zusätzliche Regressionstests abgesichert.
- [x] HTTP- und Netzwerkfehler zeigen Wiederherstellung; erfolgreiche Antwort entfernt nur die bestätigte Einladung.
- [x] Browserhost nicht verfügbar; responsives Rendering mit Playwright Chromium und temporären synthetischen Daten ausgeführt.
- [x] Hell/Dunkel und 320/390/768/1440 CSS-Pixel geprüft; kein horizontaler Überlauf.
- [x] Vollständige Tests, TypeScript, ESLint, Build und Security-Check vor Commit bestanden.
- [x] Nach Commit Review-Evaluator mit Registryzugriff ausgeführt und Regressionsevaluator bestanden.
- [x] Unbeabsichtigten Evaluatorlauf durch Shell-Command-Substitution erkannt; gültigen Audit- und Regressionlauf wiederholt und Backtick-Quoting korrigiert.
- [ ] BUG-088: moderaten Next.js-Befund separat prüfen und ein Frameworkupdate planen.

Erfolgsmessung: 1.474 Webtests in 234 Dateien; Review 10/10 gesamt,
49 gelöste, 1 teilweise gelöst, 0 offene Findings; keine Regression. Security:
0 Fehler, bestehender moderater Next.js-Befund (BUG-088) und zwei bekannte
statische Warnungen.
