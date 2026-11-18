# Dashboard-UX für Einladungen, Navigation und Spieleabende

**Status:** Entwurf freigegeben am 18.11.2026; Navigation B bestätigt.
**Umfang:** Web-Dashboard und gemeinsame Webnavigation. Keine iOS-, API- oder Datenmodelländerung.

## Ziel

Das Dashboard soll den nächsten sinnvollen Schritt einer Spielrunde sichtbar machen. Offene Einladungen müssen zuverlässig beantwortbar sein, häufige Arbeitsbereiche leicht erreichbar bleiben und die Veranstaltungsoberfläche durchgängig verständliche deutsche Begriffe verwenden.

## Bestätigte Richtung

Der bestehende „Club Programme“-Entwurf bleibt erhalten: Kobaltnavigation, blaue Arbeitsfläche, Barlow, flache Bereiche und hervorgehobene Datumsblöcke. Für die Navigation wurde Variante B gewählt: Dashboard, Spiele, Sessions, Spieleabende und Gruppen bleiben direkt sichtbar. Reihen, Statistiken und Abzeichen werden in einem zugänglichen „Mehr“-Bereich gebündelt. URLs und Berechtigungen bleiben unverändert.

Die Einladungsliste rückt bei ausstehenden Antworten vor die Schnellzugriffe. Der primäre Kopfbereich bietet dann „Einladungen beantworten“ als Sprung zur Liste; ohne offene Einladungen bleibt „Spieleabend planen“ die primäre Aktion. Zusagen und Absagen bleiben direkt an der jeweiligen Einladung.

## Einladungszustände

- Während die Antwort gespeichert wird, sind beide Aktionen des betroffenen Eintrags deaktiviert und der Eintrag kündigt den Vorgang verständlich an.
- Nur eine erfolgreiche Serverantwort entfernt den Eintrag und bestätigt die Antwort über das bestehende globale Toastsystem.
- Netzwerkfehler und nicht erfolgreiche HTTP-Antworten lassen den Eintrag bestehen, zeigen eine deutsche Fehlermeldung direkt am Eintrag und bieten erneutes Absenden.
- Statusänderungen sind für Screenreader über geeignete Status-/Fehlerrollen verfügbar.
- Die Schaltflächen erhalten mindestens 44 px Zielfläche.

## Deutsche Bezeichnungen

Im betrachteten Navigations- und Dashboardbereich werden sichtbare Event-Bezeichnungen vereinheitlicht: „Spieleabende“, „Spieleabend planen“, „Alle Spieleabende“ und „Spieleabende & Abstimmungen“. Serverpfade, DTOs und API-Bezeichnungen bleiben intern unverändert.

## Abnahme

1. Bei Netzwerkfehler und HTTP-Fehler bleibt eine Einladung sichtbar; die Fehlermeldung und Wiederholungsaktion sind sichtbar und zugänglich.
2. Ein erfolgreicher Versuch entfernt nur den bestätigten Eintrag und erzeugt eine Erfolgsmeldung.
3. Während des Versuchs lassen sich Zusage/Absage für denselben Eintrag nicht doppelt auslösen.
4. Bei mindestens einer offenen Einladung führt die Kopfaktion zur Einladungsliste; ohne offene Einladungen führt die Hauptaktion zum Anlegen eines Spieleabends.
5. Die fünf häufigsten Ziele sind direkt erreichbar; „Mehr“ zeigt alle drei gebündelten Ziele und schließt gemäß Tastatur-/Fokusvertrag.
6. Dashboard und Spieleabendübersicht verwenden die bestätigten deutschen Bezeichnungen. Routen und Zugriffsschutz ändern sich nicht.
7. Die gerenderte UI wird bei 320, 390, 768 und 1440 CSS-Pixeln in Hell- und Dunkeldarstellung geprüft.

## Alternativen

- **A – Navigation unverändert lassen:** geringster Eingriff, löst aber die acht sichtbaren Hauptziele nicht.
- **B – Fünf Hauptziele plus „Mehr“ (gewählt):** hält die häufigsten Abläufe direkt und bündelt drei seltener benötigte Ziele.
- **C – Alle Ziele mit Aufgabenüberschriften gruppieren:** macht Kategorien sichtbarer, lässt aber die Anzahl direkter Ziele gleich.

## Grenzen und Prüfhinweis

Die öffentliche Visual-Companion-Vorschau konnte in dieser Umgebung nicht im Browser geöffnet werden; auch der lokale Preview-Host war aus dem Tool nicht erreichbar. Die Varianten wurden als HTML-Vorschau bereitgestellt, die Auswahl B wurde anschließend direkt bestätigt. Vor einer Freigabe des UI-Codes bleibt daher die gerenderte Prüfung in der realen Web-App verpflichtend.

Die bereits dokumentierten FEAT-034-Datenabfragepunkte (Sessions-Pagination, Gaststimmen und Queryfelder) sind nicht Teil dieses Entwurfs.
