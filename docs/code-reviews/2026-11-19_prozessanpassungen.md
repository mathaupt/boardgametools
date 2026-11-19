# Prozessanpassungen – 19.11.2026

## FEAT-034 Eventlistenquery

- RED zuerst für den Queryvertrag und den sichtbaren Gesamtzähler; nach dem Fix 1.479 Tests, Typprüfung, gezieltes ESLint, Securitycheck und Build erfolgreich.
- Der Browserhost war nicht verfügbar. Eine lokale Vorschau mit synthetischen Daten und Chromium lieferte gerenderte Belege in acht Theme-/Viewportkombinationen; temporäre Route und Server wurden danach entfernt.
- TypeScript wurde einmal parallel zum Build gestartet und traf auf gerade neu erzeugte `.next/types`. Der anschließende isolierte Typecheck nach beendetem Build bestand. Build und Typecheck künftig nicht parallel starten.
- Evaluatorreports ohne Registryzugriff nicht als Paketbefund behandeln. Den Reviewlauf nach Registryzugriff wiederholen; dieser Commit-Hook meldete 0 Vulnerabilities und der Evaluator 10/10 ohne Regression.

## Erfolgsmessung

Die Eventlistenquery lädt keine vollständigen Teilnehmer- oder Stimmenlisten mehr. Sichtbare Eventinhalte und Zähler bleiben erhalten; pro Event werden höchstens drei sortierte Vorschläge abgerufen. Keine Schema-, API-, Berechtigungs- oder Produktionsdatenänderung.
