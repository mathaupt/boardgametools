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
