---
name: architecture
description: Architektur-Referenz fuer BoardGameTools – Schichtenarchitektur, Datenfluss, Datenbankmodell, API-Design, Sicherheit, Deployment. Nutze diesen Skill fuer Architekturentscheidungen, Code-Organisation und System-Verstaendnis.
metadata:
  author: BoardGameTools Team
  version: "1.0"
---

# Architektur-Skill -- BoardGameTools

## Wann diesen Skill verwenden

- Bei Architekturentscheidungen (wo gehoert neuer Code hin?)
- Zum Verstaendnis des Gesamtsystems und der Schichtenarchitektur
- Bei der Analyse von Abhaengigkeiten zwischen Modulen
- Fuer Deployment- und Infrastrukturfragen
- Bei der Planung neuer Features (welche Schichten sind betroffen?)
- Fuer Code Reviews mit Architektur-Fokus

---

## Systemuebersicht

| Aspekt | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router, Turbopack dev, Webpack prod) |
| Laufzeit | Node.js / Vercel Serverless |
| Datenbank | PostgreSQL via Prisma ORM (Prisma Postgres) |
| Auth | NextAuth.js v5 (Credentials Provider) |
| Frontend | React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons |
| Charts | Recharts (lazy-loaded) |
| Caching | Redis (@upstash/redis) |
| Rate Limiting | @upstash/ratelimit (Redis-basiert) |
| File Storage | @vercel/blob + lokaler Fallback |
| Logging | Pino (strukturiert) + API-Logging in DB |
| Deployment | Vercel (Serverless Functions) |

---

## 1. Schichtenarchitektur

### Schicht 1: Client (Browser / React UI)

| Aspekt | Detail |
|--------|--------|
| Verantwortung | Darstellung, Benutzerinteraktion, clientseitige Validierung |
| Technologien | React 19, Tailwind CSS 4, shadcn/ui, Lucide Icons, Recharts |
| Kommunikation | HTTP-Requests an Route Handlers via `fetch` |

**Verzeichnisstruktur:**

```
src/
  components/
    ui/              -- shadcn/ui Basiskomponenten
    layout/          -- Layout-Komponenten (Header, Sidebar)
    admin/           -- Admin-spezifische Komponenten
    public-event/    -- Public-Event-Subkomponenten (6 Dateien)
```

### Schicht 2: Next.js (App Router / Server / Route Handlers)

| Aspekt | Detail |
|--------|--------|
| Verantwortung | Routing, SSR/RSC, API-Endpunkte, Auth-Guard |
| Dateien | `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `route.ts` |
| Auth-Guard | `src/proxy.ts` (NextAuth-basierter Middleware-Ersatz) |

**Route Groups:**

```
src/app/
  (auth)/            -- Oeffentlich: Login, Register, PW-Reset, Terms, Privacy
  (dashboard)/       -- Geschuetzt: Alle App-Seiten (Games, Events, Sessions, Groups, Series, Stats, Admin)
  api/               -- REST-API-Endpunkte (~50 Routes)
  public/            -- Oeffentliche Event/Gruppen-Seiten
```

### Schicht 3: Business-Logik (src/lib/)

| Aspekt | Detail |
|--------|--------|
| Verantwortung | Geschaeftslogik, Validierung, Auth, externe Integrationen |
| Dateien | 22 Module in `src/lib/` |
| Prinzip | Kein Framework-Import, reine Logik, testbar |

**Moduluebersicht (22 Dateien):**

| Modul | Datei | Verantwortung |
|-------|-------|---------------|
| Auth | `auth.ts` | NextAuth v5 Konfiguration, Session-Management |
| Datenbank | `db.ts` | Prisma-Client Singleton |
| Validierung | `validation.ts` | Input-Validierung (String, Number, Email, URL, Date, Enum) |
| Rate Limiting | `rate-limit.ts` | Redis-basiertes Rate Limiting |
| Caching | `cache.ts` | Cache-Layer (unstable_cache) |
| API Logging | `api-logger.ts` | Request/Response-Logging in DB |
| BGG | `bgg.ts` | BoardGameGeek XML-API |
| E-Mail | `mailer.ts` | nodemailer SMTP-Versand |
| Storage | `storage.ts` | @vercel/blob + lokaler Fallback |
| Kryptografie | `crypto.ts` | Token-Generierung |
| Logging | `logger.ts` | Pino JSON-Logging |
| ENV | `env.ts` | Umgebungsvariablen-Validierung |
| Utilities | `utils.ts` | cn(), formatDate() |
| Event-Sharing | `event-share.ts` | Oeffentliche Event-Links |
| Group-Sharing | `group-share.ts` | Oeffentliche Gruppen-Links |
| Public Event | `public-event.ts` | Logik fuer oeffentliche Events |
| Public Link | `public-link.ts` | Link-Generierung/Validierung |
| PW-Reset | `password-reset.ts` | Token-basierter Reset-Flow |
| Admin | `admin-create.ts` | Admin-Benutzer erstellen |
| Changelog | `changelog.ts` | Release Notes |
| FAQ | `faq.ts` | FAQ-Inhalte |
| Queries | `queries/pending-invites.ts` | Wiederverwendbare Prisma-Queries |

### Schicht 4: Daten (Prisma / PostgreSQL / Redis / Blob)

| Aspekt | Detail |
|--------|--------|
| ORM | Prisma mit 27 Modellen |
| Datenbank | PostgreSQL (Prisma Postgres) |
| Cache | Redis (Upstash) |
| Datei-Storage | @vercel/blob + `public/uploads/` Fallback |

---

## 2. Datenfluss

### Request-Lebenszyklus

1. **Browser** sendet HTTP Request
2. **proxy.ts** prueft Session (NextAuth)
3. Nicht authentifiziert -> 401 / Redirect /login
4. Admin-Route ohne ADMIN-Rolle -> 403
5. **Route Handler** empfaengt Request
6. **Rate Limiting** prueft Limit (Redis)
7. **Validierung** prueft Input
8. **Cache** wird geprueft (GET-Requests)
9. Bei Cache-Miss: **Prisma Query** an PostgreSQL
10. **API-Log** wird geschrieben
11. **JSON Response** an Browser

### Datenfluss nach Operationstyp

**Lesend (GET):** Browser -> proxy.ts -> Route Handler -> Rate Limit -> Cache -> Prisma -> Response
**Schreibend (POST/PUT/DELETE):** Browser -> proxy.ts -> Route Handler -> Rate Limit -> Validierung -> Prisma ($transaction) -> Cache invalidieren -> Response

---

## 3. Datenbankmodell (27 Modelle)

### Modell-Gruppierung

| Bereich | Modelle | Beschreibung |
|---------|---------|--------------|
| User & Auth | `User`, `PasswordResetToken` | Benutzerverwaltung, Rollen (USER/ADMIN) |
| Spiele | `Game`, `Tag`, `GameTag` | Spielesammlung mit Tags, BGG-Verknuepfung |
| Sitzungen | `GameSession`, `SessionPlayer`, `SessionRating` | Spielsitzungen mit Teilnehmern, Scores |
| Gruppen | `Group`, `GroupMember`, `GroupPoll`, `GroupPollOption`, `GroupPollVote`, `GroupComment` | Spielgruppen mit Umfragen |
| Events & Voting | `Event`, `EventInvite`, `GameProposal`, `Vote`, `GuestParticipant`, `GuestVote` | Spielabende mit Abstimmung |
| Terminplanung | `DateProposal`, `DateVote`, `GuestDateVote` | Doodle-artige Terminabstimmung |
| Spielereihen | `GameSeries`, `GameSeriesEntry` | Spielereihen mit Fortschritt |
| Dateien | `Upload` | Datei-Uploads |
| Monitoring | `ApiLog` | API-Request-Logging |

### Wichtige Constraints

- 13 `@@unique`-Constraints (z.B. eine Stimme pro User pro Vorschlag)
- 17 `@@index`-Definitionen auf Foreign Keys
- Cascading Deletes auf allen Relationen (Ausnahme: GroupPollVote/GroupComment nutzen SetNull)

---

## 4. API-Architektur (~50 Routes)

### Oeffentliche API (kein Auth)

| Bereich | Routes | Beschreibung |
|---------|--------|--------------|
| Auth | `/api/auth/*` | NextAuth, Register, PW-Reset |
| Public | `/api/public/*` | Token-basierte oeffentliche Endpunkte |
| BGG | `/api/bgg/*` | BoardGameGeek-Suche |
| Health | `/api/health` | Health-Check |

### Geschuetzte API (Auth erforderlich)

| Bereich | Routes | Beschreibung |
|---------|--------|--------------|
| Games | `/api/games/*` | CRUD, Import, Bulk-Delete |
| Sessions | `/api/sessions/*` | CRUD, Bewertungen |
| Events | `/api/events/*` | CRUD, Voting, Dates, Invites, Share |
| Groups | `/api/groups/*` | CRUD, Polls, Comments, Members |
| Series | `/api/series/*` | CRUD, Entries |
| Tags | `/api/tags` | CRUD |
| Upload | `/api/upload` | Datei-Upload |
| Statistics | `/api/statistics` | Statistiken |

### Admin API (ADMIN-Rolle)

| Bereich | Routes | Beschreibung |
|---------|--------|--------------|
| Monitoring | `/api/admin/monitoring/*` | Logs, Stats, Anomalien |
| Users | `/api/admin/users/*` | Verwaltung, PW-Aendern |

### Auth-Flow

```
Request -> proxy.ts -> Session vorhanden?
  Nein -> 401/Redirect
  Ja -> Admin-Route?
    Nein -> Route Handler
    Ja -> Rolle=ADMIN?
      Nein -> 403
      Ja -> Route Handler
```

### Error-Response-Format

```typescript
{ error: "Beschreibung" }  // 400, 401, 403, 404, 500
```

---

## 5. State Management

Kein clientseitiges State-Framework (kein Redux/Zustand). Server-first-Ansatz:

| State-Typ | Methode | Beispiel |
|-----------|---------|---------|
| Server-Daten | React Server Components | Dashboard-Seiten laden direkt per Prisma |
| URL State | `useSearchParams` | `?page=2&sort=name` |
| Formular-State | `useState` | Spiel erstellen/bearbeiten |
| UI State | `useState` | Sidebar, Dialog |
| Async State | `fetch` + `useEffect` | BGG-Suche |
| Cache-Invalidierung | `router.refresh()` | Nach CRUD-Operationen |

---

## 6. Sicherheitsarchitektur

| Massnahme | Implementierung | Datei |
|-----------|----------------|-------|
| Passwort-Hashing | bcrypt (12 Rounds) | `auth.ts` |
| Auth Guard | NextAuth v5 Pattern | `proxy.ts` |
| Rate Limiting | @upstash/ratelimit | `rate-limit.ts` |
| Input-Validierung | Zentrale validation.ts | `validation.ts` |
| CSRF-Schutz | NextAuth Built-in | NextAuth |
| Security Headers | CSP, X-Frame-Options | `next.config.ts` |
| Token-Hashing | Share/Reset-Tokens gehasht | `crypto.ts` |
| SQL Injection | Prisma parametrized queries | Prisma ORM |
| XSS | React auto-escaping | React |
| Sensitive Data | `select` statt `include` | Alle API-Routes |
| PII in Logs | Keine personenbezogenen Daten | `api-logger.ts` |
| ENV-Validierung | Pruefung beim Start | `env.ts` |
| Debug-Routes | NODE_ENV Guard | Debug-API |

---

## 7. Deployment-Architektur

### Umgebungen

| Umgebung | Branch | URL |
|----------|--------|-----|
| Production | `main` | boardgametools.vercel.app |
| Preview | Feature-Branches | automatisch generiert |
| Development | -- | localhost:3000 |

### Services

| Komponente | Dienst |
|------------|--------|
| Hosting | Vercel (Auto-Deploy bei Push) |
| Datenbank | Prisma Postgres |
| Cache | Upstash Redis |
| Blob Storage | Vercel Blob |
| E-Mail | SMTP (konfigurierbar) |

### Build-Pipeline

```
git push main -> Vercel Build
  npm install -> prisma generate -> next build (Webpack)
  -> Serverless Functions + Static Assets auf CDN
```

---

## 8. Bewertungsprozess

Bei signifikanten Architektur-Aenderungen:

1. Aenderung beschreiben (was und warum)
2. Betroffene Schichten identifizieren
3. Abhaengigkeiten pruefen
4. Konsistenz mit bestehenden Patterns sicherstellen
5. Sicherheitsauswirkungen bewerten
6. Performance-Auswirkungen analysieren
7. In `docs/architecture/` dokumentieren

---

## 9. Checkliste: Architektur-Review

### Schichtenarchitektur

- [ ] Keine direkte DB-Abfrage aus Komponenten
- [ ] Keine Geschaeftslogik in Route Handlers (ausgelagert in lib/)
- [ ] Client Components nur wo noetig
- [ ] `src/lib/` Module sind Framework-unabhaengig und testbar

### API-Design

- [ ] Alle geschuetzten Endpunkte durch proxy.ts abgesichert
- [ ] Input-Validierung auf allen POST/PUT/PATCH
- [ ] Konsistentes Error-Response-Format
- [ ] Pagination auf Listen-Endpunkten
- [ ] Rate Limiting auf oeffentlichen/Auth-Endpunkten

### Datenbank

- [ ] Alle Relationen mit `onDelete` definiert
- [ ] Indizes auf Foreign Keys
- [ ] `select` statt `include` bei User-Queries
- [ ] `$transaction` fuer zusammenhaengende Mutationen
- [ ] Unique Constraints fuer Geschaeftsregeln

### Sicherheit

- [ ] Passwoerter bcrypt-gehasht
- [ ] Security Headers konfiguriert
- [ ] Rate Limiting auf Auth-Endpunkten
- [ ] ENV-Variablen beim Start validiert
- [ ] Keine PII in Logs

### Performance

- [ ] Redis-Cache fuer haeufig gelesene Daten
- [ ] Schwere Libraries lazy-loaded
- [ ] Bilder optimiert via next/image
- [ ] Loading States (loading.tsx)

### Schnellreferenz: Wo gehoert was hin?

| Aufgabe | Ort |
|---------|-----|
| Neue Seite | `src/app/(dashboard)/dashboard/[feature]/page.tsx` |
| API-Endpunkt | `src/app/api/[bereich]/route.ts` |
| Geschaeftslogik | `src/lib/[modul].ts` |
| UI-Komponente | `src/components/ui/[name].tsx` |
| Feature-Komponente | `src/components/[feature]/[name].tsx` |
| Prisma-Modell | `prisma/schema.prisma` |
| Shared DB-Query | `src/lib/queries/[name].ts` |
| Tests | `tests/unit/lib/[modul].test.ts` |
