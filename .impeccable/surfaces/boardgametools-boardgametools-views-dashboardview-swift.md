---
version: 1
slug: "boardgametools-boardgametools-views-dashboardview-swift"
primary_target: "BoardGameTools/BoardGameTools/Views/DashboardView.swift"
related_targets: ["BoardGameTools/BoardGameTools/Views/MainTabView.swift", "BoardGameTools/BoardGameTools/Views/GameListView.swift", "BoardGameTools/BoardGameTools/Views/EventListView.swift", "BoardGameTools/BoardGameTools/Utilities/Theme.swift"]
---

# iOS – Nächster Spieleabend

Mode: Operate. Bestätigt am 30.10.2026: zunächst Übersicht, Navigation, Sammlung und Spieleabende; danach ausdrücklich Variante 2 „Nächster Spieleabend“.

THESIS: Der nächste gemeinsame Spieleabend führt, danach direkte Aktionen und letzte Partien.

OWN-WORLD: Club Programme als native iOS-Adaption mit Systemschrift, SF Symbols, Kobalt #2445b4, blauem Hintergrund #eaf0ff, flachen Inhaltsflächen und pfirsichfarbenem Datumsblock #f4af85. Adaptive dunkle Varianten aus ClubTheme, Systemnavigation und Standard-Sheets.

FIRST VIEWPORT: Große native Überschrift Übersicht. Abschnitt Dein nächster Spieleabend mit Datumsblock, Titel, Wochentag/Uhrzeit, optionalem Ort, tatsächlichem Abstimmungsstatus und Spieleabend ansehen. Darunter Partie erfassen und Spiel hinzufügen, anschließend Zuletzt gespielt. Fünf native Tabs, Mehr bündelt Gruppen, Reihen und Einstellungen. Bei großer Schrift vertikale statt horizontale Gruppen.

SIGNATURE: Ein gemeinsamer Datumsblock gliedert die Startansicht und die Spieleabendliste. Navigation und Modalübergänge bleiben systemgeführt und respektieren reduzierte Bewegung.

FORM: seed:0f8f6c26a8dc57f5, gewählte Struktur 2. Referenzskizze `.impeccable/mocks/decision/ios-next.html`; code-led, keine bindende Rasterkomposition. Die Skizze enthält ausdrücklich Beispieldaten, die App ausschließlich tatsächliche lokale Daten.

FINISH: iOS-Build, Verhaltenstests, Simulatorbilder für iPhone/iPad einschließlich dunkler Darstellung und großer Schrift sowie unabhängiger Abschlussreview. Kein HTML/CSS-Detektor, da native SwiftUI-Oberflächen.
