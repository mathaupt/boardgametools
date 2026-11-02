# BUG-068 – Rückmeldung und Listenabgleich beim Serienimport

## Aktualitätsprüfung und bestätigter Umfang

Ausgangsstand `e8d737d`, 0.50.65, sauberer Arbeitsbaum. Bug-Fix durch Fehlerbericht am 02.11.2026 autorisiert. Nutzer bestätigt BGG-Suche und präzisiert: Das Spiel wird offenbar hinzugefügt, aber die Rückmeldung ist fehlerhaft. 409 bleibt als serverseitiger Duplikatstatus erhalten. Kein neuer Featureumfang, keine Schemaänderung, keine Produktionsschreibtests.

Bestätigt: Der Dialog ignoriert 409 und sonstige Fehler; erfolgreiche POSTs schließen ohne abgewartetes Nachladen. Aktive Filter können einen neuen oder bereits vorhandenen Eintrag verstecken. Die genaue Ursache des ersten Produktionskonflikts bleibt ohne Produktionsnachweis offen. Die lokal konfigurierte Datenquelle enthält die gemeldete Reihen-ID nicht; die Diagnose lief in einer READ-ONLY-Transaktion und änderte keine Daten. Übermittelte Sitzungscookies werden nicht verwendet oder dokumentiert.

## RED → GREEN → REFACTOR

- RED: `npx vitest run tests/unit/api/series-entry-conflict.test.ts tests/unit/components/series-entry-conflict.test.tsx`. Zunächst drei API- und drei UI-Verträge erwartungsgemäß rot: deutsche Konfliktmeldung, kontrollierte Authantwort, private GET-Antwort sowie beide Hinzufügenpfade und Nachladefehler.
- Zusätzlich RED: Server meldet Konflikt, aktueller GET enthält Zielspiel weiterhin nicht. Der Dialog darf hier nicht schließen oder einen erfolgreichen Abgleich melden.
- GREEN: Gemeinsamer Hinzufügen-Hook, vorhandenes Spiel als Hinweis, abgewartetes frisches GET, Zielspielprüfung, Filter-Reset nur nach erfolgreichem Abgleich. Fehlende/fehlerhafte Rückmeldung sichtbar im Dialog, keine automatische Wiederholung des POST. Gleichzeitige Klicks sperren.
- REFACTOR: BGG-Suchoberfläche auslagern, Dialog unter 300 Zeilen. Eigentümerprüfung und serverseitige Duplikatsperre behalten. API meldet vorhandenes Spiel auf Deutsch; Auth-Fehler kontrolliert beantworten und GET explizit privat/nicht zwischenspeicherbar.
- Abnahme: gezielte Tests einschließlich normalem Import, fremder Reihe, fehlender Anmeldung, widersprüchlichem GET, HTTP-Fehlern und Doppelclick; `npm run test:coverage`, `npm run typecheck`, ESLint, Build, Security und Review-Regressionscheck. Messdatei nach vollständigem Testlauf aktualisieren.
- UI: Impeccable und lokale gerenderte Prüfung realer Komponenten mit synthetischen Daten, insbesondere BGG → 409 → sichtbarer Eintrag und Fehlerrückmeldung. Mobile Breite, Hell/Dunkel und große Schrift prüfen; keine Anmeldung mit übermittelten Cookies.
- Dokumentation: BUG-068, Changelog 0.50.66, betroffene API-/Feature-/FAQ-/Agentendokumente, Reviewnachweise und Commit mit Hooks. Reguläres Deployment bleibt getrennt.

## Ergänzung beim Fortsetzen

BUG-069 (gelbe Duplikatswarnung nach erfolgreichem Sammlungsimport) wurde zusätzlich vom Nutzer gemeldet. Der Regressionstest in `bgg-import-editions.test.tsx` hielt die Navigation zurück und reproduzierte vor dem Fix exakt die gelbe Warnung. GREEN: bestätigten Importzustand von vorhandenen Sammlungs-IDs trennen; Erfolg anzeigen und weiteres Absenden sperren. Keine Änderung am Import-API-Vertrag oder an echten Duplikatprüfungen. Abnahme zusammen mit BUG-068 in Version 0.50.66, einschließlich vollständigem Coverage-Lauf und aktualisierter Messdatei.

Neue Wünsche FEAT-023 bis FEAT-027 werden ausschließlich als Anforderungen mit Ziel, Abnahmekriterien und Planungsbedarf erfasst. Temporärer Reihenbesitz und Mehrfachauswahl benötigen eigene Daten-/Berechtigungsentscheidungen; diese Implementierung nimmt keine entsprechende Migration oder Funktionsfreigabe vor.

## Abschluss – 0.50.66

- 13 gezielte Serien-API-/UI-Tests, zusätzlich 3 Einzelimporttests einschließlich BUG-069 grün. RED für die jeweiligen Defekte dokumentiert, nach Auslagerung der BGG-Suche erneut grün; Dialog und neue Komponenten unter 300 Zeilen.
- `npm run test:coverage`: 154 Dateien, 1.062 Tests grün; bestehende Gates bestanden, Messdatei aktualisiert. Gesamt: 62,09 % Anweisungen, 58,15 % Zweige, 67,30 % Funktionen und 63,60 % Zeilen. Keine Coverage-Ausschlüsse oder Schwellen verändert.
- `npm run build` mit Typprüfung, anschließendes `npm run typecheck` und ESLint erfolgreich (0 Fehler, 651 bestehende Werkzeug-/Testwarnungen). Security-Check: 0 Fehler, zwei bekannte Hinweise. Review: 10/10 gesamt, Sicherheit 9,9/10, keine Regressionen (`history/2026-11-02_1931.json`).
- Impeccable-Quelldetektor und gerenderte lokale Safari-Prüfung mit realen Komponenten/globalem CSS, synthetischen Antworten. Desktop hell: BGG → 409 → Reihe mit Zielspiel und Hinweis; Sammlungsimport → Erfolg ohne gelbe Warnung. Mobil dunkel, 390 px und 200 % Schrift: Fehler bleibt im offenen Dialog. Der dabei gefundene Überlauf wurde durch umbrechende Navigation/Aktionen und einen vollständig scrollbar begrenzten Dialog behoben; danach kein horizontaler Dialog- oder Dokumentüberlauf.
- Eigentümer-/Auth-Verträge und serverseitige Duplikatsperre erhalten; keine Migration, keine neuen Datenrechte oder Provider. Abgleich prüft das tatsächliche Zielspiel, ohne POST automatisch zu wiederholen. READ-ONLY-Diagnose ist keine Produktionsabnahme. Übermittelte Cookies weder verwendet noch in Artefakte übernommen.
- FEAT-023 bis FEAT-027 ausschließlich im Backlog aufgenommen; Planung/Freigabe/Umsetzung bleiben offen. Kein Deployment ausgeführt.
