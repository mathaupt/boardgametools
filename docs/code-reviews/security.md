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

## Aktualisierung 31.10.2026 – Commit der FEAT-009/010/011-Pläne blockiert

Die Paketdateien wurden in dieser Planungsaufgabe nicht verändert. Ein vollständiger
Registry-Audit meldet aktuell 26 Entwicklungsbefunde: 1 hoch, 23 mittel, 2 niedrig.
Der Produktionsaudit im Commit-Hook meldet weiterhin 0. SEC-45 wird dadurch als
partially_resolved bewertet; der Regressionshook hat den Commit korrekt blockiert.

- systeminformation 5.33.1 gelangt über shadcn → @dotenvx/dotenvx in den Entwicklungsbaum. Der hohe Befund [GHSA-3f7j-7jwc-fxfj](https://github.com/advisories/GHSA-3f7j-7jwc-fxfj) ist ab 5.33.16 behoben.
- Mittlere Stamm-Befunde betreffen [minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249), [glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) und [@hono/node-server](https://github.com/advisories/GHSA-rmxm-3fg6-px4f). Abhängige Toolpakete werden im npm-Bericht zusätzlich gezählt.
- Niedrige Befunde betreffen die vorhandene deepmerge-Kette.
- Der Evaluator SEC-45 validiert erfolgreiche Audit-Metadaten nicht: Fehler-JSON ohne metadata kann fälschlich als 0 Befunde gelten. Ein Sandboxlauf lieferte einen Registry-DNS-Fehler; ein vollständiger Lauf außerhalb der Sandbox lieferte den obigen Befundsatz.

BUG-050 erfasst die Paketrisiken, BUG-051 den Evaluatorfehler. Beides ist offen.
Keine ungeprüften Major-Overrides, kein pauschales npm audit fix und kein Umgehen
des Hooks durchgeführt. Die zugrunde liegenden Auditdaten liegen lokal unter
/tmp/bgt-feat-plans-audit.json; sie sind kein versioniertes Artefakt.

## Quellprüfung öffentliche Teilnahme – Planung 0.50.30

- BUG-052: Die öffentliche BGG-Suche verwendet eine geschützte allgemeine API. FEAT-014 plant eine tokengebundene Katalogroute statt einer pauschalen Auth-Ausnahme.
- BUG-053: Ein Gastname beziehungsweise eine öffentlich übermittelte Gast-ID ist kein Besitznachweis. Die bestehende join-/vote-Logik prüft keinen eigenen Gastnachweis. Kein produktiver Übernahmeversuch durchgeführt.
- BUG-054: Bei BGG-Vorschlägen können derzeit Session und guestId gleichzeitig als Autoren gespeichert werden. FEAT-013 plant ausschließliche Zuordnung bei neuen Writes.

Bestätigter FEAT-013-Umfang: klare Identitätsanzeige ohne Gastwechsel. Die
geplante UI-Verbesserung behebt BUG-053 nicht und gewährt keine zusätzlichen
Gastberechtigungen. Eine spätere Wiederaufnahme-/Wechselfunktion erfordert
einen eigenen serverseitig abgesicherten Besitzvertrag.

## Quellprüfung Health – Planung 0.50.31

BUG-055 erfasst öffentliche interne Health-Diagnose einschließlich roher
DB-Fehlertexte. BUG-056 erfasst anfrageproportionale DB-Lese-/Loglast und
zusätzliche Sessionabfragen über den Proxy bei vorhandenen Cookies.
Die vorgeschlagenen FEAT-005/006-Pläne adressieren diese Pfade, sind aber
noch nicht umgesetzt. Keine produktiven Fehler-, Last- oder Ausfalltests.

FEAT-007/008 bleiben bis zur tatsächlichen Projekt-/Tarif-/Budgetprüfung
reine Betriebspläne. Ein Readinesssecret, Firewall-Ausnahmen oder eine
teamweite Produktionspause wurden nicht eingerichtet.
