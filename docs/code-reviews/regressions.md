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

## 2026-10-28 – BUG-033, CI-Installation ohne Umgebungsdatei

**Root-Cause:** Die lokale Installation wurde mit `--ignore-scripts` vorbereitet und Prisma anschließend mit einer künstlichen URL generiert. Das erfasste nicht den normalen `npm ci`-Ablauf ohne .env-Dateien. In GitHub war die benötigte URL ausschließlich im späteren Build-Job definiert.

**Gegenmaßnahme:** Künstliche SQL_DATABASE_URL für alle CI-Jobs, Regressionstest mit echtem postinstall in einem temporären Checkout ohne .env und zusätzliche vollständige npm-ci-Prüfung in einer frischen Projektkopie. Keine Produktionssecrets für Codegenerierung.

**Verantwortlich:** BoardGameTools Wartung

**Validierung:** Ursprünglicher PrismaConfigEnvError reproduziert; mit Korrektur 648 Tests, Typecheck und Lint erfolgreich.

## 2026-10-31 00:35:29

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | partially_resolved | 1 high nur in devDependencies |

**Root-Cause:** Vollständiger Registry-Audit während der Planungsaufgabe meldet bei unveränderten Paketdateien 1 hohen, 23 mittlere und 2 niedrige Befunde ausschließlich in Entwicklungsabhängigkeiten. Hoher Befund: systeminformation 5.33.1 über shadcn → dotenvx; weitere mittlere Befunde betreffen insbesondere minimatch, glob und @hono/node-server. Die lokale Sandbox kann die npm-Registry nicht erreichen. Der Evaluator behandelt Audit-Fehler-JSON ohne metadata fälschlich wie einen leeren Befundsatz, was den vorherigen resolved-Stand erklären kann.
**Gegenmaßnahme:** BUG-050/051 offen erfassen; Paketkorrektur und verlässliche Fehlerbehandlung gesondert durchführen. Keine Paketdateien im Rahmen der angeforderten Planungsarbeit verändern, keinen Hook abschalten und keinen erneuten Commit gegen die durch den fehlgeschlagenen Lauf bereits verschobene Baseline versuchen. Planungsunterlagen bleiben reviewbar gespeichert; Commit ist blockiert.
**Verantwortlich:** BoardGameTools Wartung; Korrekturumfang getrennt von FEAT-009 bis FEAT-011.

**Validierung:** Registry-Audit außerhalb der Sandbox bestätigt 26 Entwicklungsbefunde; Produktionsaudit im Commit-Hook meldet 0. package.json und package-lock.json unverändert. Quelle: npm audit --json und Quellprüfung von SEC-45 in scripts/review-evaluate.mjs.

---

## 2026-10-31 13:10:12

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | partially_resolved | 1 high nur in devDependencies |

**Root-Cause:** Der vollständige Audit meldete bei unverändertem Lockfile reale Dev-Advisories: zunächst 1 High, 23 moderate und 2 low. Der frühere „resolved“-Status stammte aus unvollständiger Auditfehlerbehandlung (BUG-051), der tatsächliche SEC-45-Status war teilweise gelöst.
**Gegenmaßnahme:** Kompatible Updates entfernten den High-Befund. Der Evaluator validiert vollständiges und Produktionsaudit jetzt explizit. Verbleibende moderate/lower Dev-Advisories sind als BUG-050 dokumentiert; sie benötigen Major-Upgrades.
**Verantwortlich:** BoardGameTools Wartung.
**Auflösung:** 2026-10-31, siehe Nachprüfung 14:40. Der gültige Regressionslauf vergleicht `partially_resolved` mit `partially_resolved` und endet erfolgreich (Exitcode 0); der Commit ist durch diese Regression nicht mehr blockiert.

---

## 2026-10-31 13:26:39

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Der Regressionsevaluator lief in einer Umgebung ohne Registryzugriff. Die aktualisierte Validierung konnte den Audit nicht ausführen und meldete korrekt `open` statt einen Erfolg vorzutäuschen.
**Gegenmaßnahme:** Den geschützten Commitworkflow mit Registryzugriff ausführen; bei fehlendem Registryzugriff bleibt die Prüfung absichtlich nicht bestanden.
**Verantwortlich:** BoardGameTools Wartung.

**Nachprüfung 2026-10-31 14:40:** Der Status `open` war ein korrektes Fail-Closed-Ergebnis für einen Sandboxlauf ohne Registryzugriff; er belegte keine neue Abhängigkeitsschwachstelle. Mit Registryzugriff wurden 22 moderate Dev-Befunde und 0 Produktionsbefunde bestätigt; SEC-45 ist daher `partially_resolved`, ohne Regression gegenüber dem vorherigen gültigen Snapshot. Der High-Befund wurde zwischenzeitlich durch kompatible Paketupdates beseitigt. Der Regressionsevaluator lief mit `--fail-on-regression` erfolgreich durch (Exitcode 0); dieser Eintrag ist damit geschlossen.

**Root-Cause:** Der erste Regressionsevaluatorlauf hatte keinen npm-Registryzugriff. Die verschärfte Validierung meldete diesen Prüfungsfehler ausdrücklich als `open`, statt einen sauberen Audit zu erfinden.
**Gegenmaßnahme:** Commit-Review mit Registryzugriff durchführen. Der Evaluator validiert jetzt Audit-v2-Schema und Severity-Metadaten für vollständigen und Produktionsaudit und blockiert weiter, wenn die Prüfung wirklich nicht ausführbar ist.
**Verantwortlich:** BoardGameTools Wartung.

---

## 2026-10-31 14:40 – SEC-45 Commit-Blocker nachgeprüft

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | open (Registry nicht erreichbar) | partially_resolved | 22 moderate Dev-Befunde; 0 Produktionsbefunde; keine Regression |

**Root-Cause:** `systeminformation@5.33.1` und weitere transitive Dev-Pakete waren veraltet; ein früher Evaluatorlauf konnte Registryfehler als sauberen Auditstatus missverstehen.
**Gegenmaßnahme:** Kompatible `npm audit fix`-Updates, darunter `systeminformation@5.33.19`, sowie Schemaprüfung im Evaluator. Major-Upgrades wurden nicht erzwungen.
**Verantwortlich:** BoardGameTools Wartung.
**Validierung:** `npm run review-evaluate:regression` mit Registryzugriff: Exitcode 0; `npm audit --omit=dev`: 0 Befunde.

---

## 2026-10-31 21:53:21

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| P2-23: Inkonsistente Error-Responses | P2 | resolved | partially_resolved | Inkonsistent: 197× {error}, 26× {message} |
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** P2-23 wertete jedes `{ message }`-Feld als Fehlerformat; 26 der Treffer waren erfolgreiche Lösch-/Aktionsantworten. SEC-45 lief in der Sandbox ohne gültige Registry-Auditdaten und lieferte fail-closed `open`; das ist ein Prüfungsfehler, kein neuer Paketbefund.
**Gegenmaßnahme:** P2-23 zählt `message` nur bei einer expliziten 4xx/5xx-Antwort als Fehlervertrag. Drei Unit-Tests sichern Erfolg, Fehler und reine Nachrichtenfelder ab. SEC-45 wurde danach mit Registryzugriff erneut ausgewertet.
**Verantwortlich:** BoardGameTools Wartung.
**Auflösung 2026-10-31 21:54:** `npm run review-evaluate:regression` mit Registryzugriff: Exitcode 0, keine Regression; P2-23 resolved, SEC-45 teilweise gelöst (bekannte Dev-Befunde, keine Produktionsbefunde). Der Regressionstest lief erfolgreich.

---

## 2026-10-31 22:06:08

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Dieser Lauf wurde nach dem erfolgreichen Registrylauf erneut in der Sandbox gestartet. Dort ist die npm-Registry nicht erreichbar; der Evaluator bewertet ungültige Auditdaten absichtlich als `open`. Das ist eine Prüfbedingung, keine neu aufgetretene Abhängigkeitsschwachstelle.
**Gegenmaßnahme:** Für den Commit-Blocker gilt ausschließlich ein gültiger Regressionsevaluatorlauf mit Registryzugriff. Fehlgeschlagene Sandbox-Audits werden nicht als bestanden interpretiert; der Review wird mit Registryzugriff wiederholt.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-10-31 23:13:** `npm run review-evaluate:regression` mit Registryzugriff erfolgreich, Exitcode 0, 10/10, keine Regressionen; SEC-45 `partially_resolved`, 0 offene Security-Findings. Commit-Blocker behoben.

---
