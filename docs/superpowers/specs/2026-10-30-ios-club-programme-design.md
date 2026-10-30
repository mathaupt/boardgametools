# iOS: Nächster Spieleabend

Am 30.10.2026 bestätigt: Variante 2 aus dem visuellen Vergleich. Umfang: Startansicht, Navigation, Sammlung und Spieleabende. Modus: Operate, Umsetzung direkt in SwiftUI.

## Oberfläche

Die Übersicht zeigt zuerst den nächsten nicht gelöschten, noch kommenden Spieleabend. Geschlossene Abstimmungen bleiben echte kommende Termine; ihr Status wird korrekt als geschlossen angezeigt. Ungültige Termine werden nicht als nächster Abend ausgewählt. Danach folgen „Partie erfassen“, „Spiel hinzufügen“ und bis zu drei zuletzt gespielte Partien mit Spielnamen und Datum. Ohne Termin bietet die Übersicht das Planen eines Abends an. Leere Historie, Offline-Anzeige, laufende Synchronisation und Fehler bleiben verständlich sichtbar.

Fünf native Tabs: Übersicht, Spiele, Sessions, Spieleabende, Mehr. Mehr erschließt Reihen, Gruppen und Einstellungen. Vorhandene Funktionen und Detailansichten bleiben erreichbar. Sammlung behält Suche, Sortierung und Filter; Cover werden vollständig angezeigt und lange Namen dürfen umbrechen. Spieleabende erhalten lesbare Datumsblöcke und textliche Statusanzeigen.

## Gestaltung und Plattform

Club Programme: Kobalt für Aktionen, blau getönte Arbeitsfläche, flache helle Inhaltsflächen, Pfirsich ausschließlich für Datumsblöcke. Adaptive Farbrollen für dunkle Darstellung und erhöhten Kontrast. Systemschrift mit Dynamic Type, SF Symbols und native Navigation, Suche, Listen und Sheets. Bei großer Schrift wechseln horizontale Inhaltsgruppen in vertikale Anordnung. Standardübergänge respektieren reduzierte Bewegung.

## Daten und Qualität

SwiftData und vorhandene API-Aufrufe bleiben erhalten. Termin- und Historienauswahl erhalten echte Swift-Verhaltenstests. Keine Datenbankmigration oder API-Änderung. Prüfung durch iOS-Build, Vertragstests und Simulatoraufnahmen in hell/dunkel sowie großer Schrift. Vorschaudaten sind synthetisch, temporär und vom Nutzerkonto getrennt.

## Auswirkungen

Der Review-Evaluator prüft überwiegend Webcode und kann native Gestaltung nicht bewerten. Bestehende Authentifizierung, Account-Isolation und Sync bleiben unverändert. Die neuen Club-Farbrollen werden auf die bestätigten Bereiche begrenzt; andere Detail- und Bearbeitungsansichten behalten zunächst ihr bestehendes Layout.
