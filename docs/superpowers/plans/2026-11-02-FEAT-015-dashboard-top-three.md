# FEAT-015 – Top drei Spiele im Dashboard

## Ziel und Umfang

Die hervorgehobene Eventkarte im angemeldeten Web-Dashboard zeigt unter
„Was kommt auf den Tisch?“ höchstens die drei Vorschläge mit den meisten
Gesamtstimmen. Jede kompakte Zeile enthält ein kleines Cover oder einen
Würfel-Fallback, Rang, Spielname und die Gesamtstimmenzahl. iOS, Events-
Übersicht und Eventdetail bleiben außerhalb dieses Umfangs.

## Entscheidungen

- Stimmenzahl ist die Summe aus Konto- und Gaststimmen, wie in der bestehenden
  Voting-Ansicht.
- Sortierung: Gesamtstimmen absteigend, bei Gleichstand ältester Vorschlag
  zuerst, danach Vorschlags-ID aufsteigend als stabiler Tie-Breaker.
- Es wird eine kompakte vertikale Zeilenliste verwendet. Kleine Eventkarten
  können Bild, Titel und Zahl so ohne enge Dreispalten-Kacheln zeigen; lange
  Namen dürfen umbrechen.
- Wenn ein Spiel bereits festgelegt ist, bleibt das bestehende Verhalten
  bestehen und die Vorschlagsübersicht wird ausgeblendet. Bei geschlossenem
  Voting ohne festgelegtes Spiel bleibt die Top-3-Zusammenfassung sichtbar.
- Für Spiele aus der Sammlung gilt `game.imageUrl`, für BGG-Vorschläge
  `bggImageUrl`; fehlende Cover zeigen ein dekoratives Würfelsymbol. Das Cover
  erhält leeren Alternativtext, da der Spielname direkt daneben steht.
- Daten bleiben auf Events begrenzt, die der angemeldete Nutzer im Dashboard
  bereits sehen darf. Die Abfrage wählt nur für diese Darstellung benötigte
  Vorschlagsfelder sowie aggregierte Konto-/Gaststimmenzahlen aus.

## Aktualitätsprüfung vor Umsetzung – 02.11.2026

- Geprüfter Commit: `ad316d0`.
- Arbeitsbaum enthält die FEAT-015-Backlogaufnahme, Changelognotiz und die
  Review-Dokumentation aus der vorherigen Runde; diese Änderungen werden
  beibehalten.
- FEAT-001–004 und FEAT-010–014 ändern die Voting- und Eventdetails. Die
  vorhandene Votingdarstellung zählt Konto- plus Gaststimmen; die Dashboard-
  Abfrage zählt derzeit nur die drei neuesten Vorschläge und gibt keine Bilder
  oder Votes aus.
- Aktueller Scope stimmt mit FEAT-015 überein. Aktualisierung: Vote-Counts für
  beide Relationen ergänzen; wegen Summe beider Typen in der Anwendung stabil
  sortieren und auf drei begrenzen. UI bleibt in der bestätigten
  Club-Programme-Karte, kompakte Zeilen gemäß Impeccable-Prüfung.
- Freigabe: ausdrückliche Nutzeranweisung „dann implementiere FEAT-015“ am
  02.11.2026; nur Web-Dashboard, keine iOS-Oberfläche.

## Dateien und Aufgaben

1. `src/lib/dashboard-event-proposals.ts`: typisierte, reine Rang-/Top-3-Logik.
2. `src/app/(dashboard)/dashboard/page.tsx`: Für das autorisierte,
   hervorgehobene Dashboard-Event ohne festgelegtes Spiel zunächst IDs,
   Erstellungszeit und `_count` für `votes`/`guestVotes` lesen. Nach
   Gesamtstimmen sortieren; Namen, Dauer und Bild-URLs separat nur für die drei
   bestplatzierten Vorschläge abfragen.
3. `src/components/dashboard/event-preview.tsx`: DTO um Bild und Gesamtstimme
   erweitern und die kompakte Rangliste mit Cover-Fallback rendern.
4. `src/app/club.css`: kleine Cover und Zeilenabstände aus vorhandenen
   semantischen Club-Programme-Farben ableiten; schmale Karten und lange Titel
   ohne Überlauf unterstützen.
5. `tests/unit/lib/dashboard-event-proposals.test.ts` und
   `tests/unit/components/club-dashboard.test.tsx`: Rang-/Tie-Breaker,
   Limit, Gaststimmen, fehlende Bilder, Stimmenplural und sichtbare Darstellung
   sichern.
6. `docs/FEATURE-BACKLOG.md`, `docs/FEATURES.md`, `src/lib/faq.ts` und
   `src/lib/changelog.ts`: Freigabe, Umsetzung, Dashboardverhalten und
   Nutzerinformation aktualisieren.

## Durchführung und Prüfung

- Zuerst Rangfolgetests für sortierte, gleichauf liegende und gemischte
  Konto-/Gaststimmen schreiben und gegen die noch fehlende Helperfunktion rot
  ausführen.
- Helper implementieren und gezielte Unit-Tests grün ausführen.
- Dashboard-Abfragen auf die ID des autorisierten, hervorgehobenen Events
  begrenzen. Für alle Vorschläge nur Rangfelddaten, vollständige Spiel- und
  Bilddaten nur für die Top drei lesen; keine API, Berechtigung oder
  Datenbankmigration hinzufügen.
- Preview-Zeilen implementieren und Komponententests für Top-3-Ausgabe, Bild
  beziehungsweise Fallback, Rang, Stimme/Stimmen sowie ausgewähltes Spiel
  ausführen.
- Gezielte Impeccable-Detektor-, TypeScript-, Lint- und Regressionsevaluierung
  ausführen. Wenn ein Browserhost verfügbar ist, 390-px- und 200-%-Zoom-Ansicht
  prüfen; andernfalls den fehlenden gerenderten Nachweis dokumentieren.
- Vor Abschluss prüfen, dass Datenabfrage ausschließlich freigegebene
  Dashboardevents liest und weder Stimmen noch Eventzustände verändert.

## Status

Plan aktualisiert und mit der ausdrücklichen Umsetzungsanweisung freigegeben.
Keine Datenbankschema- oder API-Vertragsänderung vorgesehen.

## Umsetzungsergebnis – 02.11.2026

- Rang-/Top-3-Helper und Dashboard-Preview umgesetzt; gezielte Unit-Tests 7/7
  bestanden.
- Top drei werden aus Konto- plus Gaststimmen sortiert. Gleichstände lösen
  ältester Vorschlag und dann ID auf. Das Dashboard lädt nur Vorschläge des
  hervorgehobenen Events für die Rangfolge und vollständige Spiel-/Bilddetails
  nur für die Top drei, wenn noch kein Spiel festgelegt ist.
- Zeilen zeigen Rang, Titel, Stimmenzahl und vorhandenes Game-/BGG-Cover oder
  den Würfel-Fallback. Auswahl blendet die Zeilen aus; geschlossenes Voting
  ohne festgelegtes Spiel zeigt sie weiter.
- Impeccable-Detektor: 0 statische Findings. `npm run typecheck` und gezieltes
  ESLint für die geänderten TypeScript-Dateien erfolgreich; der vollständige
  ESLint-Lauf hatte 0 Fehler und 651 Warnungen aus lokalen Impeccable-Skripten.
  Browserhost nicht verfügbar; 390-px- und
  200-%-Zoom-Viewportabnahme bleibt offen.
