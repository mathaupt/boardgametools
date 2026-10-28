# Sicherheitsstand – 28.10.2026, Version 0.50.16

## Paketprüfung

- Ausgang: 40 Paketbefunde insgesamt, davon 10 im Produktionsbaum (1 kritisch, 8 hoch, 1 mittel).
- Nach Korrektur: `npm audit --omit=dev` meldet 0 Befunde. Gesamtaudit: 3 niedrige Befunde in `deepmerge`, `@shadcn/registry` und `shadcn`, ausschließlich Entwicklungsabhängigkeiten.
- Next.js 16.4.3 und Begleitpakete, Nodemailer 10.2.1, Blob 2.8.2. Kompatible transitive Updates; Prisma CLI/Client/Adapter gemeinsam 7.10.1, Vitest/Coverage gemeinsam 4.1.12.
- Gezielte Overrides innerhalb derselben Hauptversion: Undici 6.29.1, Zod 4.6.7, js-yaml 4.3.2. Keine pauschalen Major-Erzwingungen.
- Verbleibender niedriger Deepmerge-Befund: https://github.com/advisories/GHSA-gcqx-w48m-w2h4. Keine neuere gepatchte Deepmerge-Version verfügbar; npm schlägt ein nicht sachgerechtes Downgrade von shadcn auf 1.0.0 vor. Restrisiko für Entwicklungs-CLI dokumentiert, erneute Prüfung bei Updates.

## Schutz der lokalen Kontodaten

LocalAccountStore ordnet den SwiftData-Cache Backend/Nutzer zu. Bei unbekannter Altzuordnung, Kontowechsel, Backendwechsel oder Logout werden alle Kontomodelle und Sync-Metadaten entfernt. Session-Generationen verhindern die Übernahme verspäteter API-/Sync-Antworten. Token-Erneuerungen werden beim Wechsel abgebrochen. Die Serveradresse wird erst nach Abmeldung am alten Backend geändert.

## Migrationen

Build ohne Datenbankänderungen. Explizite Migrationen brechen bei Fehlern ab; kein automatisches migrate resolve, kein db push. Nicht gegen Produktion ausgeführt. Backup-Wiederherstellung und tatsächliche Produktionskonfiguration sind vor einem späteren Release separat zu prüfen.

## Abgrenzung

Dies behebt die freigegebenen hohen Befunde und den unmittelbar zugehörigen Upload-Vertragsfehler. Vollständiger Offline-Schreibsync, Event-/Gruppen-Detailabgleich, Tokenfamilien/atomare Rotation und Apple-Releasefunktionen bleiben gesonderte Maßnahmen des Prüfberichts.
