# BUG-053 – Serverseitigen Gastbesitznachweis ergänzen

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gastzugänge lassen sich nur mit einem geheimen, serverprüfbaren Nachweis wiederaufnehmen und für Eventaktionen verwenden.

**Architecture:** Nickname und öffentliche Teilnehmer-ID bleiben Anzeige-/Referenzdaten. Ein zufälliges Wiederaufnahmetoken wird nur einmal bei Registrierung ausgegeben; serverseitig liegt ausschließlich ein abgeleiteter Hash mit Rotation und Ablaufregeln. Bestehende Gäste ohne Nachweis erhalten keinen stillen Besitzübergang; ihre Stimmen bleiben erhalten und werden über einen gesonderten, kontrollierten Wiederherstellungsweg behandelt.

**Tech Stack:** Next.js Route Handlers, Prisma/PostgreSQL, `crypto`, Zod, Vitest, isolierte PostgreSQL-Integrationstests.

---

## Voraussetzungen und Sicherheitsgrenzen

- Geltungsbereich ist `BUG-053` in `docs/bugs.md`; FEAT-013 bleibt „klare Identität ohne Gastwechsel“.
- Bestehende Stimmen werden weder gelöscht noch automatisch einer neuen Identität zugeordnet.
- Keine Gast-ID, kein Nickname und kein lokaler Browserwert gelten als Besitznachweis.
- Keine produktive Migration, Übernahme bestehender Identitäten oder geheime Tokenausgabe ohne gesonderte Freigabe und geprüften Migrationsplan.
- Vor Implementierung aktuellen Status von `prisma/schema.prisma`, Join-/Vote-Routen sowie FEAT-010 bis FEAT-013 erneut prüfen.

## Betroffene Dateien

| Datei | Verantwortung |
|---|---|
| `prisma/schema.prisma` | Hash, Rotations-/Ablaufzeit und Version für Gastberechtigungsnachweis modellieren |
| `src/lib/public-event.ts` | Besitznachweis erzeugen, hashen, konstantzeitlich prüfen und rotieren |
| `src/lib/rate-limit.ts` | Wiederaufnahmeversuche und fehlgeschlagene Besitzprüfungen begrenzen |
| `src/lib/validation.ts` | Formate und Größen geheimer Nachweise validieren |
| `src/app/api/public/event/[token]/join/route.ts` | neue Registrierung von sicherer Wiederaufnahme trennen; kein Nickname-Upsert als Authentifizierung |
| `src/app/api/public/event/[token]/vote/route.ts` | Gastbesitz vor jeder Mutation prüfen und Eventbindung beibehalten |
| `src/app/api/public/event/[token]/date-vote/route.ts` | denselben Besitzvertrag für Terminantworten verwenden |
| `src/app/api/public/event/[token]/propose/route.ts`, `src/app/api/public/event/[token]/propose-bgg/route.ts` | Vorschläge nur der nachgewiesenen aktiven Gastidentität zuordnen |
| `src/app/api/mobile/v1/public/event/` | öffentliche Mobile-Re-Exports und DTOs ohne geheime Tokenfelder halten |
| `BoardGameTools/BoardGameTools/Security/KeychainManager.swift` | ausgegebenen Nachweis gerätegebunden speichern und bei Widerruf löschen |
| `BoardGameTools/BoardGameTools/Views/PublicEventView.swift` | Secret einmalig entgegennehmen; niemals in SwiftData oder Preferences persistieren |
| `tests/unit/app/api/public/event/` | Ablehnung, Rotation und Eventbindung testen |
| `tests/integration/public-guest-ownership.test.ts` | isolierte DB-Tests gegen Wiederaufnahme- und Parallelitätsfälle |
| `docs/openapi.yaml`, `docs/FEATURES.md`, `docs/bugs.md`, `src/lib/faq.ts`, `src/lib/changelog.ts` | API-, Bedien-, Fehler- und Releasevertrag dokumentieren |

## Umsetzungsschritte

### Task 1: Besitznachweis und Datenmodell festlegen

- [ ] Regressionstests für „gleicher Nickname ohne Secret erhält keine bestehende ID“, falsches Secret, abgelaufenes/rotiertes Secret und gültiges Secret schreiben.
- [ ] Schemaergänzung für `credentialHash`, `credentialVersion`, `credentialIssuedAt` und optional `credentialExpiresAt` anhand tatsächlicher Prisma-Beziehungen entwerfen; Klartextsecret nie speichern oder selektieren.
- [ ] Für ein zufälliges Secret mit mindestens 256 Bit Entropie SHA-256 als gespeicherten Hash verwenden. Einen zusätzlichen HMAC-Schlüssel nur einführen, wenn Rotation und serverseitige Secret-Verwaltung dokumentiert sind. Hashvergleich konstantzeitig ausführen; Klartext nie persistieren.
- [ ] Migration und Mocks prüfen; `npm run test:ios:contracts` unverändert halten, da dies kein iOS-API-Vertrag ist.

### Task 2: Registrierung und Wiederaufnahme trennen

- [ ] Join-Request um zwei ausdrücklich getrennte Vorgänge modellieren: neue Registrierung mit Nickname und Wiederaufnahme mit Teilnehmerreferenz plus Secret.
- [ ] Nickname als eindeutige Berechtigung entfernen; Kollisionen mit bestehender Identität verständlich und ohne Existenz-/PII-Leak ablehnen.
- [ ] Erfolgreiche neue Registrierung gibt das Secret genau einmal über TLS zurück; Logs, Analytics, Changelog, Fehlertexte und ApiLog dürfen es nicht enthalten.
- [ ] `withApiLogging()`-Redaktion für Secret-Felder nachweisen und Wiederaufnahmeversuche per IP sowie event-/teilnehmergebunden begrenzen; Rate-Limit-Antworten verraten nicht, ob Gast oder Secret existiert.
- [ ] Bestehende Gäste ohne Secret bleiben unverändert; keinen stillen Claim anhand Nickname, Browserfingerprint oder bisheriger Gast-ID implementieren.
- [ ] iOS bewahrt das Secret über `KeychainManager` mit `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` auf; löschen bei explizitem Logout/Widerruf. Kein Secret in DTO-Dumps, Analytics, SwiftData oder `UserDefaults`.

### Task 3: Alle Gastmutationen absichern

- [ ] Gemeinsame serverseitige Prüfung für Vote, Vote-Entfernung, Terminvote, Vorschlag und BGG-Vorschlag verwenden.
- [ ] Eventtoken, Gastdatensatz und Zielobjekt vollständig an dasselbe Event binden; vorhandene FEAT-010 Objektzugehörigkeitsprüfungen nicht abschwächen.
- [ ] Fehlende, falsche und abgelaufene Secrets erhalten dieselbe generische 401/404-Antwort; kein Tokenbestandteil in Logs.
- [ ] Rotation atomar implementieren: altes Secret wird ungültig, alle konkurrierenden Requests haben deterministisches Ergebnis.

### Task 4: Sichere Wiederherstellung bestehender Gäste planen und umsetzen

- [ ] Vor Code für Übernahme einen separaten, reviewbaren Migrationsplan mit Zählbericht, Konfliktbehandlung, unverändertem Stimmenbestand, Backup/Restore und Rollback erstellen.
- [ ] Ohne explizit freigegebenen Plan keine Bestandsidentität produktiv zuweisen oder Tokens ausstellen.
- [ ] Für lokale Integration ausschließlich Wegwerfdatenbank verwenden; Fälle Nickname-Kollision, gleiche ID im anderen Event, ungültige Stimme, parallele Rotation und Rollback testen.

### Task 5: Abnahme und Dokumentation

- [ ] Gezielte Tests zunächst rot, danach grün; Unit- und isolierte PostgreSQL-Integrationstests, Typecheck, Lint und Security-Check ausführen.
- [ ] Dokumentieren, welche Gäste ohne Besitznachweis keine Wiederaufnahme mehr haben und welcher Support-/Wiederherstellungsweg vorgesehen ist.
- [ ] OpenAPI, FAQ, Features, BUG-053, Changelog und Reviewdokumentation aktualisieren.
- [ ] Produktionsmigration und Aktivierung erst nach separater Umsetzungsfreigabe, Backupnachweis und geprüfter Restore-/Rollback-Prozedur.

## Abnahmekriterien

- Nickname und öffentliche ID reichen bei keinem Endpoint als Authentifizierung.
- Geheimnis wird nur bei Ausgabe im Klartext übertragen; DB und Logs enthalten ausschließlich sichere Ableitungen beziehungsweise keine Tokenwerte.
- Jede Gastmutation prüft Besitz und Event-/Objektzugehörigkeit serverseitig.
- Bestehende Stimmen bleiben bei fehlendem Besitznachweis unverändert und werden keiner anderen Identität zugerechnet.
- Wiederaufnahme, Rotation, Ablauf, Parallelität und generische Fehlerantworten sind durch Tests abgedeckt.
- BUG-053 wird erst nach sicherer Migrationsentscheidung und abgeschlossener API-Abnahme geschlossen.
