# Feature-Backlog

Nummerierte Anforderungen für spätere Implementierungspläne und Umsetzungen.
Ein Eintrag ist keine Umsetzungsfreigabe. IDs werden fortlaufend vergeben und
nicht wiederverwendet. Verbindlicher Ablauf:
[Entwicklungsprozess](DEVELOPMENT-PROCESS.md#verbindlicher-feature-ablauf).

## Übersicht

| ID | Feature | Status | Implementierungsplan | Umsetzungsfreigabe |
|---|---|---|---|---|
| FEAT-001 | Spieldetails aus dem Voting öffnen | Umgesetzt (Web) | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Freigegeben und umgesetzt am 30.10.2026 |
| FEAT-002 | Voting-Vorschläge sortieren | Plan erstellt | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Ausstehend |
| FEAT-003 | Kompakte Voting-Liste prüfen | Prüfplan erstellt | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Ausstehend |
| FEAT-004 | Voting-Vorschläge löschen | Plan erstellt | [Gemeinsamer Plan](superpowers/plans/2026-10-30-FEAT-001-004-voting.md) | Ausstehend |

Am 30.10.2026 aufgenommen. Bei der Planung sind Web, iOS sowie angemeldete und
öffentliche Voting-Ansichten auf Relevanz und bereits vorhandene Teilfunktionen
zu prüfen. Der konkrete Plattformumfang wird im jeweiligen Plan festgelegt und
zur Umsetzung freigegeben.

## FEAT-001 – Spieldetails aus dem Voting öffnen

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Am 30.10.2026 ausdrücklich für FEAT-001 erteilt; Web umgesetzt. Native iOS-Oberfläche separat zu planen.

**Ziel:** Ein vorgeschlagenes Spiel beurteilen können, ohne es separat suchen zu müssen.

**Umsetzung:** Spielname und Aktion „Spieldetails“ öffnen auf allen drei Web-Votingansichten
denselben zugänglichen Dialog. Native iOS-Oberfläche separat planen.

**Abnahmekriterien für die spätere Umsetzung:**

- [x] Spieldetails sind direkt aus öffentlichen und geschützten Voting-Vorschlägen erreichbar.
- [x] Schließen per Aktion oder Escape erhält Liste und gibt den Fokus an den Auslöser zurück.
- [x] Sammlungsspiele und BGG-Vorschläge berücksichtigen; fehlende Details verständlich anzeigen.
- [x] Öffentliche Gäste erhalten keine lokale Sammlungsbeschreibung; Abfrage ist token- und vorschlagsgebunden, nicht cachebar und rate-limitiert.
- [x] Dialogbedienung mit Tastatur und Bildschirmleser über Radix-Dialog, Labels und Fokusführung unterstützt.
- [x] Sichtprüfung bei 390/1440 px sowie Hell-/Dunkelmodus; Impeccable-Renderdetektor ohne Befund. Interner Scroll, Viewportbegrenzung, Escape und Fokus-Rückgabe geprüft.

**Abgeschlossen:** 30.10.2026, Version 0.50.26. Spieldetails werden erst nach Öffnen geladen. Fehler haben eine Wiederholungsaktion; BGG-Ausfall lässt verfügbare Grunddaten bestehen. Private Datenfreigabe setzt Event-Ersteller-/Einladungszugriff voraus.

## FEAT-002 – Voting-Vorschläge sortieren

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Ausstehend.

**Ziel:** Führende Spiele und andere Vorschläge schnell vergleichen können.

**Anforderung:** Die Vorschlagsliste erhält eine wählbare Sortierung.
Standard: **Anzahl der Stimmen, absteigend** – die meisten Votes zuerst.

**Abnahmekriterien für die spätere Umsetzung:**

- Ohne aktive Auswahl ist die Liste nach Stimmenzahl absteigend sortiert.
- Eine beschriftete Auswahl erlaubt weitere Sortierungen; konkrete Optionen im Plan festlegen.
- Gleichstände, Vorschläge ohne Stimmen und neue Votes haben ein im Plan definiertes,
  nachvollziehbares Verhalten.
- Sortierung verändert weder Stimmen noch Voting-Ergebnisregeln.

## FEAT-003 – Kompakte Voting-Liste prüfen

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Ausstehend.

**Ziel:** Bei vielen Vorschlägen mehr Überblick auf begrenztem Bildschirmraum erhalten.

**Prüfauftrag:** Eine kürzere Listendarstellung gegenüber der bisherigen Darstellung
untersuchen. Dies ist eine offene Gestaltungsprüfung, noch keine Entscheidung für
einen bestimmten Listenmodus.

**Abnahmekriterien für die spätere Planung:**

- Varianten mit realistischen Vorschlagsmengen vergleichen, auch mobil und mit langen Namen.
- Spielname, Stimmenzahl, Abstimmungsaktion und Zugang zu Details bleiben verständlich;
  Löschaktionen berücksichtigen.
- Lesbarkeit, Touch-Flächen, große Schrift und Screenreader-Nutzung mit Impeccable prüfen.
- Empfehlung mit Vor- und Nachteilen vorlegen und vor Umsetzung freigeben lassen.

## FEAT-004 – Voting-Vorschläge löschen

**Implementierungsplan:** [FEAT-001 bis FEAT-004](superpowers/plans/2026-10-30-FEAT-001-004-voting.md).
**Plattformumfang:** Web zuerst, iOS separat; am 30.10.2026 bestätigt.
**Umsetzungsfreigabe:** Ausstehend.

**Ziel:** Nicht mehr gewünschte Einträge aus einer Abstimmung entfernen können.

**Anforderung:** Einträge der Voting-Vorschlagsliste sollen löschbar sein.
Gemeint ist der Vorschlag im Voting, nicht das Spiel in der Sammlung.

**Abnahmekriterien für die spätere Umsetzung:**

- Berechtigte Nutzer können einen Vorschlag über eine erkennbare Aktion entfernen.
- Wer löschen darf und in welchen Voting-Zuständen, vorab im Plan festlegen.
- Folgen für vorhandene Stimmen, Gewinner und ausgewählte Spiele vor Umsetzung klären.
- Versehentliches Löschen durch passende Bestätigung oder Wiederherstellung abfangen;
  konkrete Lösung im Plan festlegen.
- Berechtigungen serverseitig prüfen; unberechtigte Zugriffe und die Behandlung
  vorhandener Stimmen durch Regressionstests absichern.

## Nachverfolgung

Je Feature werden Planpfad, offene Entscheidungen, Datum und Umfang der expliziten
Umsetzungsfreigabe, Prüfergebnisse und später die Release-Version ergänzt.
Zusammengehörige Features dürfen einen gemeinsamen Plan haben, behalten aber
ihre IDs und Abnahmekriterien.
