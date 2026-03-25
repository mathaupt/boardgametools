---
name: performance
description: Verwende diesen Skill bei allen Fragen zur Performance-Optimierung, Bundle-Groesse, Ladezeiten, Caching, Datenbankabfragen und Core Web Vitals der BoardGameTools-Anwendung.
metadata:
  author: boardgametools
  version: "1.0"
---

# Performance Skill

> Dieses Dokument definiert verbindliche Regeln und Checklisten fuer die Performance-Optimierung
> der BoardGameTools Next.js-Anwendung. Alle Entwickler muessen diese Vorgaben bei jeder
> Aenderung beruecksichtigen.

## Wann diesen Skill verwenden

Verwende diesen Skill wenn der User:
- Performance-Probleme meldet oder Ladezeiten optimieren will
- Neue Seiten, API-Routen oder Datenbankabfragen hinzufuegt
- Bundle-Groesse analysieren oder reduzieren moechte
- Caching-Strategien implementieren oder ueberpruefen will
- Loading States oder Skeleton Screens benoetigt
- Datenbankindizes oder Prisma-Abfragen optimieren moechte
- Core Web Vitals oder Lighthouse-Scores verbessern will

---

## 1. Grundsaetze

Jede Aenderung am Code muss die folgenden Performance-Zielwerte einhalten. Diese orientieren sich
an den Core Web Vitals von Google und den Anforderungen einer datenintensiven Brettspiel-Verwaltung.

### Zielwerte

| Metrik | Zielwert | Messung |
|--------|----------|---------|
| Largest Contentful Paint (LCP) | < 2,5 Sekunden | Lighthouse, Web Vitals |
| First Input Delay (FID) | < 100 Millisekunden | Lighthouse, Web Vitals |
| Cumulative Layout Shift (CLS) | < 0,1 | Lighthouse |
| Time to Interactive (TTI) | < 3,5 Sekunden | Lighthouse |
| First Contentful Paint (FCP) | < 1,8 Sekunden | Lighthouse |
| JavaScript-Bundle (First Load) | < 200 KB gzipped | Bundle Analyzer |
| API-Antwortzeit (p95) | < 500 Millisekunden | ApiLog-Auswertung |

### Regeln

- Performance ist kein nachtraegliches Feature, sondern wird bei jedem Commit mitgedacht
- Jede neue Abhaengigkeit muss auf ihre Bundle-Groesse geprueft werden (z.B. via bundlephobia.com)
- Schwere Bibliotheken (> 50 KB gzipped) muessen dynamisch importiert werden
- Server Components sind der Standard; `"use client"` nur bei tatsaechlicher Notwendigkeit

---

## 2. Bundle-Optimierung

### Dynamische Imports

Schwere Bibliotheken werden per `await import()` oder `next/dynamic` erst geladen, wenn sie
tatsaechlich benoetigt werden. Die folgenden Imports sind bereits konfiguriert und duerfen
**nicht** durch statische Imports ersetzt werden:

| Bibliothek | Datei | Methode | Ungefaehre Groesse |
|------------|-------|---------|---------------------|
| `recharts` | `src/app/(dashboard)/dashboard/admin/monitoring/monitoring-dashboard.tsx` | `dynamic()` mit `ssr: false` | ~180 KB gzipped |
| `tesseract.js` | `src/components/cover-scan-tab.tsx` | `await import()` | ~5 MB (WASM) |
| `html5-qrcode` | `src/components/barcode-scanner.tsx` | `await import()` | ~300 KB |
| `@upstash/ratelimit` | `src/lib/rate-limit.ts` | `await import()` | ~15 KB |
| `@upstash/redis` | `src/lib/rate-limit.ts` | `await import()` | ~20 KB |
| `@vercel/blob` | `src/lib/storage.ts` | `await import()` | ~10 KB |

### Regeln fuer neue Imports

```typescript
// FALSCH: Statischer Import einer schweren Bibliothek
import { BarChart, LineChart } from "recharts";

// RICHTIG: Dynamischer Import mit next/dynamic (fuer Komponenten)
import dynamic from "next/dynamic";

const StatistikChart = dynamic(
  () => import("@/components/statistik-chart").then(mod => mod.StatistikChart),
  {
    ssr: false,
    loading: () => <ChartSkeleton />,
  }
);

// RICHTIG: Dynamischer Import mit await import() (fuer Funktionen/Bibliotheken)
async function scanBarcode(videoElement: HTMLVideoElement) {
  const { Html5Qrcode } = await import("html5-qrcode");
  // ...
}
```

### @next/bundle-analyzer

Das Paket `@next/bundle-analyzer` ist als devDependency installiert. Analyse ausfuehren:

```bash
ANALYZE=true npm run build
```

### Tree Shaking

- Nur benannte Imports verwenden, keine Wildcard-Imports (`import * as ...`)
- Barrel-Dateien (`index.ts`) vermeiden, wenn sie grosse Module re-exportieren

```typescript
// FALSCH: Importiert moeglicherweise das gesamte Modul
import * as Icons from "lucide-react";

// RICHTIG: Nur das benoetigte Icon importieren
import { Search } from "lucide-react";
```

---

## 3. Server-Side Performance

### Pagination

**Pflicht:** Alle Listen-Endpoints muessen paginiert sein. Unbegrenzte Ergebnismengen sind verboten.

```typescript
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page")) || DEFAULT_PAGE);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE)
  );

  const [items, total] = await prisma.$transaction([
    prisma.game.findMany({
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    }),
    prisma.game.count(),
  ]);

  return Response.json({
    data: items,
    pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
```

### Datenbankabfrage-Optimierung

| Regel | Beschreibung |
|-------|-------------|
| `select` statt `include` | Nur benoetigte Felder abfragen, nicht ganze Relationen laden |
| N+1 vermeiden | Relationen mit `include` oder `select` in einer Abfrage laden, nicht in Schleifen |
| `$transaction` nutzen | Zusammengehoerige Abfragen als Transaktion ausfuehren |
| Ergebnisse begrenzen | Immer `take` setzen, nie unbegrenzte Abfragen |

```typescript
// FALSCH: N+1 Problem
const sessions = await prisma.gameSession.findMany();
for (const session of sessions) {
  const players = await prisma.sessionPlayer.findMany({
    where: { sessionId: session.id },
  });
}

// RICHTIG: Alles in einer Abfrage mit select
const sessions = await prisma.gameSession.findMany({
  take: 20,
  select: {
    id: true,
    playedAt: true,
    game: { select: { name: true, coverUrl: true } },
    players: {
      select: {
        user: { select: { name: true } },
        score: true,
        isWinner: true,
      },
    },
  },
});
```

---

## 4. Caching-Strategie

### Cache-Schicht (`src/lib/cache.ts`)

Die Anwendung stellt eine `cachedQuery`-Funktion bereit, die auf `unstable_cache` von Next.js basiert.

```typescript
import { cachedQuery } from "@/lib/cache";

const topGames = await cachedQuery(
  () => prisma.game.findMany({
    take: 10,
    orderBy: { sessions: { _count: "desc" } },
    select: { id: true, name: true, coverUrl: true },
  }),
  ["top-games", userId],
  { revalidate: 300, tags: ["games"] }
);
```

**Wichtig:** Die `cachedQuery`-Funktion ist derzeit in keiner Route eingebunden. Neue
datenlastige Routen muessen diese Funktion aktiv nutzen.

### Wann cachen

| Datentyp | Revalidierung | Begruendung |
|----------|---------------|-------------|
| Spieleliste eines Users | 60 Sekunden | Aendert sich selten |
| Statistik-Aggregationen | 300 Sekunden | Rechenintensiv |
| Gruppen-Mitgliederliste | 120 Sekunden | Aendert sich selten |
| Session-Details | 30 Sekunden | Kann aktualisiert werden |
| Event-Kalender-Export | 0 (kein Cache) | Muss immer aktuell sein |

### API-Response-Header

```typescript
// Statische oder selten geaenderte Daten
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
  },
});

// Benutzerspezifische Daten
return new Response(JSON.stringify(data), {
  headers: {
    "Content-Type": "application/json",
    "Cache-Control": "private, max-age=30",
  },
});
```

---

## 5. Client-Side Performance

### React Server Components als Standard

| Komponenten-Typ | Direktive | Verwendung |
|------------------|-----------|-----------|
| Server Component | Keine (Standard) | Datenabruf, Layout, statische Inhalte |
| Client Component | `"use client"` | Interaktive Formulare, Event-Handler, Browser-APIs, Hooks |

**Regel:** `"use client"` darf nur an der kleinstmoeglichen Komponente stehen, nicht an
uebergeordneten Layouts oder Seiten.

### Bilder

**Pflicht:** Alle Bilder muessen ueber `next/image` eingebunden werden. Rohe `<img>`-Tags
sind verboten.

```typescript
import Image from "next/image";

<Image
  src={game.coverUrl}
  alt={game.name}
  width={200}
  height={280}
  loading="lazy"
/>
```

---

## 6. Loading States

Die Anwendung hat 13 `loading.tsx`-Dateien fuer 41 Seiten.

### Regeln

- **Jede neue Route-Gruppe** muss eine `loading.tsx`-Datei erhalten
- Loading States muessen inhaltlich zum erwarteten Layout passen (Skeleton Screens)
- Schwere dynamische Imports muessen eine eigene `loading`-Prop erhalten

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-48 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

---

## 7. Datenbank-Performance

### Prisma-Indizes

17 `@@index`-Eintraege in `prisma/schema.prisma`. Jede neue Abfrage mit `where`- oder
`orderBy`-Klauseln auf nicht-indizierten Feldern muss einen Index erhalten.

| Modell | Index-Felder | Zweck |
|--------|-------------|-------|
| `Game` | `[ownerId]` | Spiele eines Users |
| `GameSession` | `[createdById]` | Sessions eines Users |
| `SessionPlayer` | `[sessionId]` | Spieler einer Session |
| `GroupMember` | `[userId]` | Gruppen eines Users |
| `Event` | `[createdById]` | Events eines Users |
| `Event` | `[eventDate]` | Events nach Datum |
| `ApiLog` | `[createdAt]` | Logs nach Zeitraum |
| `ApiLog` | `[createdAt, durationMs]` | Langsame Requests |
| `ApiLog` | `[path]` | Logs nach Endpoint |
| `ApiLog` | `[userId]` | Logs nach User |
| `ApiLog` | `[statusCode]` | Fehler-Analyse |

### Connection Pooling

- Prisma Client Singleton in `src/lib/db.ts`
- Connection Pool ueber Datasource-URL konfigurierbar
- Fuer Serverless: Prisma Accelerate

### Transaktionen

```typescript
const [session, players] = await prisma.$transaction([
  prisma.gameSession.create({ data: sessionData }),
  prisma.sessionPlayer.createMany({ data: playerData }),
]);
```

---

## 8. Monitoring

### API-Logging

API-Aufrufe werden im `ApiLog`-Modell mit Dauer-Tracking protokolliert.

### Bundle-Analyse

```bash
ANALYZE=true npm run build
```

### Entwicklungs-Server

| Befehl | Beschreibung |
|--------|-------------|
| `npm run dev` | Turbopack mit 4 GB Heap |
| `npm run build` | Produktions-Build mit Webpack |

---

## 9. Bewertungsprozess

Performance-Audits werden regelmaessig durchgefuehrt und in `docs/performance/` dokumentiert.

**Audit-Ablauf:**

1. Lighthouse-Audit auf den 5 wichtigsten Seiten
2. Bundle-Analyse mit `ANALYZE=true npm run build`
3. API-Antwortzeiten aus dem `ApiLog` auswerten
4. Ergebnisse dokumentieren

---

## 10. Checkliste fuer Code-Reviews

### Bundle und Imports

- [ ] Keine neuen statischen Imports von Bibliotheken ueber 50 KB gzipped
- [ ] Schwere Bibliotheken werden dynamisch importiert
- [ ] Keine Wildcard-Imports fuer grosse Module
- [ ] `next/dynamic` mit `loading`-Prop fuer schwere Komponenten

### Server Components und Client Code

- [ ] Neue Seiten sind standardmaessig Server Components
- [ ] `"use client"` nur an der kleinstmoeglichen Komponente
- [ ] Datenabruf erfolgt serverseitig

### Datenbankabfragen

- [ ] `select` statt `include` wo moeglich
- [ ] Kein N+1-Problem
- [ ] Alle Listen-Abfragen sind paginiert (`take` + `skip`)
- [ ] `$transaction` fuer zusammengehoerige Schreiboperationen
- [ ] Neuer Index wenn auf neuem Feld gefiltert/sortiert wird

### Caching

- [ ] `cachedQuery` fuer haeufig abgefragte Daten verwenden
- [ ] API-Routen mit passenden `Cache-Control`-Headern

### Bilder und Medien

- [ ] Alle Bilder verwenden `next/image`
- [ ] `width` und `height` explizit gesetzt

### Loading States

- [ ] Neue Route-Gruppen haben eine `loading.tsx`-Datei
- [ ] Skeleton Screens passen zum erwarteten Layout

### API-Routen

- [ ] Pagination auf allen Listen-Endpoints
- [ ] Antwortzeiten unter 500ms (p95)
