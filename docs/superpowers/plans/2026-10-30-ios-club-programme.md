# iOS Club Programme Implementation Plan

**Goal:** Die bestätigte Variante „Nächster Spieleabend“ in den vier ausgewählten iOS-Bereichen umsetzen.

**Architecture:** SwiftData-Abfragen bleiben in den Views. Reine Termin- und Historienauswahl in `Utilities/Date+Formatting.swift`; adaptive Club-Farbrollen in `Utilities/Theme.swift`. Bestehende Sheets und Detailansichten werden wiederverwendet.

**Tech Stack:** Swift 6, SwiftUI, SwiftData, iOS 17+.

## Schritte

- [x] Verhaltenstests in `BoardGameToolsTests.swift` für Terminwahl (Vergangenheit, Löschung, ungültiges Datum, Zeitzonen, geschlossene Abstimmung) und letzte Partien ergänzen; den Swift-Vertragstest-Runner um `Date+Formatting.swift` erweitern. Mit `npm run test:ios:contracts` zunächst fehlende Implementierung nachweisen.
- [x] `ClubContent.nextEvent` und `ClubContent.recentSessions` implementieren; Vertragstests grün ausführen.
- [x] Adaptive Club-Farbrollen und flache Flächen in `Theme.swift` ergänzen. `DashboardView.swift` durch Terminfläche, direkte Aktionen und Historie ersetzen. `MainTabView.swift` auf fünf Tabs mit einem Mehr-Bereich umstellen.
- [x] `GameListView.swift` mit flachen Listen, vollständigen Covern, mehrzeiligen Titeln und passenden leeren Zuständen gestalten. `EventListView.swift` mit gemeinsamem Datumsblock, textlichem Status, klar beschrifteter Hinzufügen-Aktion und leeren Zuständen gestalten.
- [x] Simulator-Build mit `xcodebuild -project BoardGameTools/BoardGameTools.xcodeproj -scheme BoardGameTools -sdk iphonesimulator -derivedDataPath /tmp/bgt-ios-club-build CODE_SIGNING_ALLOWED=NO build` prüfen. Reale SwiftUI-Ansichten mit isolierten Beispieldaten im Simulator in hell, dunkel und großer Schrift aufnehmen; iPad prüfen, falls das Build-Ziel iPad unterstützt.
- [x] Unabhängigen Impeccable-Abschlussreview mit Simulatorbildern ausführen, materielle Befunde korrigieren und erneut prüfen. Designsystem samt Sidecar dokumentieren.
- [x] Changelog 0.50.22, Feature-Dokumentation, FAQ, Konzept und Review-Dokumentation aktualisieren; Commit und `npm run review-evaluate` gemäß Projektworkflow ausführen.
