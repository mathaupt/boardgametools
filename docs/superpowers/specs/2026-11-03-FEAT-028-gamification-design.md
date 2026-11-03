# FEAT-028 – Gamification-Konzept

**Status:** Konzeptentwurf zur Nutzerprüfung; keine Umsetzungsfreigabe.
**Datum:** 03.11.2026
**Produktgrundlage:** `PRODUCT.md`, private Spielrunden als Hauptzielgruppe.

## Ziel

Gamification soll dazu anregen, Spielabende und Sessions festzuhalten, die eigene
Sammlung zu entdecken und mit einer Gruppe gemeinsame Spielziele zu erreichen.
Sie unterstützt die Freude am Spielen und Dokumentieren; sie bewertet weder
Spielstärke noch soziale Aktivität.

## Bestätigte Produktentscheidungen

- Persönliche Meilensteine, Entdeckerziele und gemeinsame Gruppen-Challenges
  gehören zum Konzept.
- Es gibt keine persönlichen, gruppeninternen oder globalen Ranglisten.
- Gruppenfortschritt fasst die Sessions teilnehmender Gruppenmitglieder zusammen.
  Die Mitglieder müssen dafür nicht gemeinsam am Tisch gesessen haben.
- Eine Teilnahme an einer Gruppen-Challenge ist freiwillig. Nur Sessions
  teilnehmender Mitglieder tragen zum Gruppenfortschritt bei.
- Die erste Umsetzung soll schrittweise geplant werden; dieses Konzept gibt
  keine Implementierung frei.

## Gestaltungsprinzipien

1. **Ermutigen, nicht verpflichten.** Keine täglichen Streaks, Verfallsfristen,
   Strafen oder Push-Erinnerungen zur Erfüllung eines Ziels.
2. **Spielen zählt mehr als Gewinnen.** Punkte, Platzierungen, Siege und
   Bewertungen sind keine Voraussetzung für Erfolge.
3. **Fortschritt nachvollziehbar halten.** Jede Auszeichnung erklärt in
   verständlicher Sprache, welches gespeicherte Verhalten sie ausgelöst hat.
4. **Privates bleibt privat.** Persönliche Erfolge sind standardmäßig nur für
   die betreffende Person sichtbar. Gruppen sehen ausschließlich den
   Gesamtfortschritt ihrer freiwilligen Challenge.
5. **Gäste nicht dauerhaft profilieren.** Event-Nicknames und einzelne
   Gaststimmen werden nicht über Events hinweg für Gamification verknüpft.
6. **Bestehende Spielabläufe nicht erschweren.** Für eine Session oder ein
   Gruppenziel werden keine zusätzlichen Pflichtfelder eingeführt.

## Drei miteinander verbundene Bereiche

### 1. Persönliche Meilensteine

Abzeichen würdigen dokumentierte Sessions und persönliche Spielvielfalt.
Beispiele für den ersten Inhaltssatz:

- erste, zehnte und fünfzigste dokumentierte Session;
- fünf verschiedene Spiele gespielt;
- ein Spiel aus der eigenen Sammlung zum ersten Mal gespielt;
- eine Spielreihe vollständig als gespielt markiert.

Die Schwellen sind Vorschläge für den Startinhalt und werden im
Implementierungsplan gegen Datenbestand, Aufwand und verständliche Progression
geprüft. Die Anzeige bietet neben freigeschalteten Abzeichen einen kleinen
Ausblick auf erreichbare Ziele, ohne andere Nutzer zu vergleichen.

### 2. Sammlung entdecken

Ein persönlicher Entdeckerbereich lenkt Aufmerksamkeit auf Spiele der eigenen
Sammlung, die noch nicht oder lange nicht gespielt wurden. Ein Sessioneintrag
aktualisiert den Fortschritt automatisch. Ziele bleiben individuell und
zeitlich offen; es gibt keine künstliche Verknappung.

Ein Spiel wird für „gespielt“ nur aus einer Session abgeleitet, in der die
Person als Mitspieler erfasst ist. Das bloße Anlegen einer Session für andere
schaltet keinen persönlichen Entdeckererfolg frei. Dokumentations-Meilensteine
zählen von der Person erstellte Sessions; Spielvielfalt zählt Sessions mit der
Person als Mitspieler; Spielreihen-Meilensteine verwenden den vorhandenen
Fortschritt der jeweiligen Reihe. Bei der Einführung werden passende
nicht-gelöschte historische Sessions berücksichtigt.

### 3. Kooperative Gruppen-Challenges

Ein Gruppenmitglied kann aus einer kleinen Auswahl gemeinsamer Ziele wählen,
zum Beispiel eine bestimmte Zahl Sessions dokumentieren oder eine bestimmte
Zahl verschiedener Spiele ausprobieren. Challenges laufen standardmäßig bis
zum Erreichen des Ziels; ein optionales Enddatum ist möglich. Die Challenge
zeigt Ziel, Zeitraum und gemeinsamen Fortschritt. Einzelne Beiträge, Profile
und Rangfolgen erscheinen nicht.

Die Teilnahme erfolgt ausdrücklich pro Mitglied. Ab dem Opt-in zählen nicht
gelöschte Sessions, die ein teilnehmendes Mitglied erstellt oder in denen es
als Mitspieler erfasst ist. Eine Session wird innerhalb einer Challenge nur
einmal gezählt, auch wenn mehrere teilnehmende Mitglieder darin vorkommen.
Teilnahme kann für künftige Sessions beendet werden; zuvor aggregierter
Fortschritt bleibt Bestandteil der gemeinsamen Challenge. Soft-gelöschte
Sessions zählen nicht.

Das bestehende Datenmodell verknüpft Sessions nicht direkt mit einer Gruppe.
Deshalb wird der Gruppenfortschritt aus den ausdrücklich teilnehmenden
Mitgliedern aggregiert und gibt keine einzelnen Sessiondatensätze an die Gruppe
frei. Die technische Umsetzung muss Mitgliedschaft, Einwilligung, Zeitraum,
Sessionkorrekturen und den Austritt aus einer Gruppe sicher abbilden.

## Sichtbarkeit und Bedienung

- Persönliche Erfolge und Entdeckerziele erscheinen in einem eigenen Bereich
  im angemeldeten Webprodukt; Profilfreigaben sind nicht vorausgesetzt.
- Gruppen-Challenges sind nur für aktuelle Mitglieder der jeweiligen Gruppe
  sichtbar. Teilnehmende Mitglieder sehen den gemeinsamen Gesamtfortschritt;
  einzelne Beiträge werden nicht angezeigt. Eine Aggregation in kleinen Gruppen
  kann trotzdem Rückschlüsse auf Aktivität zulassen, weshalb die Teilnahme
  ausdrücklich erklärt und bestätigt wird.
- Die iOS-App übernimmt dieselben Produktregeln mit nativen Oberflächen. Der
  konkrete Plattformumfang wird im Implementierungsplan getrennt festgelegt.
- Status, Fortschritt und abgeschlossene Ziele sind mit Tastatur,
  Screenreader und vergrößerter Schrift verständlich. Animationen sind dezent
  und berücksichtigen „Bewegung reduzieren“.

## Daten, Sicherheit und Datenschutz

- Als Quellen dienen vorhandene, nicht gelöschte Sessions, Teilnahmen und
  Spielreihenfortschritte. Es gibt keine Verknüpfung mit externen Profilen.
- Berechtigungen für persönliche Daten bleiben eigentümergeprüft. Gruppen-APIs
  prüfen die aktuelle Mitgliedschaft und geben nur den Challenge-Gesamtstand
  aus.
- Die Teilnahme-Einwilligung benennt klar, dass Sessions der Person während
  der Teilnahme in den Gruppen-Gesamtstand einfließen. Sessionnamen,
  Mitspielernamen, Ergebnisse und persönliche Beiträge werden dort nicht
  offengelegt.
- Beim Löschen oder Ändern von Sessions werden persönliche und gemeinsame
  Fortschritte konsistent neu berechnet. Eine Challenge darf gelöschte
  Quelldaten nicht dauerhaft als Fortschritt behalten.
- Es gibt keine käuflichen Vorteile, monetären Belohnungen, Werbung oder
  manipulative Erinnerungen.

## Einführung in Stufen

1. **Persönliche Basis:** Meilensteine und Sammlungsentdeckung aus bestehenden
   Session- und Reihen-Daten. Abzeichen bleiben privat.
2. **Gemeinsame Ziele:** Freiwillige Gruppen-Challenges mit ausdrücklicher
   Teilnahme, aggregiertem Fortschritt und Gruppenmitgliedschaftsprüfung.
3. **Keine Ranglistenphase:** Ranglisten sind ausdrücklich nicht Teil dieses
   Konzepts. Änderungen daran benötigen eine neue Produktentscheidung.

## Erfolgskriterien

- Nutzer können ohne zusätzliche Pflichtangaben nachvollziehen, warum ein
  persönlicher Erfolg erreicht oder ein Ziel aktualisiert wurde.
- Eine Session kann persönliche Erfolge und eine teilnehmende Gruppen-Challenge
  beeinflussen, ohne doppelt gezählt zu werden.
- Gruppenmitglieder können nicht auf private Sessiondetails oder individuelle
  Beiträge anderer zugreifen.
- Fortschritt stimmt nach Sessionkorrektur, Soft-Delete, Challenge-Austritt und
  Änderung der Gruppenmitgliedschaft mit den sichtbaren Quelldaten überein.
- Die Funktionen bleiben vollständig nutzbar, wenn Nutzer keine Challenge
  starten oder persönliche Ziele nicht aktiv verfolgen.

## Abgrenzung

Dieses Konzept legt weder endgültige Abzeichen-Schwellen noch konkrete
Oberflächen, Datenbanktabellen, API-Routen, Push-Nachrichten oder
Analytics-Ereignisse fest. Diese Details sind im Implementierungsplan anhand
des dann aktuellen Web- und iOS-Stands zu entscheiden. Es ist keine Freigabe zur
Umsetzung.
