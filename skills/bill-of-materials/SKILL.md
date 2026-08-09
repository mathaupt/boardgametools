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
| Framework | `next` ^16.3.0, `react` 19.2.8, `react-dom` 19.2.8 | -- | MIT |
| Datenbank | `@prisma/client` ^7.9.1, `prisma` ^7.9.1, `pg` ^8.23.0, `@prisma/adapter-pg` ^7.9.1 | -- | Apache-2.0, MIT |
| Auth & Sicherheit | `next-auth` ^5.0.0-beta.32, `bcryptjs` ^3.0.3 | `@upstash/ratelimit` ^2.0.8, `@upstash/redis` ^1.38.2 | ISC, MIT |
| UI-Komponenten | `radix-ui` ^1.6.7, `lucide-react` ^1.30.0 | `clsx` ^2.1.1, `class-variance-authority` ^0.7.1, `tailwind-merge` ^3.6.0 | MIT, ISC |
| Infrastruktur | `@vercel/blob` ^2.7.0, `@vercel/analytics` ^2.0.1, `@vercel/speed-insights` ^2.0.0, `pino` ^10.3.1 | `nodemailer` ^9.0.5 | MIT, Apache-2.0 |
| Spezial-Features | `recharts` ^3.10.1, `tesseract.js` ^7.0.0 | `html5-qrcode` ^2.3.8, `swagger-ui-react` ^5.32.12 | MIT, Apache-2.0 |
| Styling | `tailwindcss` ^4.3.3, `@tailwindcss/postcss` ^4.3.3, `shadcn` ^4.16.2 | `tw-animate-css` ^1.4.0 | MIT |
| Testing | `vitest` ^4.1.10, `playwright` ^1.62.1, `@vitejs/plugin-react` ^6.0.2 | `codeceptjs` ^4.1.0, `@testing-library/*`, `jsdom` ^29.1.1, `jest-axe` ^11.0.0 | MIT, Apache-2.0 |
| Build & Lint | `typescript` ^6.0.3, `eslint` ^9.39.5, `eslint-config-next` 16.3.0 | `husky` ^9.1.7, `@next/bundle-analyzer` ^16.3.0, `lint-staged` ^16.4.0 | Apache-2.0, MIT |

> **28 Prod-Dependencies + 31 Dev-Dependencies.** Vollstaendige Liste: `package.json` und `package-lock.json`. Snapshot-Dokumentation: `docs/bill-of-materials/`

### Risiko-Dependencies

| Package | Risiko | Begruendung |
|---------|--------|-------------|
| `next-auth` ^5.0.0-beta.32 | Beta | Kein Stable Release, bewusstes Risiko |
| `swagger-ui-react` ^5.32.12 | Transitive CVE | Haelt `js-yaml@4.3.0` fest (CVE-2026-59870); keine gepatchte 4.x/5.x verfuegbar |
| `@ai-sdk/provider-utils` (via `codeceptjs` -> `ai`) | Transitive CVE | Haelt `undici@5.x` fest; E2E-only, nicht im Produktiv-Runtime-Pfad |
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

1. Vor dem Update: `npm run review-evaluate:report` als Baseline speichern
2. `npm outdated` ausfuehren, Changelogs lesen
3. Breaking Changes identifizieren (insb. Prisma, Next.js, React, Tailwind, TypeScript, ESLint)
4. Updates in `package.json` eintragen
5. `npm install` ausfuehren (`.npmrc` setzt `legacy-peer-deps=true`)
6. `npm run typecheck` ausfuehren (kritisch bei TS-Major-Updates)
7. `npm run lint`, `npm run test`, `npm run build` ausfuehren
8. `npm audit` pruefen; bekannte Rest-CVEs in Risiko-Dependencies dokumentieren
9. BOM, AGENTS.md und zugehoerige Skills aktualisieren
10. Changelog-Eintrag schreiben und PR erstellen

### Pinning-Strategie

- **Exakt:** `react`, `react-dom` (muessen synchron sein)
- **Caret (`^`):** Alle anderen Packages
- **Beta:** `next-auth@5.0.0-beta.32` (bewusstes Risiko)
- **Overrides:** `package.json` enthaelt gezielte `overrides`, um CVEs in transitiven Dependencies zu beheben, ohne Packages auf breaking Major-Versionen zu zwingen

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
