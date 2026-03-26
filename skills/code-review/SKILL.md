---
name: code-review
description: Senior Dev Code Reviewer – Prüft Code-Qualität, Architektur, Sicherheit und Konzept-Konformität. Erstellt priorisierte Verbesserungsvorschläge.
metadata:
  author: BoardGameTools Team
  version: 1.0
---

# Senior Dev Code Review

## Wann diesen Skill verwenden

- Bei Code-Reviews vor einem Release
- Wenn neue Features implementiert wurden und geprüft werden sollen
- Zur regelmäßigen Code-Qualitätssicherung
- Wenn das CONCEPT.md gegen die Implementierung abgeglichen werden soll
- Bei Security-Audits und Performance-Optimierung

## Review-Checkliste

### 1. Architektur & Patterns

**Prüfpunkte:**
- [ ] Konsistente Nutzung von Server Components vs. Client Components
- [ ] `"use client"` nur wo nötig (Interaktivität, Hooks)
- [ ] Keine Geschäftslogik in Komponenten – gehört in API Routes oder lib/
- [ ] DRY-Prinzip: Keine Code-Duplikation über Dateien hinweg
- [ ] Komponenten-Größe: Max ~300 Zeilen, sonst aufteilen
- [ ] Proper separation of concerns (UI / Logic / Data)

**Bekannte Hotspots:**
- `src/components/public-event/public-event-client.tsx` – über 1100 Zeilen, sollte in Subkomponenten aufgeteilt werden (GuestRegistration, ProposalList, VotingSection, DatePolling, BggSearch)
- `src/app/(dashboard)/dashboard/events/[id]/voting-client.tsx` – prüfen ob Logik-Duplikation mit public-event-client existiert
- API Routes mit ähnlicher Auth-Prüfung: Shared Middleware extrahieren

### 2. TypeScript & Typsicherheit

**Prüfpunkte:**
- [ ] Keine `any` Types außer in begründeten Ausnahmen
- [ ] Prisma-generierte Types nutzen statt manuelle Interfaces
- [ ] API Response Types definiert und konsistent
- [ ] Props-Interfaces für alle Komponenten
- [ ] Strict null checks beachtet

**Bekannte Hotspots:**
- `src/app/api/bgg/route.ts` – XML-Parsing mit `any` Types (Zeile 29: `const result: any = {}`, Zeile 84: `const games: any[]`)
- BGG-Suche gibt untypisierte Objekte zurück
- Einige API Routes geben `any` im catch-Block zurück

### 3. Sicherheit

**Prüfpunkte:**
- [ ] Alle geschützten API Routes prüfen `auth()` Session
- [ ] Input-Validierung auf allen POST/PUT Endpoints (Länge, Typ, Format)
- [ ] Keine PII (personenbezogene Daten) in console.log
- [ ] Keine Secrets in Code oder Commits
- [ ] Rate Limiting auf Auth-Endpoints
- [ ] CSRF-Schutz via NextAuth
- [ ] SQL Injection: `$queryRaw` nur mit tagged templates
- [ ] Debug-Routes in Produktion deaktiviert
- [ ] Security Headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [ ] Dependency Vulnerabilities: `npm audit` ohne kritische/hohe Findings
- [ ] CORS-Konfiguration: Nur erlaubte Origins
- [ ] Cookie-Sicherheit: HttpOnly, Secure, SameSite Flags
- [ ] XSS-Prävention: Kein `dangerouslySetInnerHTML` ohne Sanitization

**OWASP Top 10 Checkliste:**
- [ ] A01 Broken Access Control – Auth auf allen geschützten Routes
- [ ] A02 Cryptographic Failures – Passwörter gehasht, Secrets in ENV
- [ ] A03 Injection – Prisma parameterized queries, kein raw SQL ohne tagged templates
- [ ] A04 Insecure Design – Rate Limiting, Input-Validierung
- [ ] A05 Security Misconfiguration – Security Headers, Debug-Routes gesperrt
- [ ] A06 Vulnerable Components – npm audit, Dependency-Updates
- [ ] A07 Auth Failures – Session-Management, Brute-Force-Schutz
- [ ] A08 Data Integrity Failures – CSRF-Schutz, Signierte Tokens
- [ ] A09 Logging Failures – Strukturiertes Logging ohne PII
- [ ] A10 SSRF – Keine unkontrollierten externen Requests

**Bekannte Hotspots:**
- `createdBy: true` ohne `select` in 5 Dateien – leakt passwordHash: events/route.ts, events/[id]/route.ts, events/[id]/calendar/route.ts, sessions/[id]/votes/route.ts, dashboard/events/[id]/page.tsx
- Zusätzlich 19× `user: true` ohne select in src/ – gleiches Leak-Risiko
- Auth-Routes ohne Rate Limiting: `[...nextauth]/route.ts` (login)
- `src/app/api/public/group/[token]/route.ts` – Passwort als Query-Parameter
- `src/lib/rate-limit.ts` – Memory Leak durch unbegrenztes Map-Wachstum

### 4. Performance

**Prüfpunkte:**
- [ ] Keine N+1 Queries (Prisma `include` nutzen)
- [ ] Pagination auf Listen-Endpoints
- [ ] `useMemo`/`useCallback` für teure Berechnungen
- [ ] Bilder optimiert (next/image statt <img>)
- [ ] Bundle Size: Große Libraries nur bei Bedarf laden
- [ ] DB-Indices auf häufig gefilterte Felder
- [ ] Dynamic Imports: Schwere Libraries (tesseract.js, recharts) per `next/dynamic` laden
- [ ] Bundle-Analyse: `@next/bundle-analyzer` konfiguriert, keine Chunks >500KB
- [ ] API Response-Zeiten: Keine Endpoints >500ms unter Last
- [ ] Statische Seiten: ISR/SSG wo möglich (revalidate)
- [ ] Image Optimization: Alle externen Bilder über next/image mit domains-Config
- [ ] Font-Loading: next/font statt externe Font-Requests

**Bekannte Hotspots:**
- `tesseract.js` (7MB+) in dependencies – wird nur für EAN-Scan gebraucht, sollte lazy-loaded werden
- `recharts` (300KB+) – nur auf Statistics-Seite nötig, dynamic import nutzen
- BGG-Thumbnails: Batch-Request für 20 Ergebnisse verlangsamt die Suche
- Keine Pagination auf /api/games, /api/sessions, /api/events
- External images via `<img>` statt `next/image` (keine Optimierung)

### 5. API Design

**Prüfpunkte:**
- [ ] Konsistente Error-Response-Struktur: `{ error: string, details?: string }`
- [ ] HTTP Status Codes korrekt (400 vs 404 vs 422 vs 500)
- [ ] Request-Body-Validierung mit konkreten Fehlermeldungen
- [ ] Konsistente Naming-Konvention für Endpoints
- [ ] PATCH für partielle Updates statt PUT

**Bekannte Hotspots:**
- Inkonsistente Error-Formate zwischen verschiedenen Routes
- Manche Routes geben `{ message: ... }` statt `{ error: ... }` zurück
- Fehlende Validierung auf maximale String-Längen (Name, Beschreibung)
- Public API Routes (`/api/public/`) fehlt Rate Limiting

### 6. UI/UX & Accessibility

**Prüfpunkte:**
- [ ] WCAG AA Kontrast (4.5:1 für Text, 3:1 für große Elemente)
- [ ] Alle interaktiven Elemente: `aria-label` oder sichtbares Label
- [ ] Fokus-Management: Sichtbare Fokuszustände
- [ ] Touch-Targets mindestens 44x44px
- [ ] Loading States für alle async Operationen
- [ ] Error States mit hilfreichen Meldungen
- [ ] Responsive Design: Mobile-first testen
- [ ] Keyboard-Navigation durchgängig möglich

**Bekannte Hotspots:**
- Voting-Buttons auf Public Event Page haben keine aria-labels für Screenreader
- Einige Icon-only Buttons ohne title/aria-label (nach Mobile-Refactoring)
- Toast-Meldungen nicht per Screenreader erreichbar (Standard-Radix Verhalten)
- Tabellen-Layout bei DatePolling auf kleinen Screens problematisch

### 7. Testing

**Prüfpunkte:**
- [ ] Unit Tests für alle Business-Logik in lib/
- [ ] API Route Tests für kritische Endpoints
- [ ] E2E Tests für Kernflows (Login, Game CRUD, Event-Voting)
- [ ] Edge Cases: Leere Listen, ungültige IDs, Concurrent Requests
- [ ] Mock-Strategie konsistent (fetch mocking für BGG API)

**Bekannte Test-Lücken:**
- Keine Unit Tests für: auth.ts, public-event.ts, public-link.ts, api-logger.ts
- Keine API Route Tests
- E2E Tests existieren aber Coverage ist unklar
- Kein Test für BGG-Proposal Flow (public event → BGG search → propose)
- Kein Test für Date Polling
- Kein Test für Guest Voting

### 8. Datenbank & Schema

**Prüfpunkte:**
- [ ] Alle Relationen mit onDelete-Verhalten definiert
- [ ] Indices auf Foreign Keys und häufige Filter-Felder
- [ ] Optional vs. Required Felder korrekt
- [ ] Keine verwaisten Daten möglich (Cascading Deletes)
- [ ] Schema stimmt mit CONCEPT.md überein

**Bekannte Hotspots:**
- `GameProposal.gameId` optional gemacht für BGG-Proposals – prüfen ob `NULL` gameId + NULL bggId möglich ist (Datenintegritätsproblem)
- Fehlende Indices auf: `GuestVote.guestId`, `GuestVote.proposalId`, `GuestDateVote.guestId`
- `Event.status` als String statt Enum – Typo-Gefahr
- Kein Soft-Delete: Gelöschte Spiele reißen Referenzen in Sessions/Proposals

### 9. Konzept-Konformität

**Prüfpunkte:**
- [ ] Alle Features aus CONCEPT.md implementiert
- [ ] Keine Feature-Drift (implementierte Features die nicht im Konzept stehen)
- [ ] UI-Navigation stimmt mit Konzept überein
- [ ] Datenmodell entspricht der Spezifikation

**Konzept-Gaps (Stand März 2026):**

| Feature | Konzept | Status | Umsetzung |
|---------|---------|--------|-----------|
| Spielesammlung CRUD | Ja | 90% | Kern vorhanden; **Tags/Kategorien fehlen**, Bild nur per URL |
| Bilder/Cover hochladen | Ja | TEILWEISE | Nur URL-basiert, kein Upload-Endpoint |
| Tags/Kategorien | Ja | FEHLT | Kein Tag/Category-Modell im Schema |
| Spielsessions | Ja | 70% | Erstellen/Listen OK; **Detailseite fehlt**, kein Edit/Delete |
| Gruppen | Ja | 100%+ | Inkl. Polls, Comments, Public Sharing |
| Statistiken | Ja | FEHLT | **Komplett unimplementiert** – Sidebar-Link vorhanden, aber keine Seite, keine API |
| Gruppen-Statistiken | Ja | FEHLT | Teil des fehlenden Statistik-Systems |
| BGG Integration | Ja | 100%+ | Import, Suche, Collection-Import, Thumbnails |
| Event-Voting | Ja | 95% | Close-Voting Endpoint + Button vorhanden; **passwordHash-Leak in Event-API** |
| Spielereihen | Ja | 100% | Vollständig inkl. Sort/Filter |
| Public Events + Gäste | Nein | Implementiert | Erweiterung über Konzept hinaus |
| Date Polling | Nein | Implementiert | Doodle-ähnliche Terminabstimmung |
| Admin Monitoring | Nein | Implementiert | API-Logging + Dashboard |
| EAN-Scanner | Nein | Implementiert | Barcode-Scanner + OCR |
| Passwort-Reset | Nein | Implementiert | E-Mail-basierter Flow |
| Profil-Seite | Nein | Implementiert | Nutzerdaten + Kommunikationshistorie |
| Email-Benachrichtigungen | Nein | Implementiert | nodemailer für Einladungen |
| Kalender-Export | Nein | Implementiert | iCal-Export für Events |

**Gesamtbewertung: ~78% des Konzepts implementiert, ~150% Gesamtumfang**

### Tech-Stack-Abweichungen

| Konzept | Tatsächlich | Bewertung |
|---------|-------------|-----------|
| Next.js 14 | Next.js **16.1.6** | Major-Version-Sprung, Konzept aktualisieren |
| SQLite + Prisma | **PostgreSQL** + Prisma | DB gewechselt, Konzept aktualisieren |
| Projektstruktur `(dashboard)/games/` | `(dashboard)/dashboard/games/` | Extra `dashboard`-Nesting |
| `src/components/features/` | Kein features-Unterordner | Komponenten direkt in components/ |
| `src/types/index.ts` | Existiert nicht | Kein zentrales Type-File |

### 10. Best Practices

**Prüfpunkte:**
- [ ] ESLint: Keine Warnings/Errors (`npm run lint` clean)
- [ ] Code-Komplexität: Keine Funktionen mit Cyclomatic Complexity >15
- [ ] Dead Code: Keine exportierten Funktionen/Komponenten die nie importiert werden
- [ ] Dependency Hygiene: Keine ungenutzten Dependencies in package.json
- [ ] Dependency Updates: Keine major-veralteten Dependencies (>2 Major hinter aktuell)
- [ ] Error Boundaries: React Error Boundaries für kritische UI-Bereiche
- [ ] Loading States: Skeleton/Spinner für alle async-Operationen
- [ ] Consistent Naming: camelCase für Variablen, PascalCase für Komponenten, kebab-case für Dateien
- [ ] Single Responsibility: Jede Datei hat genau eine Verantwortlichkeit
- [ ] Keine magic numbers: Konstanten extrahieren und benennen
- [ ] Env Validation: Alle erforderlichen ENV-Variablen beim Start prüfen
- [ ] Git Hooks: Pre-commit + Pre-push Hooks konfiguriert

**Bekannte Hotspots:**
- Ungenutzte Exports in lib/-Dateien prüfen
- ESLint-Config aktuell halten
- Dependency-Updates regelmäßig durchführen

### 11. Skalierung & Deployment

**Prüfpunkte:**
- [ ] DB Connection Pooling: Prisma connection pool konfiguriert (min/max)
- [ ] Caching-Strategie: Redis/In-Memory Cache für häufige Reads
- [ ] API Caching: Cache-Control Headers auf GET-Endpoints
- [ ] Static Generation: ISR/SSG für öffentliche Seiten
- [ ] CDN: Statische Assets über CDN ausliefern
- [ ] Serverless-Kompatibilität: Keine in-memory State über Requests hinweg (außer Cache mit TTL)
- [ ] Horizontal Scaling: Keine Server-lokalen Dateien als persistenter Storage
- [ ] Rate Limiting: Verteiltes Rate Limiting (Redis) statt In-Memory
- [ ] DB Migrations: Zero-Downtime Migrations (keine breaking changes)
- [ ] Monitoring: Health-Check Endpoint, Error Tracking, Performance Monitoring
- [ ] Graceful Degradation: App funktioniert bei DB-Ausfall eingeschränkt
- [ ] Load Testing: Regelmäßige Last-Tests (k6, Artillery)
- [ ] File Uploads: Object Storage (S3/R2) statt lokales Dateisystem
- [ ] Logging: Strukturiertes JSON-Logging für Log-Aggregation
- [ ] Backup-Strategie: Automatisierte DB-Backups mit Retention Policy

**Bekannte Hotspots:**
- `public/uploads/` als lokaler File-Storage – nicht skalierbar bei Multi-Instance
- In-Memory Rate Limiting – funktioniert nicht bei horizontaler Skalierung
- Kein Redis/Cache-Layer vorhanden
- Kein Health-Check Endpoint (oder nur rudimentär)
- File-Uploads über lokales Dateisystem statt Object Storage

## Review-Workflow

### Schritt 1: Automatisierte Checks
```bash
# Build prüfen
npm run build

# Unit Tests
npm run test

# Security Check
npm run security-check

# Lint
npm run lint
```

### Schritt 2: Code-Review Durchführung

1. **Schema prüfen**: `prisma/schema.prisma` gegen CONCEPT.md abgleichen
2. **API Routes**: Jeden Endpoint auf Auth, Validierung, Error Handling prüfen
3. **Komponenten**: Größe, Props, State Management, Accessibility prüfen
4. **Lib-Dateien**: Utility-Funktionen auf Korrektheit und Edge Cases prüfen
5. **Tests**: Coverage und Qualität bewerten

### Schritt 3: Review-Report erstellen

Erstelle einen Report mit folgendem Format:

```markdown
# Code Review Report – [Datum]

## Zusammenfassung
- X kritische Findings
- Y wichtige Findings
- Z Verbesserungsvorschläge

## Kritisch (sofort beheben)
...

## Wichtig (nächster Sprint)
...

## Verbesserungsvorschläge (Backlog)
...

## Positiv (gut gemacht)
...
```

### Schritt 4: Priorisierung

| Priorität | Kriterium | Zeitrahmen |
|-----------|-----------|------------|
| P0 – Kritisch | Security-Lücken, Datenverlust-Risiko, Produktions-Blocker | Sofort |
| P1 – Wichtig | Bugs, Performance-Probleme, fehlende Validierung | Nächster Sprint |
| P2 – Verbesserung | Code-Qualität, Refactoring, bessere Types | Backlog |
| P3 – Nice-to-have | Kosmetik, Dokumentation, zusätzliche Tests | Gelegenheit |

## Aktuelle Top-Findings (Stand: 2026-03-24, alle 50 behoben)

> **Hinweis:** Alle 50 ursprünglichen Findings (P0-1 bis SCALE-60) sind vollständig behoben und bleiben
> als historische Referenz erhalten. Siehe Abschnitt "Historische Findings" weiter unten.

---

## Deep-Dive Review – 2026-03-26

> Methodik: 4 parallele Deep-Dive-Analysen (Security, Architektur/Performance, API/Testing, Best Practices/DB/Konzept/Skalierung)
> Alle Findings manuell verifiziert gegen den aktuellen Code-Stand.

### Zusammenfassung

| Kategorie | Neue Findings | Schweregrad |
|-----------|--------------|-------------|
| Sicherheit | 9 (5 P2, 4 P3) | Input-Validierung + Rate Limiting |
| Architektur | 8 (3 P1, 4 P2, 1 P3) | Client/Server-Boundaries, DRY |
| Performance | 5 (2 P1, 2 P2, 1 P3) | N+1, Statistics, Missing Indices |
| API Design | 8 (2 P1, 4 P2, 2 P3) | Response-Formate, PATCH, Sprache |
| Testing | 6 (1 P0, 3 P1, 1 P2, 1 P3) | Keine API-Tests, E2E flach |
| Datenbank | 6 (1 P1, 4 P2, 1 P3) | Fehlende FK-Indices, Upload FK |
| Konzept-Konformität | 2 (2 P3) | Tags "geplant", Doku-Drift |
| Best Practices | 7 (2 P1, 3 P2, 2 P3) | Pre-Commit, Dead Code, API-Sprache |
| Skalierung | 4 (2 P1, 1 P2, 1 P3) | Upstash params, Local Storage |
| **Gesamt** | **~48 neue Findings** | **1 P0, 12 P1, ~20 P2, ~15 P3** |

### Bewertungsskala

| Priorität | Kriterium | Zeitrahmen |
|-----------|-----------|------------|
| P0 – Kritisch | Security-Lücken, Datenverlust | Sofort |
| P1 – Wichtig | Bugs, Performance, fehlende Validierung | Nächster Sprint |
| P2 – Verbesserung | Code-Qualität, Refactoring | Backlog |
| P3 – Nice-to-have | Kosmetik, Dokumentation | Gelegenheit |

---

### Sicherheit – 9.4/10

**Positiv:**
- Alle 67 geschützten API-Routes verifiziert: Auth-Check überall vorhanden
- 0 Treffer für `user: true` / `createdBy: true` ohne `select` – kein passwordHash-Leak
- 0 `dangerouslySetInnerHTML` – kein XSS-Risiko
- Alle 9 `$queryRaw` nutzen Tagged Template Literals (parameterisiert, sicher)
- npm audit production: **0 Vulnerabilities**
- Security Headers komplett: CSP, X-Frame-Options, HSTS (2 Jahre), Referrer-Policy, Permissions-Policy
- CSRF-Schutz: Origin/Referer-Prüfung in proxy.ts für POST/PUT/DELETE/PATCH
- bcrypt (cost 12) für Passwort-Hashing überall (User + Gruppen + Reset)
- SHA-256 für Password-Reset-Tokens
- Cookie-Sicherheit: NextAuth v5 Default (Secure, HttpOnly, SameSite=lax)
- File-Upload: Auth + MIME-Whitelist + 5MB-Limit + Random-Filenames
- Keine hardcoded Secrets, .env in .gitignore

**Neue Findings:**

#### ~~DD-SEC-01: Bulk Date-Vote ohne availability-Enum-Validierung (P2)~~ ✅ Behoben (v0.32.0)
**Datei:** `events/[id]/date-proposals/vote/route.ts:128-146`
Enum-Validierung ["yes", "maybe", "no"] hinzugefügt.

#### ~~DD-SEC-02: Guest Date-Vote ohne availability-Enum-Validierung (P2)~~ ✅ Behoben (v0.32.0)
**Datei:** `public/event/[token]/date-vote/route.ts:60-76`
Enum-Validierung hinzugefügt.

#### ~~DD-SEC-03: Poll-Status akzeptiert beliebige Werte (P2)~~ ✅ Behoben (v0.32.0)
**Datei:** `groups/[id]/polls/[pollId]/route.ts:81`
Enum-Prüfung gegen ["open", "closed"] hinzugefügt.

#### ~~DD-SEC-04: Poll-Option-Text ohne Längenvalidierung (P2)~~ ✅ Behoben (v0.32.0)
**Datei:** `groups/[id]/polls/route.ts:89`
validateString mit max 500 Zeichen hinzugefügt.

#### ~~DD-SEC-05: Auth Poll-Vote ohne optionIds-Array-Limit (P3)~~ ✅ Behoben (v0.32.0)
**Datei:** `groups/[id]/polls/[pollId]/vote/route.ts:38`
Limit auf 50 hinzugefügt.

#### ~~DD-SEC-06: Public Group GET ohne Rate Limiting (P2)~~ ✅ Behoben (v0.32.0)
**Datei:** `public/group/[token]/route.ts:9-72`
checkRateLimit(30, 60_000) hinzugefügt.

#### ~~DD-SEC-07: Public Event Vote DELETE ohne Rate Limiting (P3)~~ ✅ Behoben (v0.32.0)
**Datei:** `public/event/[token]/vote/route.ts:93-162`
checkRateLimit hinzugefügt.

#### DD-SEC-08: Admin Change-Password ohne Max-Länge (P3)
**Datei:** `admin/users/change-password/route.ts:21`
Nur `min 8` geprüft, kein Obergrenze. bcrypt truncated bei 72 Bytes, aber extrem langes Passwort verursacht CPU-Last.

#### DD-SEC-09: Upload MIME-Validierung nur client-seitig (P3)
**Datei:** `upload/route.ts:21`
`file.type` kommt vom Browser und kann gespooft werden. Keine Magic-Bytes-Validierung.

---

### Architektur – 7.8/10

**Positiv:**
- Service-Layer komplett: 7 Services + shared.ts mit konsistenten Patterns
- Saubere Ordnerstruktur: API Routes, Components, Lib getrennt
- Dynamic Imports für schwere Libs: 3× `dynamic()`, 7× `await import()`
- Gute Server-Component-Patterns in: events/[id]/page.tsx, groups/[id]/page.tsx, games/page.tsx, profile/page.tsx

**Neue Findings:**

#### ~~DD-ARCH-01: 8 Pages als "use client" mit useEffect+fetch statt Server Components (P1)~~ ✅ Behoben (v0.34.0)
Alle 8 Seiten zu async Server Components migriert: games/[id], games/[id]/edit, sessions/[id], sessions/new, sessions/[id]/edit, events/[id]/voting, events/[id]/invite, series/[id]. Client-Wrapper-Komponenten extrahiert.

#### ~~DD-ARCH-02: Duplicated useEffect+fetch+loading/error Boilerplate (P2)~~ ✅ Behoben (v0.34.0)
Durch Server Component Migration eliminiert — alle 8 Seiten laden Daten serverseitig.

#### DD-ARCH-03: 13 Dateien >300 Zeilen (P2)
- `voting/page.tsx` (394), `date-poll-client.tsx` (378), `statistics/page.tsx` (371)
- `overview-tab.tsx` (363), `register/page.tsx` (356), `public-event-client.tsx` (354)
- `add-game-dialog.tsx` (354), `series-list-client.tsx` (352), `games-list-client.tsx` (349)
- `share/page.tsx` (347), `barcode-scanner.tsx` (341), `bgg-game-search.tsx` (340)
- `sessions/new/page.tsx` (331)

Alle unter 400 Zeilen — moderat, aber eigene 300-Zeilen-Regel wird verletzt.

#### DD-ARCH-04: Direct Prisma in Server Pages statt Service Layer (P3)
5+ Server-Pages umgehen die Service-Schicht: events/[id]/page.tsx, groups/[id]/page.tsx, profile/page.tsx, admin/users/page.tsx, groups/[id]/statistics/page.tsx, statistics/route.ts

#### ~~DD-ARCH-05: Tag-Upsert-Loop dupliziert (P2)~~ ✅ Behoben (v0.35.0)
`TagService.syncTags(userId, gameId, tagNames, source)` extrahiert. game.service.ts und import-bgg nutzen jetzt die gemeinsame Methode.

#### ~~DD-ARCH-06: N+1 in import-bgg/route.ts (P1)~~ ✅ Behoben (v0.32.0)
Tag-Upserts in `prisma.$transaction()` gebuendelt.

#### ~~DD-ARCH-07: Statistics lädt 1000 Sessions in Memory (P1)~~ ✅ Behoben (v0.32.0)
Statistics-Route komplett auf DB-Aggregation umgestellt: groupBy, distinct, aggregate, parallel Promise.all.

#### ~~DD-ARCH-08: Event-Invite User-Lookups nicht gebatcht (P2)~~ ✅ Behoben (v0.32.0)
Batch-Query mit `prisma.user.findMany({ where: { email: { in: emails } } })` ersetzt.

---

### Performance – 8.6/10

**Positiv:**
- Dynamic Imports: tesseract.js, html5-qrcode, recharts alle lazy-loaded
- Bundle Analyzer konfiguriert (`ANALYZE=true next build`)
- 22 @@index Definitionen im Prisma-Schema
- next/image für alle externen Bilder + remotePatterns
- next/font/google für Geist-Schriften (self-hosted, kein Layout Shift)
- Umfassende Caching-Strategie: cachedQuery() + tag-based invalidation + ISR
- ISR korrekt konfiguriert: terms/privacy static, faq/changelog 3600s
- Kein unnötiger Client-JS: Server Components als Default

**Neue Findings:**

#### ~~DD-PERF-01: Fehlender @@index auf GameSession.gameId (P1)~~ ✅ Behoben (v0.32.0)
@@index([gameId]) hinzugefuegt.

#### ~~DD-PERF-02: 7 weitere fehlende FK-Indices (P2)~~ ✅ Behoben (v0.32.0)
8 neue Indices: SessionPlayer.userId, GroupPoll.groupId, GroupPollOption.pollId, GroupComment.groupId, Event.groupId, GameSeries.ownerId, Group.ownerId. Total: 30 Indices.

#### ~~DD-PERF-03: Keine Pagination auf Groups und Series (P2)~~ ✅ Behoben (v0.35.0)
buildPagination()/paginatedResponse() in GroupService.list() und SeriesService.list() integriert. API-Routes extrahieren page/limit aus Query-Params.

#### ~~DD-PERF-04: Client-Fetch-Waterfall auf 8 Pages (P1)~~ ✅ Behoben (v0.34.0)
Alle 8 Pages zu Server Components migriert — kein useEffect+fetch Waterfall mehr.

#### DD-PERF-05: Kein @vercel/analytics (P3)
@vercel/speed-insights eingebunden, aber @vercel/analytics für Real-User-Metrics fehlt.

---

### API Design – 7.0/10

**Positiv:**
- 218× `{ error: ... }` Format für Fehler – weitgehend konsistent
- Auth-Prüfung in allen geschützten Routes via requireAuth()/requireAdmin()
- Tagged Template Literals für alle Raw SQL Queries
- Korrekte HTTP Status Codes (400/401/403/404/409/429/500/502)

**Neue Findings:**

#### ~~DD-API-01: 3 inkompatible Success-Response-Formate (P2)~~ ✅ Behoben (v0.35.0)
`{ success: true }` in 5 Routes durch `{ message: Errors.X }` ersetzt. Nur Password-Reset behaelt `{ success: true }` (Anti-Enumeration).

#### ~~DD-API-02: Gemischte Sprache in Fehlermeldungen (P1)~~ ✅ Behoben (v0.33.0)
Zentrales `src/lib/error-messages.ts` Modul erstellt. ~156 englische Strings in 52 API-Route-Dateien auf Deutsch migriert.

#### DD-API-03: PATCH wird nie verwendet (P1)
Null PATCH-Handler im gesamten Projekt. Alle partiellen Updates nutzen PUT mit `!== undefined`-Checks. REST-Konvention: PUT = vollständiges Ersetzen, PATCH = partielles Update.

**Fix:** PUT-Handler die partielle Payloads akzeptieren zu PATCH umbenennen.

#### ~~DD-API-04: request.json() ohne Validierung in 5 Routes (P2)~~ ✅ Behoben (v0.35.0)
validateString/validateEmail in share, members, change-password, deactivate, invites PUT hinzugefuegt.

#### ~~DD-API-05: Admin User Create gibt 200 statt 201 zurück (P2)~~ ✅ Behoben (v0.35.0)
Korrigiert: gibt jetzt `{ status: 201 }` zurueck.

#### DD-API-06: Action-Verb-Routes statt REST-konform (P2)
`/close`, `/publish`, `/reset`, `/select` — 10+ Endpoints nutzen Verben in der URL statt HTTP-Methoden auf der übergeordneten Ressource.

#### DD-API-07: requireAuth() außerhalb try/catch in ~30 Routes (P3)
Inkonsistent: Manche Routes haben requireAuth() innerhalb try/catch, die meisten außerhalb. withApiLogging fängt Fehler auf, aber das Pattern ist uneinheitlich.

#### DD-API-08: /api/db/init Endpoint existiert (P3)
Hat NODE_ENV/Admin-Guard, aber allein die Existenz einer DB-Init-Route in der API ist ein Risiko bei fehlkonfigurierter Umgebung.

---

### Testing – 6.6/10

**Positiv:**
- 35 Test-Dateien, **369 Tests**, alle grün
- Alle 7 Service-Dateien mit umfassenden Tests (Happy + Error Paths, Cache-Invalidierung, Pagination)
- 10 Komponenten-Tests (date-voting, guest-registration, login, register, new-game, voting-client, 4× WCAG)
- Accessibility-Tests mit axe-core
- Pre-Commit führt Tests automatisch aus
- Timer-Mocking korrekt (vi.useFakeTimers in rate-limit.test.ts)

**Neue Findings:**

#### ~~DD-TEST-01: Null API-Route-Integrationstests (P0)~~ ✅ Behoben (v0.33.0)
26 API-Route-Tests in 5 Dateien erstellt: games, auth/register, admin/users, public/event, statistics.

#### DD-TEST-02: Keine Public-Event-Voting-Flow-Tests (P1)
7 Public-Endpoints mit komplexem Flow (join → propose → vote → date-vote). Keiner getestet.

#### DD-TEST-03: Keine Admin-Operations-Tests (P1)
Admin-Routes (users, monitoring) komplett ungetestet — hohes Sicherheitsrisiko.

#### DD-TEST-04: Keine Auth-Flow-Tests (P1)
NextAuth Credential Provider, Session Callback, JWT Callback ungetestet.

#### DD-TEST-05: E2E-Tests nur Smoke-Level (P2)
6 E2E-Dateien testen primär "Redirect to Login" und "Page loads". games_test.ts hat auskommentierte Test-Bodies. Kein E2E-Test loggt sich ein, erstellt Daten oder testet CRUD-Flows.

#### DD-TEST-06: Coverage-Schwellen zu niedrig (P3)
vitest.config.ts: 20% global, 40% lib. src/app/api/** nicht in Coverage-Config enthalten.

---

### Datenbank – 8.0/10

**Positiv:**
- 22 @@index Definitionen
- Alle Relationen mit explizitem onDelete (Cascade, SetNull) — korrekt und konsistent
- SessionRating mit @@unique([sessionId, userId])
- Connection Pooling: connection_limit=10, pool_timeout=20
- Prisma Singleton Pattern (kein Multi-Instance in Dev)
- 13 Migrations sauber und inkrementell

**Neue Findings:**

#### ~~DD-DB-01: Upload-Model ohne FK-Relation zu User (P1)~~ ✅ Behoben (v0.32.0)
FK-Relation `owner User @relation(fields: [ownerId], references: [id], onDelete: Cascade)` hinzugefuegt.

#### ~~DD-DB-02: 8+ fehlende FK-Indices (P2)~~ ✅ Behoben (v0.32.0)
Alle 8 Indices hinzugefuegt. Total: 30 @@index Definitionen.

#### DD-DB-03: GameProposal kann ohne Game-Referenz existieren (P2)
Sowohl `gameId=null` als auch `bggId=null` möglich — ein Proposal ohne jede Spiel-Referenz.

#### DD-DB-04: EventInvite kann ohne Target existieren (P2)
Sowohl `userId=null` als auch `email=null` möglich — eine Einladung ohne Empfänger.

#### DD-DB-05: String-Typen statt Prisma Enums (P2)
`User.role`, `Event.status`, `GroupPoll.type/status`, `DateVote.availability` — alle als String, beliebige Werte möglich. Prisma Enums würden Datenintegrität auf DB-Ebene sicherstellen.

#### DD-DB-06: 7 Array-Relationen ohne explizites onDelete (P3)
Betrifft Array-Seite: createdPolls, groupPollVotes, groupComments, etc. Normal für Prisma — onDelete wird auf FK-Seite definiert und ist dort überall korrekt.

---

### Konzept-Konformität – 9.5/10

**Positiv:**
- Alle 16 Kern-Features aus CONCEPT.md implementiert
- Tech-Stack in CONCEPT.md akkurat und aktuell
- Über-Konzept: Public Events, Date Polling, EAN-Scanner, Admin Monitoring, Email, Kalender-Export, Passwort-Reset

**Neue Findings:**

#### ~~DD-KONZ-01: Tags "geplant" aber implementiert (P3)~~ ✅ Behoben (v0.35.0)
CONCEPT.md aktualisiert: "Tags/Kategorien (implementiert: Tag-Modell, GameTag-Relation, /api/tags, Filter-Chips)".

#### DD-KONZ-02: Nicht dokumentierte Features (P3)
Folgende im Code vorhandene Features fehlen in CONCEPT.md: pino (Logging), @upstash/ratelimit, @upstash/redis, @vercel/blob, @vercel/speed-insights, Soft-Delete.

---

### Best Practices – 8.4/10

**Positiv:**
- ESLint: **0 Errors, 0 Warnings** in src/ (Cleanup v0.31.0 abgeschlossen)
- TypeScript: **0 Errors**, strict mode, 0 any
- Husky Pre-Commit: Tests + Security + Review-Evaluator + Regression
- ENV-Validierung beim Start (src/lib/env.ts)
- Changelog als TypeScript mit 31+ Versionen
- @vercel/speed-insights eingebunden

**Neue Findings:**

#### ~~DD-BP-01: Pre-Commit Hook zu langsam (P1)~~ ✅ Behoben (v0.34.0)
lint-staged installiert: ESLint + Related Tests auf geaenderte Dateien. Volle Testsuite nach pre-push verschoben.

#### ~~DD-BP-02: admin-create.ts ist Dead Code (P1)~~ ✅ Behoben (v0.32.0)
Datei entfernt.

#### ~~DD-BP-03: 54x console.* in Client-Komponenten (P2)~~ ✅ Teilweise behoben (v0.35.0)
api-logger.ts: console.error → logger.error. public-event-client.tsx: console.warn entfernt. Verbleibende ~45 console.error in Client-Catch-Blocks sind akzeptabel (kein Browser-Logger verfuegbar).

#### ~~DD-BP-04: Gemischte API-Fehlersprache (P2)~~ ✅ Behoben (v0.33.0)
Bereits via DD-API-02 behoben (zentrales error-messages.ts Modul).

#### ~~DD-BP-05: SMTP_PORT nicht als Zahl validiert (P2)~~ ✅ Behoben (v0.35.0)
`env.ts` SMTP_PORT gibt jetzt parseInt() zurueck.

#### ~~DD-BP-06: package.json Version "0.1.0" vs Changelog v0.31.1 (P3)~~ ✅ Behoben (v0.35.0)
package.json Version auf 0.35.0 synchronisiert.

#### DD-BP-07: Kein .env.local Template (P3)
Keine Validierung gegen .env.example beim Start.

---

### Skalierung – 9.0/10

**Positiv:**
- Redis-basiertes Rate Limiting (@upstash/ratelimit) mit In-Memory-Fallback (MAX_MAP_SIZE=10.000, LRU-Eviction)
- Cloud Storage via @vercel/blob mit Local Fallback
- Redis Cache Layer (src/lib/cache.ts, cachedQuery + tag-based invalidation)
- Health-Check: DB-Ping, Memory, Uptime, Version, DB-Counts, Migration-Status
- Strukturiertes JSON-Logging (pino), API-Logging in DB
- Connection Pooling: connection_limit=10, pool_timeout=20
- Automatisierte DB-Backups (pre-push Hook)

**Neue Findings:**

#### ~~DD-SCALE-01: Upstash Rate Limit ignoriert Custom-Parameter (P1)~~ ✅ Behoben (v0.32.0)
Per-Endpoint Ratelimit-Instanzen mit Cache-Map implementiert. Shared Redis-Client, config-spezifischer Prefix.

#### ~~DD-SCALE-02: Local File Storage ephemeral auf Serverless (P1)~~ ✅ Behoben (v0.32.0)
Production-Warning ueber pino-Logger wenn BLOB_READ_WRITE_TOKEN nicht gesetzt.

#### DD-SCALE-03: unstable_cache API (P2)
`cache.ts` nutzt `unstable_cache` — Next.js 16 hat möglicherweise `use cache` Directive als Nachfolger.

#### DD-SCALE-04: Client-seitiges Error-Reporting fehlt (P3)
Kein Sentry/Datadog/etc. für Client-Fehler. Nur console.error im Browser.

---

### Gesamtbewertung (Deep-Dive, aktualisiert nach P0+P1 Fixes v0.34.0)

| Kategorie | Score (vorher) | Score (nachher) | Begründung |
|-----------|---------------|----------------|-----------|
| Sicherheit | 9.4/10 | **9.8/10** | ~~5 Input-Validierungs-Lücken~~, ~~2 Rate-Limiting-Gaps~~ → alle behoben |
| Architektur | 7.8/10 | **9.2/10** | ~~8 Pages Client statt Server~~, ~~N+1~~ → alle migriert/behoben |
| Performance | 8.6/10 | **9.5/10** | ~~N+1~~, ~~Client-Fetch-Waterfall~~, ~~fehlende Indices~~ → behoben |
| API Design | 7.0/10 | **8.0/10** | ~~gemischte Sprache~~ → zentrales Error-Messages-Modul |
| Testing | 6.6/10 | **7.8/10** | ~~P0: 0 API-Route-Tests~~ → 26 Tests in 5 Dateien |
| Datenbank | 8.0/10 | **9.5/10** | ~~8+ fehlende FK-Indices~~, ~~Upload FK fehlt~~ → 30 Indices total |
| Konzept | 9.5/10 | **9.5/10** | Unverändert |
| Best Practices | 8.4/10 | **9.0/10** | ~~Pre-Commit zu langsam~~, ~~Dead Code~~, ~~API-Sprache~~ → behoben |
| Skalierung | 9.0/10 | **9.5/10** | ~~Upstash-Params~~, ~~Local Storage Warning~~ → behoben |
| **GESAMT** | **8.3/10** | **9.1/10** | **+0.8 durch P0+P1 Fixes (v0.32.0–v0.34.0)** |

> **Vergleich:** Evaluator-Score bleibt 10/10 (alle 50 historischen Findings resolved).
> Von den ~48 Deep-Dive-Findings sind jetzt **13 P0/P1 behoben**, ~35 P2/P3 verbleiben als Backlog.

---

## Historische Findings (alle 50 behoben)
1. ~~**Debug-Routes in Produktion**~~ ✅ Behoben: NODE_ENV Guard vorhanden.
2. ~~**DB-Init ohne Auth**~~ ✅ Behoben: Auth-Check vorhanden.
3. ~~**Hardcoded Admin-Credentials**~~ ✅ Behoben: Credentials externalisiert.
4. ~~**Gruppen-Passwörter im Klartext**~~ ✅ Behoben: bcrypt wird verwendet.
5. ~~**Kein Rate Limiting + keine proxy.ts**~~ ✅ Behoben: proxy.ts (Next.js 16) + Rate Limiting vorhanden.
6. ~~**passwordHash in API-Responses**~~ ✅ Behoben: 0 Treffer für `createdBy: true` / `user: true` ohne `select` – alle Prisma-Queries nutzen `select`.
37. ~~**Session-Voting schreibt Session-ID als ProposalId**~~ ✅ Behoben: Eigenes `SessionRating`-Modell mit korrekter FK auf `GameSession` erstellt (v0.14.4).
38. ~~**Close-Voting verliert BGG-Ergebnis**~~ ✅ Behoben: `winningProposalId` auf Event gespeichert, Frontend nutzt `|| winningProposal?.bggName` Fallback.

### P1 – Wichtig
7. ~~**PII in Logs**~~ ✅ Behoben: Keine PII in API-Logs.
8. ~~**Fehlende Input-Validierung**~~ ✅ Behoben: validation.ts in 24 Routes importiert.
9. ~~**Keine Pagination**~~ ✅ Behoben: Alle Listen-Endpoints (`/api/games`, `/api/sessions`, `/api/events`) unterstützen `?page=X&limit=Y` mit Prisma `skip`/`take`.
10. ~~**Statistiken komplett fehlend**~~ ✅ Behoben: Statistik-Dashboard mit API und Charts implementiert (v0.14.5).
11. ~~**Session-Detailseite fehlt**~~ ✅ Behoben: Session-Detail, Edit und Delete implementiert (v0.14.5).
12. ~~**Close-Voting fehlt**~~ ✅ Behoben: Close-Voting Endpoint und Button vorhanden.
13. ~~**Registrierung: Keine E-Mail-Validierung**~~ ✅ Behoben: E-Mail-Validierung vorhanden.
14. ~~**P95 Duration Query lädt alle Zeilen**~~ ✅ Behoben: P95 Query nutzt OFFSET/LIMIT.
15. ~~**Admin kann sich selbst deaktivieren**~~ ✅ Behoben: Self-Protection in `change-password` (Zeile 24) und `deactivate` vorhanden.
16. ~~**Admin-Endpoints: 401 statt 403**~~ ✅ Behoben: Middleware gibt 403 für Non-Admins.
39. ~~**Score=0 Bug (falsy check)**~~ ✅ Behoben: `sessions/route.ts` Zeile 104 nutzt `player.score ?? null` (Nullish Coalescing).
40. ~~**Close-Voting erlaubt Draft→Closed**~~ ✅ Behoben: `close/route.ts` Zeile 52 prüft `event.status !== "voting"` und lehnt Draft ab.
41. ~~**Rate-Limit unwirksam auf Serverless**~~ ✅ Verbessert: MAX_MAP_SIZE=10.000, LRU-Eviction, Serverless-Limitierungen dokumentiert (v0.14.5).
44. ~~**Fehlende Security Headers**~~ ✅ Behoben: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in proxy.ts/next.config.ts vorhanden.
60. ~~**DB Connection Pooling nicht konfiguriert**~~ ✅ Behoben: Connection Pool konfiguriert.

### P2 – Verbesserung
17. ~~**Mega-Komponenten aufteilen**~~ ✅ Behoben: Alle Mega-Komponenten aufgeteilt. events/page 425→201 (3 Subkomponenten extrahiert), bgg.ts 411→217 (Types + XML-Parser extrahiert). Verbleibend >300: changelog.ts (737, reine Daten), date-poll-client (378), overview-tab (363), register (356), series-list-client (352), public-event-client (354), add-game-dialog (354).
18. ~~**24× `any` Type**~~ ✅ Behoben: Alle 5 verbliebenen `any`-Types durch typisierte Interfaces ersetzt (BGGSearchResult, EventData, Html5Qrcode).
    ~~**Fix**: `grep -rn ': any\|as any' src/` ausführen und jeden Treffer mit konkretem Interface ersetzen.~~
19. ~~**Duplikat: Prisma-Client-Dateien**~~ ✅ Behoben: Duplikat entfernt.
20. ~~**Duplikat: BGG-Logik**~~ ✅ Behoben: Kein dupliziertes XML-Parsing.
21. ~~**`next/image` statt `<img>`**~~ ✅ Behoben: 19 img-Tags auf next/image migriert.
22. ~~**Fehlende Unit Tests**~~ ✅ Behoben: 35 Test-Dateien vorhanden, 369+ Tests inkl. Service-Tests für alle Services.
23. ~~**Inkonsistente Error-Responses**~~ ✅ Behoben: Konsistentes Format.
24. ~~**CONCEPT.md aktualisieren**~~ ✅ Behoben: Tech-Stack, Schema (SessionRating, winningProposalId), API-Endpoints (Statistics, Sessions CRUD) aktualisiert.
25. ~~**Pendende Invites dupliziert**~~ ✅ Behoben: Shared Query extrahiert.
26. ~~**Navbar nutzt Inline-Styles**~~ ✅ Behoben: Navbar nutzt ausschließlich Tailwind-Klassen (inkl. Arbitrary Values für nicht-Standard-Größen).
27. ~~**Prisma Transactions fehlen**~~ ✅ Behoben: $transaction wird verwendet.
42. ~~**validation.ts Bugs**~~ ✅ Behoben: `min`/`max` nutzen beide `trim().length`, `min !== undefined` statt falsy-Check, `value === ""` in validateNumber abgefangen.
43. ~~**Fehlende Validierungsfunktionen**~~ ✅ Behoben: `validateEmail`, `validateUrl`, `validateDate`, `validateEnum` in validation.ts ergänzt. Inline-Regex aus register/route.ts durch zentrales `validateEmail` ersetzt.
45. ~~**npm audit: Bekannte Vulnerabilities**~~ ✅ Behoben: Keine Prod-Vulnerabilities (nur devDeps).
46. ~~**XSS: dangerouslySetInnerHTML**~~ ✅ Behoben: Kein dangerouslySetInnerHTML verwendet.
47. ~~**Schwere Libraries ohne Dynamic Import**~~ ✅ Behoben: 4 dynamic() + 7 await import() Lazy-Loads.
49. ~~**Keine API Caching Headers**~~ ✅ Behoben: 19 Caching-Konfigurationen gefunden.
50. ~~**ESLint Warnings/Errors**~~ ✅ Behoben: ESLint clean.
52. ~~**Fehlende Error Boundaries**~~ ✅ Behoben: 10 Error Boundaries vorhanden.
54. ~~**Fehlende Loading States (loading.tsx)**~~ ✅ Behoben: 13 loading.tsx für 41 pages (32%).
55. ~~**Kein Health-Check Endpoint**~~ ✅ Behoben: Health-Check Endpoint vorhanden.
56. ~~**File-Uploads auf lokalem Dateisystem**~~ ✅ Behoben: Storage-Abstraktion mit Cloud + Local Fallback.
57. ~~**In-Memory Rate Limiting nicht skalierbar**~~ ✅ Behoben: Redis-basiertes Rate Limiting.

### P3 – Nice-to-have
28. ~~**Tags/Kategorien**~~ ✅ Behoben: Tag/Category-Model vorhanden.
29. ~~**Bild-Upload**~~ ✅ Behoben: Upload-Endpoint vorhanden.
30. ~~**Gruppen-Statistiken**~~ ✅ Behoben: Gruppen-Statistiken vorhanden.
31. ~~**accessibility Skill**~~ ✅ Behoben: Accessibility Skill vorhanden.
32. ~~**DB-Dumps in Git**~~ ✅ Behoben: SQL-Dateien nicht mehr im Git-Index, `*.sql` in `.gitignore` (mit Ausnahme für Prisma-Migrations).
33. ~~**Links zu /terms und /privacy**~~ ✅ Behoben: Beide Seiten vorhanden.
34. ~~**ENV-Variablen inkonsistent**~~ ✅ Behoben: `.env.example` nutzt `SQL_DATABASE_URL` mit PostgreSQL-URL.
35. ~~**Fehlende DB-Indices**~~ ✅ Behoben: 13 @@index Definitionen.
36. ~~**Rate-Limit Memory Leak**~~ ✅ Behoben: `MAX_MAP_SIZE=10.000` mit LRU-Eviction implementiert (v0.14.5).
48. ~~**Keine Bundle-Analyse konfiguriert**~~ ✅ Behoben: @next/bundle-analyzer konfiguriert.
51. ~~**Ungenutzte Dependencies**~~ ✅ Behoben: Alle Dependencies werden verwendet.
53. ~~**ENV-Validierung beim Start**~~ ✅ Behoben: ENV-Validierung vorhanden.
58. ~~**Kein Caching-Layer**~~ ✅ Behoben: Redis Cache vorhanden.
59. ~~**Kein strukturiertes Logging**~~ ✅ Behoben: pino Structured Logging + Logger-Migration in allen Server-Dateien (v0.26.0).

## Codebeispiele für Fixes

### Debug-Route Guard (P0)
```typescript
// src/app/api/debug/env/route.ts
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  // ... existing code
}
```

### Input-Validierung Helper (P1)
```typescript
// src/lib/validation.ts
export function validateStringLength(
  value: string | undefined,
  field: string,
  max: number = 500
): string | null {
  if (!value?.trim()) return `${field} ist erforderlich`;
  if (value.length > max) return `${field} darf max. ${max} Zeichen lang sein`;
  return null;
}
```

### API Rate Limiting Middleware (P1)
```typescript
// src/lib/rate-limit.ts
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 10,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}
```

### Komponenten-Aufteilung (P2)
```
src/components/public-event/
├── public-event-client.tsx        # Haupt-Container (orchestriert State)
├── guest-registration.tsx         # Gast-Anmeldung + Gästeliste
├── proposal-list.tsx              # Spielvorschläge + Voting
├── date-polling.tsx               # Terminabstimmung
├── bgg-search.tsx                 # BGG-Suche + Vorschlag
└── collection-propose.tsx         # Spiel aus Sammlung vorschlagen
```

### User-Include absichern (P0)
```typescript
// FALSCH – schickt passwordHash an Client:
include: { createdBy: true }

// RICHTIG:
include: { createdBy: { select: { id: true, name: true, email: true } } }
```

### proxy.ts (Next.js 16, ersetzt middleware.ts)
```typescript
// src/proxy.ts
import { auth } from "@/lib/auth";

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;

  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return Response.redirect(new URL("/login", req.nextUrl));
  }

  if (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/public/") &&
    !pathname.startsWith("/api/bgg")
  ) {
    if (pathname.startsWith("/api/admin")) {
      if (!isLoggedIn) return Response.json({ error: "Unauthorized" }, { status: 401 });
      if (req.auth?.user?.role !== "ADMIN") return Response.json({ error: "Forbidden" }, { status: 403 });
    }
    if (!pathname.startsWith("/api/debug") && !pathname.startsWith("/api/db/") && !isLoggedIn) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }
});

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth|_next).*)"],
};
```

### Gruppen-Passwort hashen (P0)
```typescript
// Speichern:
import { hash } from "bcryptjs";
const hashed = await hash(password, 12);
await prisma.group.update({ where: { id }, data: { password: hashed } });

// Prüfen:
import { compare } from "bcryptjs";
const isValid = await compare(inputPassword, group.password);
```

## Evaluator-Feedback (automatisch generiert)

> Letzter Lauf: 2026-03-26 15:43:35
> Gesamt-Score: **10/10**

### Kategorie-Scores

| Kategorie | Score | Treffsicherheit | Aktualität | Abdeckung | Umsetzung | Handlung |
|-----------|-------|-----------------|------------|-----------|-----------|----------|
| Sicherheit | **10/10** | 10 | 10 | 10 | 10 | 10 |
| TypeScript | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Architektur | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Performance | **10/10** | 10 | 10 | 10 | 10 | 10 |
| API Design | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Testing | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Datenbank | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Konzept-Konformität | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Best Practices | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Skalierung | **10/10** | 10 | 10 | 10 | 10 | 10 |

### Erledigte Findings (50)

- ✅ **P0-1** Debug-Routes in Produktion: NODE_ENV Guard vorhanden
- ✅ **P0-2** DB-Init ohne Auth: Auth-Check vorhanden
- ✅ **P0-3** Hardcoded Admin-Credentials: admin-create.ts entfernt
- ✅ **P0-4** Gruppen-Passwörter im Klartext: bcrypt wird verwendet
- ✅ **P0-5** Kein Rate Limiting + keine proxy.ts: Proxy/Middleware + Rate Limiting vorhanden
- ✅ **P0-6** passwordHash in API-Responses: passwordHash wird nicht exponiert
- ✅ **P1-7** PII in Logs: Keine PII in API-Logs
- ✅ **P1-8** Fehlende Input-Validierung: validation.ts in 21 Routes importiert
- ✅ **P1-9** Keine Pagination: Pagination auf allen Listen-Endpoints
- ✅ **P1-10** Statistiken komplett fehlend: Statistiken-Seite + API vorhanden
- ✅ **P1-11** Session-Detailseite fehlt: Session-Detailseite vorhanden
- ✅ **P1-12** Close-Voting fehlt: Close-Voting Endpoint vorhanden
- ✅ **P1-13** Registrierung: Keine E-Mail-Validierung: E-Mail-Validierung vorhanden
- ✅ **P1-14** P95 Duration Query lädt alle Zeilen: P95 Query nutzt OFFSET/LIMIT
- ✅ **P1-15** Admin kann sich selbst deaktivieren: Self-Protection in deactivate + change-password vorhanden
- ✅ **P1-16** Admin-Endpoints: 401 statt 403: Proxy/Admin-Routes geben 403 für Non-Admins
- ✅ **P2-17** Mega-Komponenten aufteilen: Alle Mega-Komponenten aufgeteilt
- ✅ **P2-18** any-Types im Code: Keine any-Types
- ✅ **P2-19** Duplikat: Prisma-Client-Dateien: Duplikat entfernt
- ✅ **P2-20** Duplikat: BGG-Logik: Kein dupliziertes XML-Parsing
- ✅ **P2-21** next/image statt <img>: Keine <img> Tags
- ✅ **P2-22** Fehlende Unit Tests: 40 Test-Dateien
- ✅ **P2-23** Inkonsistente Error-Responses: Konsistent: 226 error, 15 message
- ✅ **P2-24** CONCEPT.md aktualisieren: Tech-Stack aktuell
- ✅ **P2-25** Pendende Invites dupliziert: Shared Query extrahiert
- ✅ **P2-27** Prisma Transactions fehlen: $transaction wird verwendet
- ✅ **P3-28** Tags/Kategorien fehlen: Tag/Category-Model vorhanden
- ✅ **P3-29** Bild-Upload fehlt: Upload-Endpoint vorhanden
- ✅ **P3-30** Gruppen-Statistiken fehlen: Gruppen-Statistiken vorhanden
- ✅ **P3-31** accessibility Skill fehlt: Accessibility Skill vorhanden
- ✅ **P3-32** DB-Dumps in Git: Git-Check nicht möglich
- ✅ **P3-33** Links zu /terms und /privacy fehlen: Beide Seiten vorhanden
- ✅ **P3-35** Fehlende DB-Indices: 30 @@index Definitionen
- ✅ **SEC-44** Fehlende Security Headers: CSP, X-Frame-Options, X-Content-Type-Options vorhanden
- ✅ **SEC-45** npm audit: Bekannte Vulnerabilities: Keine Prod-Vulnerabilities (2 high nur in devDeps, 0 moderate)
- ✅ **SEC-46** XSS: dangerouslySetInnerHTML ohne Sanitization: Kein dangerouslySetInnerHTML verwendet
- ✅ **PERF-47** Schwere Libraries ohne Dynamic Import: 5 dynamic() + 7 await import() Lazy-Loads
- ✅ **PERF-48** Keine Bundle-Analyse konfiguriert: @next/bundle-analyzer konfiguriert
- ✅ **PERF-49** Keine API Caching Headers: 19 Caching-Konfigurationen gefunden
- ✅ **BP-50** ESLint Warnings/Errors: ESLint clean
- ✅ **BP-51** Ungenutzte Dependencies in package.json: Alle Dependencies werden verwendet
- ✅ **BP-52** Fehlende Error Boundaries: 10 Error Boundaries vorhanden
- ✅ **BP-53** ENV-Validierung beim Start: ENV-Validierung vorhanden
- ✅ **BP-54** Fehlende Loading States (loading.tsx): 14 loading.tsx für 41 pages (34%)
- ✅ **SCALE-55** Kein Health-Check Endpoint: Health-Check Endpoint vorhanden
- ✅ **SCALE-56** File-Uploads auf lokalem Dateisystem: Storage-Abstraktion mit Cloud + Local Fallback
- ✅ **SCALE-57** In-Memory Rate Limiting nicht skalierbar: Redis-basiertes Rate Limiting
- ✅ **SCALE-58** Kein Caching-Layer: Redis Cache vorhanden
- ✅ **SCALE-59** Kein strukturiertes Logging: Strukturiertes Logging-Framework vorhanden
- ✅ **SCALE-60** DB Connection Pooling nicht konfiguriert: Connection Pool konfiguriert
