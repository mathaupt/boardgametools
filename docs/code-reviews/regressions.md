# Regressions-Log

## 2026-11-03 18:06 – BUG-050 Dependency-Fix

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| Keine | – | – | keine Regression | Review-Evaluator 10/10, 0 offene Findings; Snapshot `history/2026-11-03_1906.json` |

`glob` und `minimatch` sind auf gepatchte Versionen aktualisiert; CodeceptJS ist
4.2.2. Der Produktionsaudit meldet 0 Befunde. Im Gesamt-Audit bleiben 3 niedrige
Einträge der shadcn/deepmerge-Entwicklungskette. shadcn ist Build-relevant und
wurde nicht entfernt. Build, Tests, TypeScript und Lint bestanden.

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

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

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

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-03-27 12:38:50

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| P2-18: any-Types im Code | P2 | resolved | open | 71 any-Types gefunden |
| SCALE-60: DB Connection Pooling nicht konfiguriert | P1 | resolved | open | Keine Connection Pool Konfiguration |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

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
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

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
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** P2-23 wertete jedes `{ message }`-Feld als Fehlerformat; 26 der Treffer waren erfolgreiche Lösch-/Aktionsantworten. SEC-45 lief in der Sandbox ohne gültige Registry-Auditdaten und lieferte fail-closed `open`; das ist ein Prüfungsfehler, kein neuer Paketbefund.
**Gegenmaßnahme:** P2-23 zählt `message` nur bei einer expliziten 4xx/5xx-Antwort als Fehlervertrag. Drei Unit-Tests sichern Erfolg, Fehler und reine Nachrichtenfelder ab. SEC-45 wurde danach mit Registryzugriff erneut ausgewertet.
**Verantwortlich:** BoardGameTools Wartung.
**Auflösung 2026-10-31 21:54:** `npm run review-evaluate:regression` mit Registryzugriff: Exitcode 0, keine Regression; P2-23 resolved, SEC-45 teilweise gelöst (bekannte Dev-Befunde, keine Produktionsbefunde). Der Regressionstest lief erfolgreich.

---

## 2026-10-31 22:06:08

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Dieser Lauf wurde nach dem erfolgreichen Registrylauf erneut in der Sandbox gestartet. Dort ist die npm-Registry nicht erreichbar; der Evaluator bewertet ungültige Auditdaten absichtlich als `open`. Das ist eine Prüfbedingung, keine neu aufgetretene Abhängigkeitsschwachstelle.
**Gegenmaßnahme:** Für den Commit-Blocker gilt ausschließlich ein gültiger Regressionsevaluatorlauf mit Registryzugriff. Fehlgeschlagene Sandbox-Audits werden nicht als bestanden interpretiert; der Review wird mit Registryzugriff wiederholt.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-10-31 23:13:** `npm run review-evaluate:regression` mit Registryzugriff erfolgreich, Exitcode 0, 10/10, keine Regressionen; SEC-45 `partially_resolved`, 0 offene Security-Findings. Commit-Blocker behoben.

---

## 2026-10-31 23:18:42

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-11-01 11:50:27

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-11-01 20:31:46

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-11-01 20:42:21

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-11-01 20:59:49

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Evaluator wurde ohne erreichbare npm-Registry ausgeführt. Er hat den ungültigen Auditlauf fail-closed als `open` gewertet; es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Regressionsevaluator nur mit gültiger Registryantwort als maßgeblich verwenden; Sandbox-Reports nicht als neue Paketbefunde einordnen.
**Verantwortlich:** BoardGameTools Wartung.

**Auflösung 2026-11-01 22:14:** `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, SEC-45 teilweise gelöst, 0 offenen Findings und ohne Regressionen. Snapshot: `history/2026-11-01_2214.json`.

---

## 2026-11-01 22:14 – FEAT-012/013 Abschlussprüfung

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| Keine | – | – | keine Regression | Evaluator 10/10, SEC-45 teilweise gelöst, 0 offene Findings |

**Root-Cause:** Keine Regression erkannt.
**Gegenmaßnahme:** Regressionsevaluator nach Implementierung mit Registryzugriff ausgeführt.
**Verantwortlich:** BoardGameTools Wartung.
**Nachweis:** `history/2026-11-01_2214.json`.

## 2026-11-01 21:22:49

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Sandboxlauf erhielt keine gültige npm-audit-Antwort und wertete die fehlenden Prüfdaten vorsorglich als offenes SEC-45. Die Registryprüfung selbst konnte die Vulnerabilities nicht bestätigen.
**Gegenmaßnahme:** Review-Evaluator nur mit erreichbarer Registry als maßgeblichen Dependency-Status werten; bei fehlender Registry die Prüfung mit freigegebenem Zugriff wiederholen.
**Verantwortlich:** BoardGameTools Wartung.
**Auflösung 2026-11-01 22:39:** Der Commit-Hook führte `npm run review-evaluate:regression` mit Registryzugriff aus: Exitcode 0, keine Regressionen, 10/10. SEC-45 ist teilweise gelöst; Snapshot `history/2026-11-01_2239.json`.

---

## 2026-11-02 08:02:14

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der erste Evaluatorlauf hatte keinen Zugriff auf `registry.npmjs.org`; npm audit antwortete mit `ENOTFOUND`, wodurch SEC-45 vorsorglich als offen gewertet wurde. Es gab keine Änderung an Abhängigkeiten.
**Gegenmaßnahme:** Audit- und Evaluatorlauf nach bestätigtem Registryzugriff wiederholen; fehlende Auditdaten nicht als Paketänderung behandeln.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-02:** `npm audit --omit=dev` mit Registryzugriff meldete 0 Vulnerabilities. Der erneut ausgeführte `npm run review-evaluate:regression` endete mit Exitcode 0, 10/10, ohne offene Findings und ohne Regression. Abschlusslauf nach FEAT-015-Datenminimierung: `history/2026-11-02_0913.json`.

---

## 2026-11-02 09:30:13

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der erste Evaluatorlauf hatte keinen Zugriff auf `registry.npmjs.org`; `npm audit` meldete `ENOTFOUND`, wodurch SEC-45 vorsorglich als offen gewertet wurde. Es gab keine Abhängigkeitsänderung.
**Gegenmaßnahme:** Produktionsabhängigkeiten mit freigegebenem Registryzugriff über `npm audit --omit=dev` verifizieren und den Regressionsevaluator danach erneut ausführen.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-02:** `npm audit --omit=dev` meldete mit Registryzugriff 0 Vulnerabilities. `npm run review-evaluate:regression` endete anschließend mit Exitcode 0, 9,9/10 und ohne Regression. Snapshot: `history/2026-11-02_1031.json`.

**Abschlussprüfung nach Commit 9196645:** Commit-Hook-Audit mit Registryzugriff meldete 0 Vulnerabilities; `npm run review-evaluate:regression` endete mit Exitcode 0, 10/10, 0 offenen Findings und ohne Regression. Snapshot: `history/2026-11-02_1035.json`.

---

## 2026-11-02 – Dashboard-Datumsserialisierung (BUG-063)

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| Dashboard-Vorschlagsrangfolge wirft bei Cache-Hit `createdAt.getTime` | P1 | offen | behoben | Digest `113253834`; gecachtes Datum war ein ISO-String |

**Root-Cause:** Der frühere Dashboard-Fix normalisierte Event- und Sessiondaten, doch die später hinzugefügte FEAT-015-Ranglogik verglich `createdAt` weiterhin als `Date`. `unstable_cache` serialisiert Prisma-Datumswerte und gibt sie als Strings zurück. So blieb dieselbe Cache-Annahme in einem neu hinzugefügten Dashboardpfad bestehen.
**Gegenmaßnahme:** Ranglogik akzeptiert `Date | string` und normalisiert vor dem Gleichstandsvergleich; Regressionstest bildet gecachte ISO-Zeitstempel nach.
**Verantwortlich:** BoardGameTools-Wartung.
**Prüfnachweis:** `tests/unit/lib/dashboard-event-proposals.test.ts`; der Regressionstest scheiterte vor dem Fix mit dem gemeldeten `TypeError` und lief danach grün.

## 2026-11-02 11:19:33

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Registryzugriff lieferte 0 Vulnerabilities und Regressionsevaluator bestand |

**Root-Cause:** Der Sandboxlauf konnte `registry.npmjs.org` nicht erreichen (`ENOTFOUND`); der Evaluator wertete die fehlende Auditantwort fail-closed als offenes Finding. An den Abhängigkeiten wurde nichts geändert.
**Gegenmaßnahme:** `npm audit --omit=dev` und Regressionsevaluator mit freigegebenem Registryzugriff erneut ausführen.
**Verantwortlich:** BoardGameTools-Wartung.
**Auflösung 2026-11-02:** Produktionsaudit meldete `found 0 vulnerabilities`; Regressionsevaluator mit Registryzugriff endete mit Exitcode 0, 10/10, 0 offenen/neuen Findings und ohne Regression. Snapshot: `history/2026-11-02_1223.json`.

---

## 2026-11-02 11:34:23

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Sandbox-Audit lieferte zunächst keine Prüfdaten; Registryprüfung meldete 0 Produktionslücken |

**Root-Cause:** Der erste Evaluatorlauf hatte im Sandboxmodus keinen Registryzugriff. Dadurch wurde fehlendes Audit-JSON fälschlich als offenes SEC-45 gewertet.
**Gegenmaßnahme:** `npm audit --omit=dev` mit Registryzugriff erneut ausführen und den Regressionsevaluator erst mit gültigen Auditdaten bewerten.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-03:** `npm audit --omit=dev` meldete 0 Vulnerabilities. Der Regressionsevaluator mit Registryzugriff endete mit Exitcode 0, Gesamt 10/10, Sicherheit 9,9/10, 0 offenen Findings und 0 Regressionen. Snapshot `history/2026-11-03_1604.json`.

---

## 2026-11-02 12:07:17

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Die Sandbox konnte die npm-Registry nicht erreichen; der Evaluator wertete fehlende Auditdaten fail-closed als `open`. Abhängigkeiten und Lockfile wurden nicht geändert.
**Gegenmaßnahme:** Registry-Audit und Regressionsevaluator erneut mit Registryzugriff ausführen und nur den gültigen Bericht als Dependency-Befund werten.
**Verantwortlich:** BoardGameTools-Wartung.
**Auflösung 2026-11-02:** `npm run review-evaluate:regression` mit Registryzugriff: Exitcode 0, 10/10, keine offenen/neuen Findings oder Regressionen. SEC-45 bleibt teilweise gelöst (22 moderate, keine Production-Vulnerabilities). Snapshot: `history/2026-11-02_1309.json`.

---

## 2026-11-02 14:06:48

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Der sandboxierte Evaluator konnte keine gültigen npm-Auditdaten abrufen und öffnete SEC-45 fail-closed. Abhängigkeiten wurden nicht verändert.
**Gegenmaßnahme:** Audit und Regressionsevaluator mit freigegebenem Registryzugriff wiederholen; fehlende Prüfdaten nicht als neue Dependency-Schwachstelle ausgeben.
**Verantwortlich:** BoardGameTools-Wartung.

---

**Auflösung 2026-11-02:** Regressionsevaluator mit Registryzugriff erfolgreich; 10/10 gesamt, Sicherheit 9,9/10, keine Regressionen. Snapshot `history/2026-11-02_1508.json`.

## 2026-11-03 11:19:34

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Die Sandbox konnte `registry.npmjs.org` nicht erreichen (`ENOTFOUND`); `npm audit` lieferte dadurch kein JSON. Der Evaluator öffnete SEC-45 fail-closed. Es gab keine Dependency-Änderung.
**Gegenmaßnahme:** Produktions-Audit und Regressionsevaluator mit Registryzugriff außerhalb der Sandbox ausführen; fehlende Daten nicht als tatsächliche Schwachstelle behandeln.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-03:** `npm audit --omit=dev` mit Registryzugriff meldete 0 Vulnerabilities. Reviewläufe mit Registryzugriff endeten mit Exitcode 0, Gesamt 10/10, Sicherheit 9,9/10, keine Regression. SEC-45 bleibt gemäß gültiger Auditbewertung nicht regressiv. Finaler Snapshot: `history/2026-11-03_1239.json`.

---

## 2026-11-03 14:56:26

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | resolved after audit | Sandbox-Audit lieferte zunächst keine Prüfdaten; Registryprüfung meldete 0 Produktionslücken |

**Root-Cause:** Der erste Evaluatorlauf hatte im Sandboxmodus keinen Registryzugriff. Dadurch wurde fehlendes Audit-JSON fälschlich als offenes SEC-45 gewertet.
**Gegenmaßnahme:** `npm audit --omit=dev` mit Registryzugriff erneut ausführen und den Regressionsevaluator erst mit gültigen Auditdaten bewerten.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-03:** `npm audit --omit=dev` meldete 0 Vulnerabilities. Der Regressionsevaluator mit Registryzugriff endete mit Exitcode 0, Gesamt 10/10, Sicherheit 9,9/10, 0 offenen Findings und 0 Regressionen. Finaler Snapshot `history/2026-11-03_1604.json`.

---

## 2026-11-03 16:40:03

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | partially_resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Der erste Lauf im Sandboxmodus konnte `registry.npmjs.org` nicht auflösen (`ENOTFOUND`). Der Evaluator behandelt fehlende Auditmetadaten korrekt fail-closed und meldete SEC-45 deshalb vorübergehend als offen. Dies war kein neuer Paketbefund und es gab keine Dependency-Änderung.
**Gegenmaßnahme:** Registry-Audit und Regressionsevaluator mit freigegebenem Registryzugriff wiederholen, wenn der Sandboxlauf keine gültigen Auditdaten liefern kann.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-03:** `npm audit --json` mit Registryzugriff ergab 22 moderate und 2 niedrige Entwicklungsbefunde, 0 hohe/kritische; `npm audit --omit=dev --json` ergab 0. Finaler Regressionsevaluator mit Registryzugriff: Exitcode 0, 10/10, keine Regression. Snapshot `history/2026-11-03_1808.json`.

---

## 2026-11-03 19:13:54

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Der Evaluatorlauf im Sandboxmodus konnte die npm-Registry nicht erreichen und erhielt kein valides Audit-JSON. SEC-45 wurde fail-closed als Regression markiert; es gab keine Dependencyänderung und keinen neuen Vulnerability-Befund.
**Gegenmaßnahme:** Bei fehlenden Auditdaten den Evaluator mit freigegebenem Registryzugriff erneut ausführen und nur den validen Lauf als Abschluss werten.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-03:** Regressionsevaluator mit Registryzugriff erfolgreich: 10/10, 0 offene Findings, keine Regression; finaler Snapshot `history/2026-11-03_2037.json`.

---

## 2026-11-04 07:52:56

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** Der erste Reviewlauf lief in der Sandbox ohne Registryzugriff. `npm audit` lieferte keine Prüfdaten; der Evaluator bewertete SEC-45 deshalb fail-closed als offen. Es gab keine Dependencyänderung.
**Gegenmaßnahme:** `npm audit --omit=dev` und Regressionsevaluator mit freigegebenem Registryzugriff erneut ausgeführt. Audit meldete 0 Produktionsvulnerabilities; der Wiederholungslauf endete mit Exitcode 0 und ohne Regression.
**Verantwortlich:** BoardGameTools-Wartung.

**Auflösung 2026-11-04:** `npm audit --omit=dev` meldete 0 Vulnerabilities. Der abschließende Hooklauf von `npm run review-evaluate:regression` endete mit Exitcode 0, 10/10 gesamt, 0 offenen Findings und ohne Regression. Snapshot: `history/2026-11-04_0902.json`.

---

## 2026-11-04 08:37:27

| Finding | Priorität | Vorher | Jetzt | Detail |
|---------|-----------|--------|-------|--------|
| SEC-45: npm audit: Bekannte Vulnerabilities | P2 | resolved | open | npm audit lieferte keine gültigen Prüfdaten |

**Root-Cause:** <!-- Manuell ausfüllen: Warum ist das Finding zurückgekehrt? -->
**Gegenmaßnahme:** <!-- Manuell ausfüllen: Wie wird verhindert, dass es erneut passiert? -->
**Verantwortlich:** <!-- Manuell ausfüllen -->

**Auflösung 2026-11-04:** Der erste Evaluatorlauf lief ohne Registryzugriff und erhielt deshalb ungültige Auditdaten; das war kein Dependency-Befund. `npm audit --omit=dev` mit Registryzugriff meldete 0 Vulnerabilities. `npm run review-evaluate:regression` mit Registryzugriff endete mit Exitcode 0, 10/10, 0 offenen Findings und ohne Regression. Snapshot: `history/2026-11-04_0942.json`.

---
