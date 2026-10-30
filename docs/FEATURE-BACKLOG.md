# Feature-Backlog

Nummerierte Anforderungen für spätere Implementierungspläne und Umsetzungen.
Ein Eintrag ist keine Umsetzungsfreigabe. IDs werden fortlaufend vergeben und
nicht wiederverwendet. Verbindlicher Ablauf:
[Entwicklungsprozess](DEVELOPMENT-PROCESS.md#verbindlicher-feature-ablauf).

## Übersicht

| ID | Feature | Status | Implementierungsplan | Umsetzungsfreigabe |
|---|---|---|---|---|
| FEAT-001 | Spieldetails aus dem Voting öffnen | Erfasst | Ausstehend | Ausstehend |
| FEAT-002 | Voting-Vorschläge sortieren | Erfasst | Ausstehend | Ausstehend |
| FEAT-003 | Kompakte Voting-Liste prüfen | Prüfung vorgemerkt | Ausstehend | Ausstehend |
| FEAT-004 | Voting-Vorschläge löschen | Erfasst | Ausstehend | Ausstehend |

Am 30.10.2026 aufgenommen. Bei der Planung sind Web, iOS sowie angemeldete und
öffentliche Voting-Ansichten auf Relevanz und bereits vorhandene Teilfunktionen
zu prüfen. Der konkrete Plattformumfang wird im jeweiligen Plan festgelegt und
zur Umsetzung freigegeben.

## FEAT-001 – Spieldetails aus dem Voting öffnen

**Ziel:** Ein vorgeschlagenes Spiel beurteilen können, ohne es separat suchen zu müssen.

**Anforderung:** Ein Link am Spiel führt zur Spielansicht; alternativ öffnet sich
eine Detailansicht als Layer beziehungsweise natives Sheet. Die passende Variante
je Plattform wird im Implementierungsplan entschieden.

**Abnahmekriterien für die spätere Umsetzung:**

- Spieldetails sind direkt aus einem Voting-Vorschlag erreichbar.
- Nach dem Schließen beziehungsweise Zurückgehen bleibt der Voting-Kontext erhalten.
- Sammlungsspiele und BGG-Vorschläge berücksichtigen; fehlende Details verständlich anzeigen.
- Gästen ausschließlich freigegebene Daten zeigen. Navigation, Fokus, Tastaturbedienung
  beziehungsweise VoiceOver mit Impeccable prüfen.

## FEAT-002 – Voting-Vorschläge sortieren

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
