---
version: 1
slug: "src-app-dashboard-dashboard-page-tsx"
primary_target: "src/app/(dashboard)/dashboard/page.tsx"
related_targets: ["src/components/layout/navbar.tsx","src/app/(dashboard)/dashboard/games/page.tsx","src/app/(dashboard)/dashboard/events/page.tsx"]
---

# Dashboard und gemeinsame Weboberflächen

Mode: Operate. Umfang: gesamtes Webtheme mit Dashboard, Hauptnavigation, Sammlung, Spieleabenden und den gemeinsamen Arbeitsoberflächen. Der nächste Spieleabend ist die primäre Dashboard-Aufgabe. Produktfakten, Daten, Routen, Interaktionen und Berechtigungen bleiben erhalten.

## Direction contract

THESIS: Der nächste Spieleabend wird auf einen Blick lesbar. Seine Termin- und Auswahlzustände führen durch die Oberfläche; gleichförmige Kennzahlen- und Kartenwände treten zurück.

OWN-WORLD: Schwarzes Anzeigefeld (#0B0B0D), Stahlrahmen (#2A2D31, #5B5E63), helle Schrift (#F2F2F2), Bernstein (#FFB000) für den nächsten Termin und Rot (#B00020) ausschließlich für Fehler. Barlow bleibt die klare Leseschrift; lokal gehostetes Barlow Condensed (latin subset WOFF2, Schriftschnitte 500/600/700, OFL unter src/app/fonts) setzt Display-Überschriften, Termintitel, Datum und Status. Geist Mono bleibt für kompakte Werte und Datenüberschriften. Kanten bleiben präzise, Flächen matt und Bedienelemente gewöhnliche Webnavigation.

STORY: Nutzer sehen den nächsten Termin, erkennen den offenen Abstimmungszustand und gelangen direkt zu Einladungen, Spielen und Verlauf. Alle vorhandenen Aufgaben bleiben über die bestehende Navigation erreichbar.

FIRST VIEWPORT: Auf großen Ansichten links die feste, dunkle Seitenleiste mit fünf Hauptzielen plus „Mehr“. Im Arbeitsbereich steht „Der nächste Spieleabend wartet.“ über einer breiten Terminansicht; der Bernstein-Datumsblock führt die Blickachse. Status und Zeit stehen in geraden Spalten, Abstimmungsvorschläge darunter. Einladungen und Schnellzugriffe bilden eine schmalere rechte Spalte, Verlauf folgt unter dem Termin. Auf kleinen Ansichten wird die Navigation zum zugänglichen Menü und die Reihenfolge bleibt Termin, Einladungen/Aktionen, Verlauf.

FORM: Spielabend-Anzeigetafel / Split-Flap-Kiosk, gewählte Struktur auf der Entscheidungsseite; ausgewählte Konzept-Seed-Referenz seed:c5f23fe40c3f189d, durch `concept-seed --check-seed` als auf dieser Maschine erzeugt bestätigt. Die einzige prägnante Bewegung ist ein kurzer, zustandsgebundener Umschlag beim Wechsel eines Datums oder Status; Inhalt bleibt bei reduzierter Bewegung sofort sichtbar. Eine horizontale Mittellinie im Terminblock, eine 3px starke Eventkarten-Oberkante mit Amberstart und fortlaufender Stahlspur sowie ein festes Spaltenraster tragen die Signatur, nicht künstliche Live-Aktualisierung.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Review disposition

Disposition: **ship**. Nach dem Impeccable-Finish-Review ergänzt `.club-event-feature::before` eine 3px starke Oberkante mit Amberstart über der Datumskachel und anschließender Stahlspur; Desktop- und Mobilrecaptures bestätigen die sichtbare Umsetzung. `concept-seed --check-seed seed:c5f23fe40c3f189d` bestätigt die gewählte Referenz. Die dokumentierte Datumskachel besitzt weiterhin ihre horizontale Split-Flap-Naht.
