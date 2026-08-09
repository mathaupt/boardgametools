# Regressions-Log

Chronologisches Protokoll aller erkannten Regressions im Review-Prozess.
Jeder Eintrag enthält Felder für Root-Cause-Analyse und Gegenmaßnahmen (manuell auszufüllen).

---

## 2026-03-25 10:51:32

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| BP-51: Ungenutzte Dependencies in package.json | P3 | resolved | partially_resolved | Möglicherweise ungenutzt: react-is |

**Root-Cause:** `react-is` war als transitive Dependency von react-dom vorhanden, wurde aber durch npm update als direkte Dependency hinzugefügt.
**Gegenmaßnahme:** Regelmäßig `npm ls <pkg>` prüfen ob direkte Dependencies tatsächlich direkt importiert werden.
**Verantwortlich:** Devin (automatisiert)

---

## 2026-03-26 08:10:35

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| P1-15: Admin kann sich selbst deaktivieren | P1 | resolved → open | Keine Self-Protection |

**Root-Cause:** False Positive im Evaluator-Script. Der Guard existiert korrekt (`targetUserId === adminUserId`) in deactivate/route.ts und change-password/route.ts, aber der Evaluator suchte nach falschen String-Patterns (`session.user.id`, `eigenen`, `yourself`).
**Gegenmaßnahme:** Evaluator-Script (review-evaluate.mjs) P1-15 hasSelfCheck-Funktion um tatsächlich verwendete Patterns erweitert (`adminUserId`, `Eigenes`, `your own`).
**Verantwortlich:** Devin (automatisiert)

---

## 2026-03-26 09:46:25

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| BP-51: Ungenutzte Dependencies in package.json | P3 | resolved | partially_resolved | Möglicherweise ungenutzt: enhanced-resolve |

**Root-Cause:** `enhanced-resolve` wurde bei `npm update` irrtümlich als direkte Dependency aufgenommen, obwohl es nur eine transitive Dependency von @tailwindcss/node ist.
**Gegenmaßnahme:** `npm remove enhanced-resolve` ausgeführt. Package wird weiterhin transitiv über @tailwindcss bereitgestellt.
**Verantwortlich:** Devin (automatisiert)

---

## 2026-03-26 13:29:24

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| P2-18: any-Types im Code | P2 | resolved | partially_resolved | 1 any-Types verbleibend |

**Root-Cause:** <!-- Manuell ausfüllen: Warum ist das Finding zurückgekehrt? -->
**Gegenmaßnahme:** <!-- Manuell ausfüllen: Wie wird verhindert, dass es erneut passiert? -->
**Verantwortlich:** <!-- Manuell ausfüllen -->

---

## 2026-03-27 08:12:23

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | partially_resolved | 2 high nur in devDependencies |

**Root-Cause:** lint-staged Package hat brace-expansion als transitive devDependency eingebracht. Production: 0 high/critical.
**Gegenmaßnahme:** False Positive — npm audit --omit=dev --audit-level=high gibt exit 0.
**Verantwortlich:** Devin (automatisiert)

---

## 2026-03-27 10:32:05

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | 0 critical, 8 high, 30 moderate |

**Root-Cause:** <!-- Manuell ausfüllen: Warum ist das Finding zurückgekehrt? -->
**Gegenmaßnahme:** <!-- Manuell ausfüllen: Wie wird verhindert, dass es erneut passiert? -->
**Verantwortlich:** <!-- Manuell ausfüllen -->

---

## 2026-03-27 12:38:50

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| P2-18: any-Types im Code | P2 | resolved | open | 71 any-Types gefunden |
| SCALE-60: DB Connection Pooling nicht konfiguriert | P1 | resolved | open | Keine Connection Pool Konfiguration |

**Root-Cause:** <!-- Manuell ausfüllen: Warum ist das Finding zurückgekehrt? -->
**Gegenmaßnahme:** <!-- Manuell ausfüllen: Wie wird verhindert, dass es erneut passiert? -->
**Verantwortlich:** <!-- Manuell ausfüllen -->

---

## 2026-08-09 10:46:50

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | open | 2 critical, 26 high, 7 moderate |
| BP-51: Ungenutzte Dependencies in package.json | P3 | resolved | partially_resolved | Möglicherweise ungenutzt: @testing-library/dom |

**Root-Cause:** Massives Dependency-Update (Next.js, React, TypeScript 6, Prisma 7, Tailwind 4, Vitest 4, ESLint 9) hat npm audit Vulnerabilities von 35 auf 6 reduziert. Verbleibend: `swagger-ui-react` zwingt `js-yaml@4.3.0` (2 high, Produktion) und `codeceptjs` -> `ai` haelt `undici@5.x` (transitiv, nur Dev/E2E). Ein Patch ohne Breaking-Change ist nicht verfuegbar (js-yaml v5 aendert Export-API, swagger-ui-react hat keine kompatible Version). BP-51 (`@testing-library/dom`) ist ein False Positive — die Bibliothek wird in Komponenten-Tests indirekt benoetigt.
**Gegenmaßnahme:** 1) Monatlich `npm audit` und `npm outdated` pruefen. 2) Bei neuen `swagger-ui-react`-Versionen oder Alternativen (z.B. separate API-Docs-Seite ohne swagger-ui-react) evaluieren. 3) Bekannte Restrisiken in `skills/security/SKILL.md` und `skills/code-review/SKILL.md` (SEC-45) dokumentieren.
**Verantwortlich:** BoardGameTools Team

---
