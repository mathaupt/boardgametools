---
name: bill-of-materials
description: Technologie-Inventar und Abhaengigkeits-Verwaltung – Dokumentiert alle Frameworks, Libraries, Services und deren Versionen. Definiert Regeln fuer Updates, Lizenz-Compliance und den Bewertungsprozess neuer Abhaengigkeiten.
metadata:
  author: BoardGameTools Team
  version: "1.0"
---

# Bill of Materials (BOM) -- Technologie-Inventar

## Grundsaetze

### Warum ein BOM wichtig ist

1. **Sicherheitsgrundlage**: Bei einem CVE muss sofort klar sein, ob das Projekt betroffen ist.
2. **Lizenz-Compliance**: Inkompatible Lizenzen (GPL, AGPL) koennen rechtliche Probleme verursachen.
3. **Update-Planung**: Versionsstande ermoeglichen systematische Update-Zyklen.
4. **Onboarding**: Neue Teammitglieder verstehen sofort den Tech-Stack.
5. **Audit-Faehigkeit**: Technologie-Inventar kann sofort vorgelegt werden.

### Regeln

- Jede neue Abhaengigkeit MUSS vor der Installation im BOM dokumentiert werden
- Abhaengigkeiten ohne klaren Zweck werden abgelehnt
- Doppelte Funktionalitaet ist nicht erlaubt
- Dev-Dependencies gehoeren NICHT in Produktions-Dependencies (`--save-dev`)

---

## Tech-Stack Zusammenfassung

| Gruppe | Kern-Packages | Weitere | Lizenzen |
|--------|--------------|---------|----------|
| Framework | `next` ^16, `react` 19, `react-dom` 19 | -- | MIT |
| Datenbank | `@prisma/client` ^5, `prisma` ^5, `pg` ^8 | -- | Apache-2.0, MIT |
| Auth & Sicherheit | `next-auth` ^5-beta, `bcryptjs` ^3 | `@upstash/ratelimit` | ISC, MIT |
| UI-Komponenten | `@radix-ui/*`, `lucide-react` | `clsx`, `cva`, `tailwind-merge` | MIT, ISC |
| Infrastruktur | `@upstash/redis`, `@vercel/blob`, `pino` | `nodemailer`, `@vercel/speed-insights` | MIT, Apache-2.0 |
| Spezial-Features | `recharts` ^3, `tesseract.js` ^7 | `html5-qrcode` | MIT, Apache-2.0 |
| Styling | `tailwindcss` ^4, `shadcn` | `tw-animate-css` | MIT |
| Testing | `vitest` ^4, `playwright` ^1 | `codeceptjs`, `@testing-library/*` | MIT, Apache-2.0 |
| Build & Lint | `typescript` ^5, `eslint` ^9 | `husky`, `@next/bundle-analyzer` | Apache-2.0, MIT |

> **27 Prod- + 26 Dev-Dependencies.** Vollstaendige Liste mit Versionen: `docs/bill-of-materials/`

### Risiko-Dependencies

| Package | Risiko | Begruendung |
|---------|--------|-------------|
| `next-auth` ^5.0.0-beta.30 | Beta | Kein Stable Release, bewusstes Risiko |
| `tesseract.js` ^7 | Bundle-Groesse | ~5 MB WASM, nur per `await import()` |
| `html5-qrcode` ^2 | Bundle-Groesse | ~300 KB, nur per `await import()` |
| `recharts` ^3 | Bundle-Groesse | ~180 KB, nur per `next/dynamic` |

---

## Infrastruktur und Services

| Service | Zweck | Konfiguration | Kosten-Modell |
|---------|-------|---------------|---------------|
| **Vercel** | Hosting, Deployment, Edge | `vercel.json`, GitHub | Free/Pro |
| **Prisma Postgres** | Managed PostgreSQL | `DATABASE_URL` | Free/Scale |
| **Upstash Redis** | Cache, Rate Limiting | `UPSTASH_REDIS_REST_*` | Free/Pay-per-Request |
| **Vercel Blob** | Datei-Uploads | `BLOB_READ_WRITE_TOKEN` | Free/Pay-per-Storage |
| **SMTP** | E-Mail-Zustellung | `SMTP_*` | Anbieter-abhaengig |
| **BGG API** | Spieldaten-Import | Kein Key erforderlich | Kostenlos |

---

## Technologie-Entscheidungen

### Next.js (App Router, v16)

**Warum:** Server Components, App Router, API Routes, Vercel-Integration, Image/Font Optimization.
**Alternativen evaluiert:** Remix (kleineres Oekosystem), Vite+Express (mehr Boilerplate), SvelteKit (kein React-Oekosystem).

### Prisma (ORM, v5)

**Warum:** Typsicherer DB-Zugriff, deklaratives Schema, automatische Migrationen, Prisma Studio.
**Alternativen evaluiert:** Drizzle (weniger ausgereift), Knex (zu niedrig-level), TypeORM (schlechtere TS-Integration).

### Tailwind CSS (v4)

**Warum:** Utility-First, JIT-Kompilierung, konsistentes Design-System, shadcn/ui-Integration.
**Alternativen evaluiert:** CSS Modules, styled-components (Runtime-Overhead), Vanilla Extract.

### shadcn/ui + Radix

**Warum:** Kopiert ins Projekt (kein Lock-in), WAI-ARIA konform, vollstaendig anpassbar, TypeScript-native.

### Upstash Redis

**Warum:** HTTP-basiert (Serverless-kompatibel), Pay-per-Request, eingebautes Rate-Limiting-SDK.

### Vitest

**Warum:** Native ESM, Jest-kompatible API, Vite-basiert, schnelle Ausfuehrung, eingebaute Coverage.

### Pino

**Warum:** Strukturiertes JSON-Logging, <1ms pro Eintrag, Log-Levels, Vercel-kompatibel.

---

## Update-Policy

### Regelmaessige Updates

| Frequenz | Scope | Verantwortung |
|----------|-------|---------------|
| Woechentlich | `npm audit`, Patch-Updates | Entwickler |
| Monatlich | Minor-Updates evaluieren | Entwickler |
| Quartalsweise | Major-Updates planen | Team |
| Sofort | Kritische CVEs (CVSS >= 7.0) | Alle |

### Update-Prozess

1. `npm outdated` ausfuehren, Changelog lesen
2. Breaking Changes identifizieren
3. Update + `npm run build && npm run test`
4. BOM aktualisieren
5. PR erstellen mit Begruendung

### Pinning-Strategie

- **Exakt:** `react`, `react-dom` (muessen synchron sein)
- **Caret (`^`):** Alle anderen Packages
- **Beta:** `next-auth@5.0.0-beta.30` (bewusstes Risiko)

---

## Lizenz-Compliance

### Erlaubte Lizenzen (Greenlist)

MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD, Unlicense, CC0-1.0

### Verbotene Lizenzen (Blocklist)

GPL-2.0, GPL-3.0, AGPL-3.0, SSPL, CC-BY-NC, EUPL

### Pruefung

```bash
npm info <package-name> license
npx license-checker --summary
npx license-checker --failOn "GPL-2.0;GPL-3.0;AGPL-3.0;SSPL"
```

### Aktueller Status

Alle Dependencies verwenden ausschliesslich Lizenzen aus der Greenlist. Keine Verstoesse.

---

## Bewertungsprozess fuer neue Abhaengigkeiten

### Bewertungsmatrix

| Kriterium | Akzeptabel | Grenzwertig | Abgelehnt |
|-----------|------------|-------------|-----------|
| Bundle-Groesse | <50KB | 50-200KB | >200KB (ohne Lazy Loading) |
| Letztes Update | <3 Monate | 3-12 Monate | >12 Monate |
| Downloads/Woche | >100K | 10K-100K | <10K |
| Transitive Deps | <10 | 10-30 | >30 |
| Lizenz | Greenlist | -- | Blocklist |
| Bekannte CVEs | 0 | Patches verfuegbar | Ungepatcht |

---

## Regelmaessiger BOM-Review

### Zeitplan

| Intervall | Aktion |
|-----------|--------|
| Bei jedem PR | `npm audit` automatisch |
| Monatlich | `npm outdated` pruefen |
| Quartalsweise | Vollstaendiger BOM-Review |
| Jaehrlich | Strategische Bewertung |

### Review-Befehle

```bash
npm outdated --long
npm audit
npx depcheck
npx license-checker --summary
ANALYZE=true npm run build
npm ls --depth=0
```

---

## Checkliste

### Bei Aenderung an Dependencies

- [ ] Im BOM dokumentiert
- [ ] Lizenz auf Greenlist
- [ ] `npm audit` clean
- [ ] Bundle-Groesse geprueft
- [ ] `npm run build` erfolgreich
- [ ] `npm run test` erfolgreich
- [ ] Dev-Dependency korrekt mit `--save-dev`
- [ ] Keine doppelte Funktionalitaet

### Beim quartalsweisen Review

- [ ] `npm outdated --long` dokumentiert
- [ ] `npm audit` clean
- [ ] `npx depcheck` -- keine ungenutzten Dependencies
- [ ] Lizenzen geprueft
- [ ] Bundle-Analyse durchgefuehrt
- [ ] Versionsnummern aktuell
- [ ] Beta-Dependencies auf Stable geprueft
