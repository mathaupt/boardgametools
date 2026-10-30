# Entwicklungsprozess & Agent-Architektur

## Verbindlicher Feature-Ablauf

Seit 30.10.2026 gilt für jedes neue Feature in Web und iOS:

1. **Nummerieren:** Fortlaufende ID `FEAT-XXX` im
   [Feature-Backlog](FEATURE-BACKLOG.md) vergeben. Ziel, Anforderungen, Status und
   Abnahmekriterien festhalten; offene Gestaltungsfragen als Prüfauftrag führen.
2. **Bestand prüfen:** Vorhandene Teilfunktionen, betroffene Plattformen, Datenflüsse,
   Berechtigungen und Review-Findings prüfen. Bei größeren Änderungen den bestehenden
   Evaluator-Vorlauf durchführen.
3. **Implementierungsplan erstellen:** Unter
   `docs/superpowers/plans/YYYY-MM-DD-FEAT-XXX-kurzname.md` Umfang, Entscheidungen,
   Dateien, Schritte, Tests und Dokumentationsbedarf beschreiben. Impeccable- und
   Security-Prüfung ausdrücklich aufnehmen.
4. **Umsetzung freigeben lassen:** Den konkreten Plan vorlegen. Erst ausdrückliche
   Umsetzungsfreigabe erlaubt funktionale Codeänderungen. Ein TODO oder die Bitte um
   einen Plan genügt nicht. Datum und Umfang im Backlog dokumentieren; wesentliche
   Erweiterungen erneut abstimmen.
5. **Umsetzen und testen:** Bestätigten Plan ausführen, notwendige Regressionstests
   ergänzen und angemessene Unit-, Integrations- und Ablaufprüfungen durchführen.
6. **Impeccable prüfen:** UI-Änderungen mit Produkt- und Designkontext anhand gerenderter
   Ansichten auf den betroffenen Plattformen prüfen. Relevante Zustände, Barrierefreiheit,
   mobile Darstellung beziehungsweise Dynamic Type und dunkle Darstellung einbeziehen.
   Bei Features ohne Oberfläche die Nichtanwendbarkeit dokumentieren.
7. **Security und Qualität prüfen:** Bei jedem Feature Auswirkungen auf Authentifizierung,
   Berechtigungen, Eingabevalidierung, Datenschutz, Fehlerbehandlung und Abhängigkeiten
   prüfen. Sicherheitsfälle gezielt testen. Security- und Review-Regressionschecks
   sowie passende Build-, Typ- und Lintprüfungen ausführen; nicht betroffene Bereiche
   begründet als nicht zutreffend kennzeichnen.
8. **Abschließen:** Changelog und betroffene Dokumentation aktualisieren, gefundene Bugs
   im Bugregister führen, Änderungen committen und Review-Ergebnisse dokumentieren.
   Backlogstatus und Release-Version nach tatsächlicher Fertigstellung aktualisieren.

Ein gemeinsamer Plan darf mehrere Feature-IDs umfassen; Abnahmekriterien und
Freigabeumfang müssen je ID nachvollziehbar bleiben. Plan- und Prüfdokumentation
erzeugen keine zusätzliche Funktionsfreigabe. Die folgenden historischen Regeln
und technischen Prüflisten ergänzen diesen Ablauf.

> **Lessons Learned aus 105 Findings (50 historisch + 55 Deep-Dive)**
>
> Dieses Dokument definiert 8 spezialisierte Agents und einen
> 10-Schritte-Entwicklungsprozess, der — haette er von Beginn an
> existiert — saemtliche 7 P0-, 28 P1-, 39 P2- und 28 P3-Findings
> verhindert haette.

---

## Teil 1: Zusammenfassung der gelernten Fehler

### Ueberblick nach Kategorie

| Kategorie | Findings | Davon P0/P1 | Haeufigste Ursache |
|-----------|----------|-------------|---------------------|
| Sicherheit | 22 | 12 | Fehlende Input-Validierung, keine Rate Limits, Secrets in Code |
| Architektur | 20 | 5 | Client-seitiges Fetching statt Server Components, fehlende Features |
| Code-Qualitaet | 16 | 1 | `any`-Types, Mega-Dateien, duplizierte Logik |
| DevOps | 15 | 2 | Fehlende CI-Checks, kein strukturiertes Logging |
| Datenbank | 14 | 4 | Fehlende Indices, N+1 Queries, keine Transaktionen |
| API Design | 11 | 2 | Inkonsistente Formate, gemischte Sprache, fehlende Pagination |
| Testing | 7 | 4 | Null API-Tests, keine Flow-Tests, keine Coverage-Schwellen |
| Dokumentation | 4 | 0 | CONCEPT.md Drift, undokumentierte Features |
| **Gesamt** | **105** | **35** | |

### Die 7 kritischsten Fehler (P0)

Diese waeren durch einfache, verbindliche Regeln komplett vermeidbar gewesen:

| # | Fehler | Vermeidung |
|---|--------|------------|
| 1 | Debug-Routes in Produktion erreichbar | `NODE_ENV`-Guard als erste Zeile in jeder Dev-Route |
| 2 | DB-Init-Endpoint ohne Auth | Jeder mutierende Endpoint braucht Auth — keine Ausnahmen |
| 3 | Admin-Credentials im Quellcode | Secrets ausschliesslich aus Umgebungsvariablen |
| 4 | Passwoerter im Klartext gespeichert | bcrypt (cost >= 12) fuer JEDES Passwort — keine Ausnahmen |
| 5 | Kein Rate Limiting, keine Middleware | Rate Limiting + Auth-Middleware ab Tag 1 |
| 6 | passwordHash in API-Responses | Niemals `include: { user: true }` — immer mit `select` |
| 7 | Null API-Route-Tests (0 von 67) | Mindestens 1 Test pro HTTP-Methode pro Route |

### Die 10 haeufigsten Fehler-Muster

| # | Muster | Vorkommen | Agent |
|---|--------|-----------|-------|
| 1 | Fehlende/unvollstaendige Input-Validierung | 14x | Security Agent |
| 2 | Fehlende DB-Indices auf Foreign Keys | 10x | Database Agent |
| 3 | Inkonsistente API-Response-Formate | 8x | API Design Agent |
| 4 | `"use client"` + `useEffect` statt Server Components | 8x | Architecture Agent |
| 5 | Fehlende Tests fuer existierenden Code | 7x | Testing Agent |
| 6 | Dateien > 300 Zeilen ohne Aufteilung | 6x | Code Quality Agent |
| 7 | Duplizierte Logik (Queries, Validierung) | 5x | Code Quality Agent |
| 8 | CONCEPT.md nicht synchron mit Code | 4x | Documentation Agent |
| 9 | Fehlende Rate Limits auf oeffentlichen Endpoints | 4x | Security Agent |
| 10 | Statistik-Queries laden alle Zeilen in Memory | 3x | Database Agent |

---

## Teil 2: Die 8 Agents

### Agent 1: Security Agent

> **Trigger:** Jede Aenderung an `src/app/api/`, `src/lib/auth.ts`, `prisma/schema.prisma`, `src/lib/validation.ts`

**Regeln (21):**

```
SEC-01  Jede Debug/Dev-Route MUSS `NODE_ENV !== "production"` als erste Zeile haben
SEC-02  Jeder mutierende Endpoint MUSS Auth erfordern — keine Ausnahmen fuer "interne" Routen
SEC-03  Keine hardcodierten Secrets im Quellcode — alles aus Umgebungsvariablen
SEC-04  Alle Passwoerter MUESSEN mit bcrypt (cost >= 12) gehasht werden
SEC-05  Alle oeffentlichen Endpoints MUESSEN Rate Limiting haben — ab Tag 1
SEC-06  Niemals `include: { user: true }` ohne `select` — Felder immer whitelisten
SEC-07  Logging MUSS PII sanitisieren — strukturiertes Logging mit Feld-Kontrolle
SEC-08  Jeder POST/PUT/PATCH MUSS alle Inputs validieren (Typ, Laenge, Format)
SEC-09  Email, URL, Datum MUESSEN dedizierte Validatoren nutzen (`validateEmail`, etc.)
SEC-10  Admin-Selbstaenderung (Deaktivierung, Rollenwechsel) MUSS blockiert sein
SEC-11  Security Headers (CSP, HSTS, X-Frame-Options, etc.) MUESSEN ab Tag 1 gesetzt sein
SEC-12  `dangerouslySetInnerHTML` ist verboten (ausser mit DOMPurify-Sanitisierung)
SEC-13  Enum-Inputs MUESSEN gegen eine Allowlist validiert werden
SEC-14  Guest/Public-Endpoints MUESSEN dieselben Validierungsregeln haben wie Auth-Endpoints
SEC-15  Alle String-Inputs MUESSEN eine max-Laengen-Validierung haben
SEC-16  Array-Inputs MUESSEN ein Laengen-Limit haben (z.B. max 50 Elemente)
SEC-17  Rate Limiting MUSS alle HTTP-Methoden auf Public Routes abdecken
SEC-18  Passwort-Felder MUESSEN min (8) UND max (128) Laengenvalidierung haben
SEC-19  File-Upload-Validierung MUSS serverseitig mit Magic-Bytes-Pruefung erfolgen
SEC-20  Admin/Dev-Endpoints MUESSEN in Production komplett blockiert sein
SEC-21  Jedes `request.json()` MUSS von Feld-Validierung gefolgt werden
```

**Automatisierbare Pruefungen:**
- `grep -r "include:" | grep -v "select:"` → passwordHash-Leaks
- `grep -r "dangerouslySetInnerHTML"` → XSS-Risiko
- `grep -r "console\.(log|warn)" src/` → PII in Logs (Server)
- `npm audit --omit=dev` → Bekannte Vulnerabilities
- Jede neue Route: Hat sie Auth? Hat sie Input-Validierung? Hat sie Rate Limiting?

---

### Agent 2: Architecture Agent

> **Trigger:** Neue Seiten, neue Komponenten, Aenderungen an `src/app/`, Feature-Planung

**Regeln (16):**

```
ARCH-01  Data-Fetching-Seiten MUESSEN async Server Components sein
         "use client" + useEffect + fetch ist ein Anti-Pattern fuer initiale Daten
ARCH-02  Alle Features aus CONCEPT.md MUESSEN implementiert sein — Status tracken
ARCH-03  Jede CRUD-Ressource MUSS alle 4 Operationen haben (Create, Read, Update, Delete)
ARCH-04  Alle State-Machine-Transitionen MUESSEN implementiert sein (z.B. Draft->Voting->Closed)
         Ungueltige Transitionen MUESSEN mit aktuellem Status geprueft und abgelehnt werden
ARCH-05  State-Transitionen MUESSEN alle relevanten Ergebnis-Daten persistieren
ARCH-06  Alle Bilder MUESSEN `next/image` nutzen — kein rohes `<img>`
ARCH-07  Libraries > 100KB MUESSEN via `next/dynamic` oder `await import()` geladen werden
ARCH-08  Jeder groessere Seitenbereich MUSS eine React Error Boundary haben
ARCH-09  Jede Routengruppe MUSS ein `loading.tsx` haben
ARCH-10  Rechtliche Seiten (Impressum, Datenschutz) MUESSEN vor Launch existieren
ARCH-11  Ein Caching-Layer (Redis) MUSS fuer haeufig gelesene Daten existieren
ARCH-12  Gleiche Patterns (useEffect+fetch+loading) in >2 Dateien → Shared Hook oder Server Components
ARCH-13  Rate Limiter MUSS per-Endpoint Konfiguration unterstuetzen (Factory Pattern)
ARCH-14  Bei Nutzung instabiler APIs (unstable_cache) → Migrationsplan dokumentieren
ARCH-15  Alle Sub-Features eines Feature-Bereichs MUESSEN zusammen getrackt werden
ARCH-16  Statistik-Features MUESSEN fuer alle in CONCEPT.md spezifizierten Entitaeten existieren
```

---

### Agent 3: API Design Agent

> **Trigger:** Jede Aenderung an `src/app/api/`, neue API-Endpunkte

**Regeln (8):**

```
API-01  Alle Listen-Endpoints MUESSEN `?page=X&limit=Y` unterstuetzen (Default-Limit <= 50)
API-02  401 = nicht authentifiziert, 403 = nicht autorisiert — Middleware MUSS unterscheiden
API-03  Alle Fehler-Responses MUESSEN `{ error: string }` Format nutzen
        Niemals `{ message: ... }` oder `{ success: false }` fuer Fehler
API-04  GET-Endpoints MUESSEN passende Cache-Control Headers setzen
API-05  Ein einziges Success-Format definieren und durchsetzen:
        `{ message: string }` fuer Aktionen, Entity-Objekt fuer CRUD
API-06  Alle API-Nachrichten MUESSEN in EINER Sprache sein (Deutsch)
        Zentrale `error-messages.ts` Konstanten nutzen
API-07  Partielle Updates MUESSEN PATCH-Methode unterstuetzen
        Minimum: `export const PATCH = PUT;` Alias
API-08  Korrekte HTTP-Status-Codes:
        200 = OK, 201 = Created, 204 = No Content
        Ressourcen-Erstellung MUSS 201 zurueckgeben
```

---

### Agent 4: Database Agent

> **Trigger:** Aenderungen an `prisma/schema.prisma`, neue DB-Queries, Statistik-Endpunkte

**Regeln (10):**

```
DB-01  Statistische Queries MUESSEN SQL-Aggregation nutzen (groupBy, aggregate, distinct)
       Niemals alle Zeilen in den Speicher laden
DB-02  FK-Felder MUESSEN die korrekte Entitaet referenzieren
       Separate Modelle fuer semantisch verschiedene Bewertungen
DB-03  Prisma Connection Pool MUSS explizit konfiguriert sein (connection_limit, pool_timeout)
DB-04  Multi-Step-Write-Operationen MUESSEN in `prisma.$transaction()` gewrappt werden
DB-05  Jede FK-Spalte MUSS einen korrespondierenden `@@index` haben
       → Checkliste nach jeder Schema-Aenderung: "Fehlende FK-Indices?"
DB-06  Schleifen mit einzelnen DB-Queries MUESSEN durch Batch-Operationen ersetzt werden
DB-07  Mehrfach-Lookups nach demselben Feld MUESSEN
       `findMany({ where: { field: { in: values } } })` nutzen
DB-08  Jedes `ownerId`/`userId`-Feld MUSS eine `@relation` mit explizitem `onDelete` haben
DB-09  Wenn multiple nullable FKs auf einem Model existieren:
       App-Level-Validierung dass mindestens einer gesetzt ist
DB-10  Nach jeder Schema-Aenderung:
       1. @@index fuer neue FKs hinzufuegen
       2. @relation mit onDelete pruefen
       3. Migration erstellen und testen
```

---

### Agent 5: Testing Agent

> **Trigger:** Neue API-Routen, neue Services, neue Features, pre-push Hook

**Regeln (6):**

```
TEST-01  Jede API-Route MUSS mindestens 1 Integrationstest pro HTTP-Methode haben
         0 API-Tests = Release-Blocker (P0)
TEST-02  Kern-User-Flows (Voting, Registrierung, Vorschlaege) MUESSEN
         End-to-End-Integrationstests haben
TEST-03  Admin-Operationen MUESSEN Tests inklusive Edge Cases haben (Self-Protection)
TEST-04  Auth-Flows (requireAuth, requireAdmin) MUESSEN dedizierte Tests haben
TEST-05  Jede Service/Lib-Datei MUSS eine korrespondierende `.test.ts` Datei haben
TEST-06  Minimum Coverage-Schwellen: global >= 30%, lib/ >= 50% — durchgesetzt in CI
```

**Test-Pyramide:**

```
                    /  E2E  \           ← Smoke-Tests (Seiten laden, Redirects)
                   /----------\
                  / Integration \       ← API-Route-Tests (Auth, CRUD, Flows)
                 /----------------\
                /    Unit Tests    \    ← Services, Libs, Validierung, Utilities
               /--------------------\
```

---

### Agent 6: Code Quality Agent

> **Trigger:** Jede Code-Aenderung, pre-commit Hook

**Regeln (13):**

```
CQ-01  Dateien > 300 Zeilen MUESSEN fuer Aufteilung geprueft werden
       > 400 Zeilen → Pflicht-Refactoring
CQ-02  `any` Typ ist verboten — ESLint `@typescript-eslint/no-explicit-any` = error
CQ-03  Infrastruktur-Singletons (Prisma Client, Auth Config) MUESSEN in genau einer Datei existieren
CQ-04  Domain-Logik (XML-Parsing, Transformationen) MUSS in Shared-Utility-Modulen liegen (DRY)
CQ-05  Wiederholte Query-Patterns MUESSEN in Shared-Service-Methoden extrahiert werden
CQ-06  In Tailwind-Projekten sind Inline-Styles verboten — nur Utility-Klassen
CQ-07  Niemals Falsy-Checks fuer Zahlen (`if (!value)`)
       Immer `?? null` oder `=== undefined` nutzen
CQ-08  Validierungsfunktionen MUESSEN Edge Cases behandeln:
       `trim().length`, `!== undefined` fuer Bounds, leere Strings
CQ-09  Zentrale Validatoren fuer alle semantischen Typen — kein Inline-Regex
CQ-10  In-Memory Maps MUESSEN MAX_SIZE mit LRU-Eviction haben
CQ-11  Dead Code (unreferenzierte Exports, ungenutzte Dateien) MUSS entfernt werden
CQ-12  ENV-Variablen die Zahlen repraesentieren MUESSEN mit parseInt()/parseFloat() geparsed werden
CQ-13  Server-Code MUSS strukturierten Logger (pino) nutzen
       `console.log`/`console.warn` ist im Server-Code verboten
```

---

### Agent 7: DevOps Agent

> **Trigger:** CI/CD Pipeline, pre-commit/pre-push Hooks, Dependency-Aenderungen

**Regeln (14):**

```
OPS-01  `npm audit --omit=dev` MUSS 0 kritische/hohe Vulnerabilities zeigen — blockender CI-Schritt
OPS-02  ESLint MUSS mit 0 Fehlern UND 0 Warnungen bestehen — pre-commit Hook
OPS-03  `*.sql` (ausser Migrationen) MUSS in .gitignore stehen — keine Daten-Dumps in Git
OPS-04  `.env.example` MUSS mit tatsaechlichen ENV-Vars uebereinstimmen — in derselben PR aktualisieren
OPS-05  `@next/bundle-analyzer` MUSS konfiguriert sein — kein Chunk > 500KB
OPS-06  `depcheck` regelmaessig ausfuehren — ungenutzte Dependencies entfernen
OPS-07  `/api/health` Endpoint MUSS existieren (DB-Ping, Memory, Uptime, Version)
OPS-08  Production MUSS Cloud Storage nutzen (Vercel Blob/S3) — Warnung wenn Cloud-Config fehlt
OPS-09  Production Rate Limiting MUSS Redis nutzen — In-Memory nur als dokumentierter Fallback
OPS-10  Strukturiertes JSON Logging (pino) ab Projektstart — niemals `console.log` im Server-Code
OPS-11  Pre-Commit Hooks MUESSEN `lint-staged` nutzen (nur geaenderte Dateien)
        Vollstaendige Test-Suite gehoert in pre-push
OPS-12  `package.json` Version MUSS in derselben PR wie der Changelog-Eintrag aktualisiert werden
OPS-13  `.env.local.example` MUSS existieren mit lokalen Entwicklungswerten
OPS-14  Real User Monitoring (RUM) MUSS ab Launch installiert sein
```

**CI/CD Pipeline:**

```
pre-commit:    lint-staged (ESLint + betroffene Tests) + Security Check + Review Evaluator
pre-push:      Vollstaendige Test-Suite + DB-Backup
CI (PR):       tsc + eslint + npm test + npm audit + bundle-size + coverage
CD (main):     Build + Deploy + Smoke Tests + RUM-Monitoring
```

---

### Agent 8: Documentation Agent

> **Trigger:** Jede Feature-Aenderung, Schema-Aenderung, Tech-Stack-Aenderung

**Regeln (3):**

```
DOC-01  CONCEPT.md MUSS in derselben PR aktualisiert werden wenn sich
        Tech-Stack, Schema oder API aendern
DOC-02  Wenn Features von "geplant" auf "implementiert" wechseln:
        CONCEPT.md MUSS in derselben PR aktualisiert werden
DOC-03  Jedes neue Feature (Soft-Delete, Logging, Security Headers)
        MUSS bei Auslieferung in CONCEPT.md dokumentiert werden
```

---

## Teil 3: Der Entwicklungsprozess (10 Schritte)

```
┌─────────────────────────────────────────────────────────────────┐
│                    FEATURE-ANFORDERUNG                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 1: Planung & Konzept                                   │
│  Agent: Documentation Agent + Architecture Agent                │
│                                                                 │
│  ☐ Feature in CONCEPT.md dokumentieren                          │
│  ☐ Alle Sub-Features identifizieren und tracken                 │
│  ☐ CRUD-Vollstaendigkeit pruefen (Create, Read, Update, Delete) │
│  ☐ State-Machine-Transitionen definieren (alle!)                │
│  ☐ Rechtliche Seiten pruefen (Terms, Privacy)                  │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 2: Schema-Design                                       │
│  Agent: Database Agent                                          │
│                                                                 │
│  ☐ Prisma-Schema erweitern                                     │
│  ☐ @@index fuer JEDE FK-Spalte hinzufuegen                      │
│  ☐ @relation mit explizitem onDelete fuer jede FK               │
│  ☐ Nullable FK-Paare: "mindestens einer gesetzt" validieren     │
│  ☐ Connection Pool konfiguriert?                                │
│  ☐ Migration erstellen und testen                               │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 3: API-Design                                          │
│  Agent: API Design Agent                                        │
│                                                                 │
│  ☐ Endpunkte definieren (RESTful, korrekte HTTP-Methoden)       │
│  ☐ Pagination fuer ALLE Listen-Endpoints (page + limit)         │
│  ☐ PATCH-Alias fuer partielle Updates                           │
│  ☐ Status-Codes festlegen (201 fuer Create, 204 fuer Delete)   │
│  ☐ Fehler-Format: `{ error: string }` — konsistent, deutsch    │
│  ☐ Fehler-Konstanten in error-messages.ts definieren            │
│  ☐ Cache-Control Headers fuer GET-Endpoints planen              │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 4: Security-First Implementation                       │
│  Agent: Security Agent                                          │
│                                                                 │
│  ☐ Auth-Check als ERSTE Zeile in jedem geschuetzten Endpoint    │
│  ☐ Input-Validierung fuer ALLE Felder (Typ, Laenge, Format)     │
│    - Strings: min + max Laenge                                  │
│    - Zahlen: min + max Wert                                     │
│    - Enums: Allowlist-Validierung                               │
│    - Arrays: max Laenge                                         │
│    - Passwoerter: min 8 + max 128                               │
│    - Emails, URLs, Daten: dedizierte Validatoren                │
│  ☐ Rate Limiting auf ALLEN oeffentlichen Endpoints              │
│  ☐ Prisma: Niemals `include: { user: true }` — immer `select`  │
│  ☐ Keine Secrets im Code — alles aus ENV                        │
│  ☐ File-Uploads: Server-seitige Magic-Bytes-Validierung         │
│  ☐ Admin-Self-Protection (Deaktivierung, Rollenwechsel)         │
│  ☐ Debug-Routes: NODE_ENV Guard                                 │
│  ☐ Security Headers in Middleware/Proxy gesetzt                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 5: Server-Side-First UI                                │
│  Agent: Architecture Agent                                      │
│                                                                 │
│  ☐ Seiten als async Server Components (KEIN useEffect+fetch)    │
│  ☐ `"use client"` NUR fuer Interaktivitaet (onClick, useState)  │
│  ☐ Client-Wrapper-Komponenten fuer interaktive Teile            │
│  ☐ `next/image` fuer ALLE Bilder — kein rohes `<img>`           │
│  ☐ Schwere Libs (>100KB) via `next/dynamic` / `await import()`  │
│  ☐ Error Boundaries fuer jeden Seitenbereich                    │
│  ☐ `loading.tsx` fuer jede Routengruppe                         │
│  ☐ Komponenten max 300 Zeilen — aufteilen wenn noetig           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 6: Code-Qualitaet                                      │
│  Agent: Code Quality Agent                                      │
│                                                                 │
│  ☐ Kein `any` Typ — konkrete TypeScript Interfaces              │
│  ☐ DRY: Domain-Logik in Shared Modules extrahieren              │
│  ☐ DRY: Wiederholte Queries in Service-Methoden                 │
│  ☐ Nur Tailwind Utility-Klassen — keine Inline-Styles           │
│  ☐ Nullish Coalescing fuer Zahlen (`?? null`)                   │
│  ☐ Zentrale Validatoren nutzen — kein Inline-Regex              │
│  ☐ Strukturiertes Logging (pino) — kein console.log im Server   │
│  ☐ ENV-Zahlen mit parseInt() parsen                             │
│  ☐ In-Memory Maps: MAX_SIZE + LRU-Eviction                      │
│  ☐ Dead Code entfernen                                          │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 7: Datenbank-Optimierung                               │
│  Agent: Database Agent                                          │
│                                                                 │
│  ☐ Statistik-Queries: DB-Aggregation (groupBy, aggregate)       │
│  ☐ Keine N+1 Queries — Batch-Operationen nutzen                 │
│  ☐ Multi-Step-Writes in $transaction() wrappen                  │
│  ☐ Mehrfach-Lookups: findMany mit { in: values }               │
│  ☐ Alle FK-Indices vorhanden? → Checkliste durchgehen           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 8: Tests schreiben                                     │
│  Agent: Testing Agent                                           │
│                                                                 │
│  ☐ Unit Tests fuer jeden Service / jede Lib-Datei               │
│  ☐ API-Route-Tests: mind. 1 Test pro HTTP-Methode               │
│    - Happy Path                                                 │
│    - Auth-Fehler (401/403)                                      │
│    - Validierungs-Fehler (400)                                  │
│    - Nicht-Gefunden (404)                                       │
│  ☐ Core-Flow-Tests (Voting, Registrierung, Proposals)           │
│  ☐ Admin-Edge-Cases (Self-Protection, Role-Check)               │
│  ☐ Coverage pruefen: global >= 30%, lib/ >= 50%                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 9: Pre-Commit & CI                                     │
│  Agent: DevOps Agent                                            │
│                                                                 │
│  Pre-Commit (automatisch):                                      │
│  ☐ lint-staged: ESLint (0 Fehler, 0 Warnungen)                 │
│  ☐ lint-staged: betroffene Unit Tests                           │
│  ☐ Security Check (OWASP-basiert)                               │
│  ☐ Review Evaluator (Regressions-Pruefung)                      │
│                                                                 │
│  Pre-Push (automatisch):                                        │
│  ☐ Vollstaendige Test-Suite                                     │
│  ☐ TypeScript Compiler (tsc --noEmit)                           │
│  ☐ npm audit --omit=dev                                         │
│  ☐ DB-Backup (Production)                                       │
│                                                                 │
│  CI Pipeline (PR):                                              │
│  ☐ tsc + eslint + tests + coverage                              │
│  ☐ npm audit + bundle-size                                      │
│  ☐ depcheck (ungenutzte Dependencies)                           │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│  SCHRITT 10: Dokumentation & Release                            │
│  Agent: Documentation Agent + DevOps Agent                      │
│                                                                 │
│  ☐ Changelog-Eintrag in src/lib/changelog.ts                    │
│  ☐ package.json Version synchronisieren                         │
│  ☐ CONCEPT.md aktualisieren (neue Features, Tech-Stack)         │
│  ☐ .env.example aktualisieren (neue ENV-Vars)                   │
│  ☐ AGENTS.md aktualisieren (neue Regeln, neue Dateien)          │
│  ☐ Review-Score pruefen — Ziel: steigend, keine Regression      │
│  ☐ RUM-Monitoring aktiv (@vercel/analytics)                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Teil 4: Agent-Interaktion im Ueberblick

```
                         ┌──────────────┐
                         │   Entwickler  │
                         └──────┬───────┘
                                │
                    ┌───────────┴───────────┐
                    │   Documentation Agent  │  ← Schritt 1 + 10
                    │   (CONCEPT.md Sync)    │
                    └───────────┬───────────┘
                                │
              ┌─────────────────┼─────────────────┐
              │                 │                 │
    ┌─────────┴──────┐  ┌──────┴───────┐  ┌──────┴───────┐
    │ Database Agent  │  │  API Design  │  │ Architecture │
    │ (Schema, Index, │  │  Agent       │  │ Agent        │
    │  Queries)       │  │ (REST, Codes │  │ (Components, │
    │                 │  │  Pagination) │  │  Patterns)   │
    └─────────┬──────┘  └──────┬───────┘  └──────┬───────┘
              │                │                 │
              └────────────────┼─────────────────┘
                               │
                    ┌──────────┴──────────┐
                    │   Security Agent     │  ← Schritt 4 (durchgehend)
                    │   (Auth, Validation, │
                    │    Rate Limit, MIME)  │
                    └──────────┬──────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
    ┌─────────┴──────┐  ┌─────┴──────┐  ┌──────┴───────┐
    │ Code Quality   │  │  Testing   │  │   DevOps     │
    │ Agent          │  │  Agent     │  │   Agent      │
    │ (DRY, Types,   │  │ (Coverage, │  │ (CI, Hooks,  │
    │  File Size)    │  │  Flows)    │  │  Audit, RUM) │
    └────────────────┘  └────────────┘  └──────────────┘
```

---

## Teil 5: Projekt-Setup-Checkliste (Tag 1)

Wenn dieses Dokument vor Projektbeginn existiert haette, waere diese
Checkliste am ersten Tag abgearbeitet worden:

```
☐ Next.js Projekt mit App Router + TypeScript strict
☐ Prisma Schema mit Connection Pool Konfiguration
☐ Auth-Middleware (NextAuth) mit Session-Handling
☐ Security Headers in proxy.ts/middleware.ts (CSP, HSTS, X-Frame-Options, ...)
☐ Rate Limiting Setup (Upstash Redis + In-Memory Fallback)
☐ Strukturiertes Logging (pino) — kein console.log
☐ Zentrale Validierung (validation.ts mit validateString, validateEmail, etc.)
☐ Zentrale Fehlermeldungen (error-messages.ts — eine Sprache, Deutsch)
☐ ESLint Konfiguration (no-explicit-any = error, no-console = warn)
☐ Husky Setup (pre-commit: lint-staged, pre-push: full tests)
☐ .env.example + .env.local.example
☐ .gitignore (*.sql, .env*, etc.)
☐ /api/health Endpoint
☐ Error Boundaries in Root Layout
☐ @vercel/analytics + @vercel/speed-insights
☐ @next/bundle-analyzer Konfiguration
☐ vitest.config.ts mit Coverage-Schwellen (global 30%, lib 50%)
☐ CONCEPT.md mit Feature-Status-Tracking
☐ AGENTS.md mit allen Regeln dieses Dokuments
```

---

## Teil 6: Metriken & Erfolgskontrolle

| Metrik | Schwellenwert | Pruefung |
|--------|---------------|----------|
| TypeScript Errors | 0 | `tsc --noEmit` |
| ESLint Errors + Warnings | 0 | `eslint src/ --max-warnings 0` |
| Unit Tests | 100% bestanden | `npm test` |
| Coverage (global) | >= 30% | vitest coverage |
| Coverage (lib/) | >= 50% | vitest coverage |
| npm audit (prod) | 0 high/critical | `npm audit --omit=dev` |
| API-Route-Testabdeckung | >= 1 Test/Methode | Manuell pruefen |
| Dateien > 400 Zeilen | 0 | Automatisierbar |
| `any` Types | 0 | ESLint |
| `include: { user: true }` | 0 | `grep` |
| `dangerouslySetInnerHTML` | 0 | `grep` |
| `console.log` (Server) | 0 | `grep` |
| Security Check | 0 Fehler | `npm run security-check` |
| Review Evaluator | >= 9.0/10 | `npm run review-evaluate` |
| Bundle Size (max Chunk) | < 500KB | Bundle Analyzer |

---

*Erstellt am 2026-03-24 basierend auf der Analyse von 105 Findings aus 2 Review-Zyklen.*
*Dieses Dokument ist die konsolidierte Referenz fuer alle Agenten-Regeln und den Entwicklungsprozess.*
