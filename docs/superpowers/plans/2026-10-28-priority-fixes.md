# Priorisierte Fehlerbehebung – Umsetzungsplan

**Ziel:** Die vom Nutzer freigegebenen hohen Befunde der Prüfung vom 28.10.2026 beheben.
**Architektur:** Bestehende API-Verträge erhalten; iOS-Antwortmodelle anpassen. Lokalen Cache beim Identitätswechsel vollständig löschen und laufende Antworten entwerten. Build und explizite Migration trennen, Migrationsfehler unverändert weitergeben.
**Umsetzung:** Direkt in dieser Sitzung, isolierter Arbeitszweig; keine Produktionszugriffe oder Veröffentlichung.

## 1. Ausgangsstand
- [x] Repository, Regeln und Prüfbericht abgleichen; Branch `codex/priority-fixes` erstellen.
- [x] Vorherigen Review- und Teststand sichern.

## 2. Migration
Dateien: `scripts/prisma-deploy.js`, `package.json`, `tests/unit/scripts/prisma-deploy.test.ts`, `docs/DEPLOYMENT.md`.
- [x] Test mit simuliertem Migrationsprozess: Exit 0/1/Signal und kein zweiter Befehl.
- [x] Roten Test beobachten, Fallback durch einmaliges `prisma migrate deploy` ersetzen.
- [x] Build ohne Migration, separaten expliziten Release-Befehl dokumentieren.

## 3. iOS-Verträge
Dateien: `Networking/DTOs.swift`, `Networking/APIClient.swift`, `BoardGameToolsTests/BoardGameToolsTests.swift`, `scripts/test-ios-contracts.sh`.
- [x] Original-DTOs mit realistischen Refresh-, Reihen- und Upload-JSONs testen; Fehler bestätigen.
- [x] Eigenes RefreshTokenResponse ohne User, SeriesGameSummary mit imageUrl, UploadResponse passend zum Server.
- [x] Auth-Anfragen ohne Token-Refresh; Wiederholung maximal einmal, parallele Refresh-Fehler weitergeben.

## 4. Kontotrennung
Dateien: `Data/PersistenceController.swift`, `Services/AuthManager.swift`, `Services/SyncEngine.swift`, `Views/SettingsView.swift`, iOS-Tests.
- [x] In-Memory-SwiftData-Tests für vollständiges Leeren und Erhalt bei gleichem Konto/Backend.
- [x] Cache vor Login/Konto- und Backendwechsel leeren; unbekannte Altzuordnung bei erstem Start einmalig entfernen.
- [x] Alte Sync-/Netzwerkantworten nach Identitätswechsel verwerfen; Logout am alten Backend durchführen.

## 5. Abhängigkeiten
Dateien: `package.json`, `package-lock.json`, BOM-/Security-Dokumentation.
- [x] Aktuelles Audit lesen, Next.js und Begleitpakete gemeinsam aktualisieren, Nodemailer auf gepatchten Stand bringen.
- [x] Produktive transitive Schwachstellen über kompatible Elternupdates oder begründete Overrides beheben.
- [x] Produktionsaudit erneut prüfen; verbleibende Entwicklungsbefunde benennen, keine pauschalen Major-Updates.

## 6. Freigabe
- [x] Typecheck, Lint, Unit-Tests, Swift-Vertragstests, isolierter Produktionsbuild und Review-Regression prüfen.
- [x] Bugregister, Changelog und betroffene Dokumentation aktualisieren; Commit erstellen.
- [x] Geprüften Stand im ursprünglichen Repository auf separatem Branch bereitstellen. Kein Push/Deployment.


## Ergebnis

Version 0.50.16. Alle beschriebenen Änderungen umgesetzt und lokal geprüft. Die letzte Aufgabe stellt den geprüften Stand als lokalen Branch bereit; ein Push oder Deployment ist nicht Bestandteil des Auftrags. Backups und Produktionszustand werden erst vor einer gesonderten Veröffentlichung geprüft.
