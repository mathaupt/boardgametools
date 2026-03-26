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

## Aktuelle Top-Findings (Stand: 2026-03-21)

### P0 – Kritisch
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
44. **Fehlende Security Headers**: Keine CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy in proxy.ts oder next.config.ts.
    **Fix**: Ergänze Security Headers in proxy.ts oder next.config headers(): CSP, X-Frame-Options: DENY, X-Content-Type-Options: nosniff.
60. **DB Connection Pooling nicht konfiguriert**: Prisma nutzt Default-Pool ohne explizite Limits. Production-Singleton nicht auf globalThis gesetzt.
    **Fix**: Ergänze `?connection_limit=10&pool_timeout=20` in DATABASE_URL oder nutze PgBouncer.

### P2 – Verbesserung
17. ~~**Mega-Komponenten aufteilen**~~ ✅ Behoben: Alle 5 Mega-Komponenten aufgeteilt (public-event 1152→354, group-detail 989→396, monitoring 906→144, barcode 825→338, series 976→591). Noch 8 Dateien >400 Zeilen übrig (games/import 760, date-poll-client 731, voting/page 693, series/page 591, profile-client 588, public/group 471, create-poll-form 426, events/page 423).
18. ~~**24× `any` Type**~~ ✅ Behoben: Alle 5 verbliebenen `any`-Types durch typisierte Interfaces ersetzt (BGGSearchResult, EventData, Html5Qrcode).
    ~~**Fix**: `grep -rn ': any\|as any' src/` ausführen und jeden Treffer mit konkretem Interface ersetzen.~~
19. ~~**Duplikat: Prisma-Client-Dateien**~~ ✅ Behoben: Duplikat entfernt.
20. ~~**Duplikat: BGG-Logik**~~ ✅ Behoben: Kein dupliziertes XML-Parsing.
21. ~~**`next/image` statt `<img>`**~~ ✅ Behoben: 19 img-Tags auf next/image migriert.
22. **Fehlende Unit Tests**: 10 Test-Dateien vorhanden (bgg, utils, security-check, changelog, monitoring, public-event, rate-limit, sessions, validation, admin-users), 132 Tests. Keine Tests für: Auth, API-Routes (Integration), Komponenten, Voting, Guest-Flow.
    **Fix**: Mindestens Tests für `auth.ts`, `validation.ts`, `rate-limit.ts`, `queries/pending-invites.ts` hinzufügen.
23. ~~**Inkonsistente Error-Responses**~~ ✅ Behoben: Konsistentes Format.
24. ~~**CONCEPT.md aktualisieren**~~ ✅ Behoben: Tech-Stack, Schema (SessionRating, winningProposalId), API-Endpoints (Statistics, Sessions CRUD) aktualisiert.
25. ~~**Pendende Invites dupliziert**~~ ✅ Behoben: Shared Query extrahiert.
26. ~~**Navbar nutzt Inline-Styles**~~ ✅ Behoben: Navbar nutzt ausschließlich Tailwind-Klassen (inkl. Arbitrary Values für nicht-Standard-Größen).
27. ~~**Prisma Transactions fehlen**~~ ✅ Behoben: $transaction wird verwendet.
42. ~~**validation.ts Bugs**~~ ✅ Behoben: `min`/`max` nutzen beide `trim().length`, `min !== undefined` statt falsy-Check, `value === ""` in validateNumber abgefangen.
43. ~~**Fehlende Validierungsfunktionen**~~ ✅ Behoben: `validateEmail`, `validateUrl`, `validateDate`, `validateEnum` in validation.ts ergänzt. Inline-Regex aus register/route.ts durch zentrales `validateEmail` ersetzt.
45. **npm audit: Bekannte Vulnerabilities**: `next@16.1.6` (beta) hat moderate Vulnerabilities. next-auth beta (`^5.0.0-beta.30`) in Produktion.
    **Fix**: `npm audit fix` ausführen oder betroffene Dependencies manuell aktualisieren.
46. **XSS: dangerouslySetInnerHTML**: Prüfen ob `dangerouslySetInnerHTML` ohne Sanitization-Library verwendet wird.
    **Fix**: DOMPurify.sanitize() vor dangerouslySetInnerHTML oder komplett entfernen.
47. **Schwere Libraries ohne Dynamic Import**: `recharts` (~500KB) in 3 Dateien statisch importiert. `next/dynamic` und `React.lazy()` werden nirgends verwendet.
    **Fix**: `next/dynamic` mit `{ ssr: false }` für recharts-Komponenten nutzen.
49. **Keine API Caching Headers**: Kein Cache-Control, kein s-maxage, kein stale-while-revalidate auf GET-Endpoints.
    **Fix**: Cache-Control Headers auf lesende API-Endpoints setzen.
50. **ESLint Warnings/Errors**: ESLint-Config enthält keine Custom Rules (kein no-console, kein no-explicit-any, kein import-ordering).
    **Fix**: `npx next lint --fix` ausführen und strengere Custom Rules ergänzen.
52. **Fehlende Error Boundaries**: Keine `error.tsx` oder `global-error.tsx` für Fehlerbehandlung in Route-Segmenten.
    **Fix**: `src/app/error.tsx` und `src/app/global-error.tsx` erstellen.
54. **Fehlende Loading States (loading.tsx)**: Keine `loading.tsx` Dateien für Streaming/Suspense in Route-Segmenten.
    **Fix**: `loading.tsx` mit Skeleton-Komponenten in wichtigen Route-Segmenten erstellen.
55. **Kein Health-Check Endpoint**: Kein `/api/health` oder `/api/healthz` für Monitoring/Load-Balancer.
    **Fix**: `/api/health/route.ts` erstellen: DB-Ping, `{ status: 'ok', db: 'connected' }`.
56. **File-Uploads auf lokalem Dateisystem**: `public/uploads/` als Storage – nicht skalierbar bei Multi-Instance.
    **Fix**: Auf S3/R2/Vercel Blob Storage migrieren.
57. **In-Memory Rate Limiting nicht skalierbar**: `new Map()` in rate-limit.ts – funktioniert nicht horizontal.
    **Fix**: Upstash Redis Rate Limiting (`@upstash/ratelimit`) verwenden.

### P3 – Nice-to-have
28. **Tags/Kategorien**: Im Konzept vorgesehen, aber nicht implementiert. Kein Tag/Category-Model im Schema.
29. **Bild-Upload**: Nur URL-basiert, kein echter File-Upload.
30. **Gruppen-Statistiken**: Im Konzept vorgesehen, fehlt noch.
31. ~~**accessibility Skill**~~ ✅ Behoben: Accessibility Skill vorhanden.
32. ~~**DB-Dumps in Git**~~ ✅ Behoben: SQL-Dateien nicht mehr im Git-Index, `*.sql` in `.gitignore` (mit Ausnahme für Prisma-Migrations).
33. ~~**Links zu /terms und /privacy**~~ ✅ Behoben: Beide Seiten vorhanden.
34. ~~**ENV-Variablen inkonsistent**~~ ✅ Behoben: `.env.example` nutzt `SQL_DATABASE_URL` mit PostgreSQL-URL.
35. ~~**Fehlende DB-Indices**~~ ✅ Behoben: 13 @@index Definitionen.
36. ~~**Rate-Limit Memory Leak**~~ ✅ Behoben: `MAX_MAP_SIZE=10.000` mit LRU-Eviction implementiert (v0.14.5).
48. **Keine Bundle-Analyse konfiguriert**: Kein `@next/bundle-analyzer` in Dependencies oder Config.
    **Fix**: `npm i -D @next/bundle-analyzer` und ANALYZE=true in next.config ergänzen.
51. **Ungenutzte Dependencies**: Potenzielle Dead Dependencies in package.json (hover-card, tooltip, dropdown-menu Radix-Primitives).
    **Fix**: `npx depcheck` ausführen und ungenutzte Dependencies entfernen.
53. **ENV-Validierung beim Start**: Keine systematische Prüfung erforderlicher ENV-Variablen.
    **Fix**: `src/lib/env.ts` mit Zod-Schema für alle ENV-Variablen erstellen.
58. **Kein Caching-Layer**: Kein Redis, kein unstable_cache, kein ISR/SWR. Jeder Request geht direkt zur DB.
    **Fix**: Next.js `unstable_cache` oder Upstash Redis für häufige Reads nutzen.
59. **Kein strukturiertes Logging**: Nur `console.log` – nicht für Log-Aggregation geeignet.
    **Fix**: `pino` + `pino-pretty` installieren und `src/lib/logger.ts` erstellen.

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

> Letzter Lauf: 2026-03-26 08:57:13
> Gesamt-Score: **9.9/10**

### Kategorie-Scores

| Kategorie | Score | Treffsicherheit | Aktualität | Abdeckung | Umsetzung | Handlung |
|-----------|-------|-----------------|------------|-----------|-----------|----------|
| Sicherheit | **9.6/10** | 10 | 9.2 | 10 | 9.3 | 10 |
| TypeScript | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Architektur | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Performance | **10/10** | 10 | 10 | 10 | 10 | 10 |
| API Design | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Testing | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Datenbank | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Konzept-Konformität | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Best Practices | **10/10** | 10 | 10 | 10 | 10 | 10 |
| Skalierung | **10/10** | 10 | 10 | 10 | 10 | 10 |

### Erledigte Findings (49)

- ✅ **P0-1** Debug-Routes in Produktion: NODE_ENV Guard vorhanden
- ✅ **P0-2** DB-Init ohne Auth: Auth-Check vorhanden
- ✅ **P0-3** Hardcoded Admin-Credentials: Credentials externalisiert
- ✅ **P0-4** Gruppen-Passwörter im Klartext: bcrypt wird verwendet
- ✅ **P0-5** Kein Rate Limiting + keine proxy.ts: Proxy/Middleware + Rate Limiting vorhanden
- ✅ **P0-6** passwordHash in API-Responses: passwordHash wird nicht exponiert
- ✅ **P1-7** PII in Logs: Keine PII in API-Logs
- ✅ **P1-8** Fehlende Input-Validierung: validation.ts in 17 Routes importiert
- ✅ **P1-9** Keine Pagination: Pagination auf allen Listen-Endpoints
- ✅ **P1-10** Statistiken komplett fehlend: Statistiken-Seite + API vorhanden
- ✅ **P1-11** Session-Detailseite fehlt: Session-Detailseite vorhanden
- ✅ **P1-12** Close-Voting fehlt: Close-Voting Endpoint vorhanden
- ✅ **P1-13** Registrierung: Keine E-Mail-Validierung: E-Mail-Validierung vorhanden
- ✅ **P1-14** P95 Duration Query lädt alle Zeilen: P95 Query nutzt OFFSET/LIMIT
- ✅ **P1-16** Admin-Endpoints: 401 statt 403: Proxy/Admin-Routes geben 403 für Non-Admins
- ✅ **P2-17** Mega-Komponenten aufteilen: Alle Mega-Komponenten aufgeteilt
- ✅ **P2-18** any-Types im Code: Keine any-Types
- ✅ **P2-19** Duplikat: Prisma-Client-Dateien: Duplikat entfernt
- ✅ **P2-20** Duplikat: BGG-Logik: Kein dupliziertes XML-Parsing
- ✅ **P2-21** next/image statt <img>: Keine <img> Tags
- ✅ **P2-22** Fehlende Unit Tests: 33 Test-Dateien
- ✅ **P2-23** Inkonsistente Error-Responses: Konsistent: 218 error, 10 message
- ✅ **P2-24** CONCEPT.md aktualisieren: Tech-Stack aktuell
- ✅ **P2-25** Pendende Invites dupliziert: Shared Query extrahiert
- ✅ **P2-27** Prisma Transactions fehlen: $transaction wird verwendet
- ✅ **P3-28** Tags/Kategorien fehlen: Tag/Category-Model vorhanden
- ✅ **P3-29** Bild-Upload fehlt: Upload-Endpoint vorhanden
- ✅ **P3-30** Gruppen-Statistiken fehlen: Gruppen-Statistiken vorhanden
- ✅ **P3-31** accessibility Skill fehlt: Accessibility Skill vorhanden
- ✅ **P3-32** DB-Dumps in Git: Git-Check nicht möglich
- ✅ **P3-33** Links zu /terms und /privacy fehlen: Beide Seiten vorhanden
- ✅ **P3-35** Fehlende DB-Indices: 22 @@index Definitionen
- ✅ **SEC-44** Fehlende Security Headers: CSP, X-Frame-Options, X-Content-Type-Options vorhanden
- ✅ **SEC-45** npm audit: Bekannte Vulnerabilities: Keine Prod-Vulnerabilities (5 high nur in devDeps, 1 moderate)
- ✅ **SEC-46** XSS: dangerouslySetInnerHTML ohne Sanitization: Kein dangerouslySetInnerHTML verwendet
- ✅ **PERF-47** Schwere Libraries ohne Dynamic Import: 4 dynamic() + 7 await import() Lazy-Loads
- ✅ **PERF-48** Keine Bundle-Analyse konfiguriert: @next/bundle-analyzer konfiguriert
- ✅ **PERF-49** Keine API Caching Headers: 19 Caching-Konfigurationen gefunden
- ✅ **BP-50** ESLint Warnings/Errors: ESLint clean
- ✅ **BP-51** Ungenutzte Dependencies in package.json: Alle Dependencies werden verwendet
- ✅ **BP-52** Fehlende Error Boundaries: 10 Error Boundaries vorhanden
- ✅ **BP-53** ENV-Validierung beim Start: ENV-Validierung vorhanden
- ✅ **BP-54** Fehlende Loading States (loading.tsx): 13 loading.tsx für 41 pages (32%)
- ✅ **SCALE-55** Kein Health-Check Endpoint: Health-Check Endpoint vorhanden
- ✅ **SCALE-56** File-Uploads auf lokalem Dateisystem: Storage-Abstraktion mit Cloud + Local Fallback
- ✅ **SCALE-57** In-Memory Rate Limiting nicht skalierbar: Redis-basiertes Rate Limiting
- ✅ **SCALE-58** Kein Caching-Layer: Redis Cache vorhanden
- ✅ **SCALE-59** Kein strukturiertes Logging: Strukturiertes Logging-Framework vorhanden
- ✅ **SCALE-60** DB Connection Pooling nicht konfiguriert: Connection Pool konfiguriert

### Offene Findings (1)

- ❌ **P1-15** Admin kann sich selbst deaktivieren: Keine Self-Protection
