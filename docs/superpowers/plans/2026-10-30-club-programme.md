# Club Programme – Umsetzungsplan

**Ziel:** Die bestätigte blaue Gestaltung auf Dashboard, Navigation, Sammlung und Eventübersicht anwenden.

**Vorgehen:** Umsetzung in dieser Sitzung. Die gespeicherte Auswahl bestätigt die Richtung; keine erneute Auswahlrunde.

1. Navigationstests für eindeutig aktive Unterseiten, mobile Menübedienung und administrative Links vor der Umsetzung ausführen. Navigation in `src/components/layout/navbar.tsx` umbauen und Dashboard-Layout anpassen.
2. Dashboarddarstellung in eine reine Komponente auslagern. Datenabfragen im Server behalten, Datumsanzeige und Eventvorschau als kleine wiederverwendbare Komponenten ergänzen. Tests für echte Spielauswahl, Linkziele und leere Zustände ausführen.
3. Webschrift über `next/font` und semantische Farbvariablen umstellen. Dashboard-Anordnung anhand der gewählten Skizze umsetzen. Sammlungskarten extrahieren und Sammlung/Eventübersicht anpassen; Geschäftsvorgänge beibehalten.
4. TypeScript, ESLint und Unit-Tests ausführen. Mit einer lokalen Testvorschau Desktop, Mobilansicht, Menü und Filter prüfen. Keine Anmeldung oder Datenbankänderung für die Vorschau.
5. Unabhängige Abschlussprüfung durchführen, notwendige Korrekturen bündeln und Designsystem dokumentieren. Changelog, Produkt-/Featurehinweise und Review-Dokumentation aktualisieren; scoped Commit mit Projekt-Hooks erstellen.
