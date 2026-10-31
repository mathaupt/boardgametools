# FEAT-006 – Health in Liveness und geschützte Readiness trennen

**Status:** Implementierungsplan zur Prüfung; keine Umsetzungsfreigabe und keine Veröffentlichungsfreigabe.

**Ziel:** Öffentliche Health-Anfragen erzeugen keine Datenbanklast; die Datenbankbereitschaft wird separat geschützt und bei Ausfällen zuverlässig als 503 gemeldet.

**Architektur:** Der bestehende öffentliche Pfad /api/health wird nach kontrollierter Monitorumstellung ein reiner Liveness-Check. Eine neue geschützte Route /api/health/ready prüft ausschließlich die DB-Verbindung mit begrenztem Pool und echten Zeitlimits. Auth-/Logging-Nebenpfade dürfen öffentliche Probes nicht wieder zu DB-Anfragen machen.

**Technik:** Next.js 16, Prisma/PostgreSQL und vorhandener Rate-Limiter; Vitest, isolierte DB-/Lasttests und bestehende Pipelineprovider. Kein Redis-Statuscache und keine neue Abhängigkeit.

**Abarbeitung:** Nach ausdrücklicher Freigabe testgetrieben, in den folgenden Schritten und mit gesonderter kontrollierter Produktionsumstellung. Keine automatische Delegation.

## 0. Aktualität unmittelbar vor Umsetzung prüfen

- [ ] HEAD, Arbeitsverzeichnis und zuletzt umgesetzte Features lesen. FEAT-005-Logpolicy und tatsächlich vorhandene Health-Routen prüfen und wiederverwenden.
- [ ] Healthnutzer, Proxy-/Authcallbacks, DB-Pool, Monitoringprovider und Deploymentdokumentation auf aktuelle Verträge prüfen; inzwischen eingeführte Caches/Probes nicht duplizieren.
- [ ] Aktuellen Planentscheid mit Datum, Commit und betroffenen Abhängigkeiten dokumentieren. Wesentliche neue Antwort-/Berechtigungs- oder Betriebsänderungen vor Umsetzung abstimmen.

## 1. Bestand und Variantenentscheidung

Der aktuelle öffentliche Handler führt SELECT 1, drei Tabellenzählungen und eine Migrationsabfrage aus. Jede Anfrage verursacht zusätzlich ApiLog-Schreiben, sofern FEAT-005 noch nicht umgesetzt ist (BUG-056). Die öffentliche Antwort enthält interne Zähler, Speichernutzung und potenziell rohe DB-Fehler (BUG-055).

Wichtig: src/proxy.ts ist mit auth umschlossen. Ein gültiger Sessioncookie kann im Sessioncallback eine User-Abfrage auslösen, noch bevor die Health-Ausnahme im Proxy erreicht wird. Ein DB-freier Handler allein genügt daher nicht.

**Vorgeschlagene Entscheidung zur Freigabe:** Split statt Redis-Statuscache. Ein Cache würde Ausfälle zeitverzögert zeigen und bei Cacheausfall einen zusätzlich zu begrenzenden Direktprüfungs-Fallback benötigen. Beim Split verursacht die öffentliche Anfrage unabhängig von Redis und DB keine SQL-Last. Echte DB-Ausfälle bleiben im Readinessmonitor als 503 sichtbar.

Das ändert bewusst die Bedeutung des bestehenden Pfads. „Liveness 200“ heißt nur, dass der Prozess antwortet; es ist keine Zusage zur Funktionsfähigkeit der Datenbank. Die Änderung erst nach Prüfung und Umstellung vorhandener Monitore veröffentlichen.

## 2. Zielvertrag

| Pfad | Zugriff | Erfolg | Fehler / Aussage |
|---|---|---|---|
| /api/health | Öffentlich | 200, check=liveness, status=healthy, version, timestamp | Kein DB-/Rediszugriff; App-/Transportfehler weiterhin nicht erfolgreich |
| /api/health/ready | Separater Bearer-Monitoringtoken | 200, check=readiness, status healthy/degraded, DB-Antwortzeit | 401 ohne gültigen Token, 429 Rate-Limit, 503 bei Fehlkonfiguration/DB-Ausfall/Timeout |

- Keine Tabellenzählungen oder Migrationsinformationen in Health-Responses. Rohe SQL-/Verbindungsfehler und Umgebungs-/Speicherdiagnosen nicht öffentlich ausgeben.
- Beide Routen mit Cache-Control: no-store. Version weiterhin aus package.json, nicht aus Changelog oder einer erfundenen Releasevariable.
- Readiness-Token über HEALTH_READINESS_TOKEN, mindestens 32 zufällige Zeichen, nur serverseitig beziehungsweise im Secretstore des Monitors. Kein Queryparameter, kein NEXT_PUBLIC_-Wert und kein reuse von Session-/Datenbankpasswörtern.
- Token fehlt in der Konfiguration → 503 und null DB-Anfragen; fehlender/falscher Requesttoken → 401 und null DB-Anfragen.
- Vergleich über SHA-256-Digests und timingSafeEqual; Authorization-Headerlänge begrenzen. Keine Auth-Sessionabfrage für Readiness.
- Lokales Readiness-Rate-Limit nach Authentifizierung auf 30/min; der Token bleibt die primäre Zugangskontrolle. Kein globales verteiltes Limit aus einer Prozess-Map behaupten.
- Pro Prozess höchstens eine gleichzeitige Readiness-Probe; gleichzeitige gültige Requests teilen denselben laufenden Probe-Promise. Keine langfristig gecachte Erfolgsmeldung.
- Gesund bei erfolgreicher Probe; degraded ab 1.000 ms, weiterhin 200; echte Fehler/Timeout 503. Nach DB-Erholung nächste zugelassene Probe erneut ausführen.

**Cachekriterien:** Redis ist für diesen Healthpfad nicht erforderlich. Cache-TTL, Invalidierung und Direktprüfungs-Fallback sind bei der gewählten Splitvariante nicht anwendbar. Ein Redis-Ausfall darf den öffentlichen Liveness-Check nicht beeinträchtigen.

## 3. Dateien

| Datei | Aufgabe |
|---|---|
| src/app/api/health/route.ts | Minimaler Liveness-Handler ohne DB-/Auth-/ApiLog-Import |
| src/app/api/health/ready/route.ts | Neue tokengeprüfte Readiness |
| src/lib/health/readiness-auth.ts | Neuer reiner Monitoringtoken-Vergleich |
| src/lib/health/database-probe.ts | Neue lazy Prisma-Probe, Timeout und Singleflight |
| src/lib/app-version.ts | Gemeinsamer serverseitiger Versionsleser ohne DB |
| src/proxy.ts | Exakte Healthpfade vor jeglicher Sessionauflösung ausnehmen |
| src/lib/authenticated-proxy.ts | Falls für lazy Auth nötig: bestehenden auth-umschlossenen Proxy unverändert auslagern |
| src/lib/api-log-policy.ts | FEAT-005-Policy um exakten Readiness-Pfad erweitern |
| src/lib/env.ts, .env.local.example | Optionalen Readiness-Token dokumentieren; kein Secret eintragen |
| scripts/pipeline-checks/health.sh | Als Livenessprüfung korrekt benennen |
| scripts/pipeline-checks/health-readiness.sh | Neuer separater geschützter Readinessprovider |
| scripts/check-pipeline.sh, scripts/pipeline-checks/README.md | Neuen Provider erklären; bestehende generische Flagregistrierung nutzen |

## 4. Aufgaben

### Aufgabe 1 – Liveness wirklich von DB-Nebenpfaden lösen

**Neu:** tests/unit/api/health.test.ts. **Erweitern:** tests/unit/proxy.test.ts und tests/unit/lib/api-logger.test.ts.

- [ ] Tests zuerst: 100 parallele öffentliche Probes erzeugen keinerlei Prisma-/Session-/Redis-/ApiLog-Aufruf; gleiches Ergebnis mit einem gültig aussehenden Sessioncookie.
- [ ] Antwort enthält check=liveness, healthy, echte Packageversion und Zeitstempel; enthält keine DB-Zähler, Speicherdiagnose oder rohen Fehler.
- [ ] Nachbarpfade /api/health-check und /api/health/unknown dürfen nicht durch eine neue breite Proxy-Ausnahme freigegeben werden.
- [ ] npx vitest run tests/unit/api/health.test.ts tests/unit/proxy.test.ts tests/unit/lib/api-logger.test.ts ausführen; roten Ausgangspunkt belegen.
- [ ] Öffentlichen Handler ohne withApiLogging implementieren; FEAT-005 verhindert weiterhin indirekte/direkte Health-Logwrites an der zentralen Persistenzgrenze.
- [ ] Proxyexakte Ausnahmen vor Aufruf von auth platzieren. Wenn der bestehende statische Authimport dies verhindert, die vorhandene geschützte Proxylogik lazy aus authenticated-proxy.ts laden. Bestehende CSRF-/Admin-/Mobiletests unverändert weiter erfüllen.
- [ ] Version aus gemeinsamem app-version.ts lesen; keine DB-abhängigen Imports im Liveness-Modul.
- [ ] Tests grün ausführen. Noch keine Änderung der Produktionsmonitore. Commit: refactor: isolate database free health liveness.

### Aufgabe 2 – Geschützte und begrenzte Readiness

**Neu:** tests/unit/lib/readiness-auth.test.ts, tests/unit/lib/database-probe.test.ts und tests/unit/api/health-readiness.test.ts.

- [ ] Auth-/Probeverhalten zuerst testen: fehlender Konfigurationstoken, fehlender/falscher Header, 30/min-Grenze, parallele Aufrufe, DB-Fehler, Timeout und Erholung.
- [ ] Route führt vor positivem Tokenvergleich keinen DB-Import oder -Zugriff aus. Konfigurationsfehler generisch benennen, Secretwerte niemals loggen.
- [ ] Lazy einen eigenen PrismaClient über PrismaPg mit max=1, connectionTimeoutMillis=1.000 und idleTimeoutMillis=1.000 anlegen; pro Prozess wiederverwenden, nicht pro Request neu erzeugen. Verbindungsstring über vorhandene Poolparameternormalisierung bereinigen.
- [ ] Probe als kurze Transaktion mit maxWait=1.000 und timeout=2.000 durchführen. Darin SET LOCAL statement_timeout='1500ms' und SELECT 1 verwenden; keine Zähl-/Migrationsqueries. Auch diese Abfragen bleiben über Prisma.
- [ ] Keine Promise.race-Lösung akzeptieren, die nur die HTTP-Antwort beendet und eine DB-Abfrage weiterlaufen lässt. Tatsächliche Treiber-/Statementabbruchwirkung im Integrationstest nachweisen.
- [ ] Pending-Probe in finally freigeben, Fehler nicht als dauerhaften Status behalten. Zusätzlichen maximal einen Poolslot pro Readinessinstanz im Betriebsbudget berücksichtigen.
- [ ] Antwort nur mit Status, Version, Zeitstempel und DB-Probeergebnis; keine exception.message in JSON übernehmen. Readiness-Pfad in der Logpolicy ausschließen, auch bei 401/429/503.
- [ ] npx vitest run tests/unit/lib/readiness-auth.test.ts tests/unit/lib/database-probe.test.ts tests/unit/api/health-readiness.test.ts grün ausführen. Commit: feat: add protected bounded database readiness.

### Aufgabe 3 – Monitore und Pipeline kontrolliert umstellen

- [ ] Vor Veröffentlichung alle bekannten Uptime-, CI-, externen und mobilen Healthverbraucher inventarisieren. Repository-Suchlauf und Betreiberliste verwenden; nicht behaupten, veröffentlichte Altclients seien vollständig bekannt.
- [ ] Bei getrenntem Deployment zuerst Readiness ergänzen, während der alte /api/health-Vertrag vorübergehend bestehen bleibt. Liveness-Umschaltung erst nach abgeschlossenem Verbraucherabgleich.
- [ ] Readinessprovider mit PROD_URL und HEALTH_READINESS_TOKEN konfigurieren; expliziter Aufruf npm run pipeline:check -- --health-readiness.
- [ ] Beide Provider prüfen neben HTTP 200 den JSON-Vertrag: check=liveness/status=healthy beziehungsweise check=readiness mit zulässigem Gesamt-/DB-Status. HTML-Challenge, Loginseite, Redirect oder unverständlicher Body sind kein Erfolg.
- [ ] Tests in tests/unit/scripts/health-provider.test.ts: fehlende Konfiguration, 401, 429, 503, Transportfehler, HTML mit 200, falscher Checktyp und gültige JSON-200-Antwort; kein Token in stdout/stderr/JSON. Secret über Eingabekonfiguration an curl übergeben, nicht in auszugebende URLs.
- [ ] Betreiber richten zwei eindeutig benannte Checks ein: Prozess erreichbar und Datenbank bereit. Alarmierung darf einen DB-Ausfall nicht aus einem grünen Livenessresultat ableiten.
- [ ] Erst danach root auf den neuen Livenessvertrag umstellen. Ein verbliebener kritischer Readinessverbraucher des alten Pfads ist ein offener Rolloutpunkt, kein akzeptierter Funktionsverlust.
- [ ] Keine Produktionsdatenbank absichtlich für einen Test abschalten. DB-Ausfall-/Erholungstest gegen isolierte Staging-/Wegwerfdatenbank durchführen.
- [ ] Commit: chore: separate liveness and readiness monitoring.

### Aufgabe 4 – Echte Last- und Ausfallabnahme

- [ ] Separate sichere Integrationskonfiguration für tests/integration/health-readiness.test.ts verwenden; BGT_TEST_DATABASE_URL muss localhost/127.0.0.1 und Datenbankpräfix bgt_test_ erfüllen. Falls FEAT-010 die Konfiguration bereits erstellt hat, erweitern statt duplizieren.
- [ ] Liveness mit 1.000 Anfragen und wechselnden Test-IP-Adressen prüfen: null DB-Queries und null ApiLog-Writes, einschließlich Sessioncookie.
- [ ] Readiness ohne Token fluten: null DB-Queries. Mit gültigem Token Parallelität, kurze laufende Probe, Rate-Limit sowie Socket-/Statementabbruch prüfen.
- [ ] DB-Ausfall ergibt Readiness 503; Erholung wird bei der nächsten zugelassenen Probe sichtbar. Liveness bleibt als Prozesscheck unabhängig. In Staging gleichzeitig normale Nutzerabfragen messen und zusätzlichen Poolbedarf bewerten.
- [ ] docs/openapi.yaml um explizite Liveness-/Readinessschemata und eigene Bearer-Monitoringsecurity erweitern; nicht mit Mobile-Login-Tokens gleichsetzen.
- [ ] DEPLOYMENT, FEATURES, CONCEPT, Backlog und Changelog aktualisieren. Das bisher falsche Deployment-Beispiel status=ok durch die jeweils tatsächlich implementierte Semantik ersetzen.
- [ ] npm run test, typecheck, lint, build und security-check ausführen; keine UI-Änderung, Impeccable nicht anwendbar.
- [ ] BUG-055/056 erst nach sicherer Antwort, null öffentlichen DB-Zugriffen und vollständigem Monitorrollout schließen. Commit und Reviewdokumentation aktualisieren; BUG-050/051 nicht umgehen.

## 5. Abnahmegrenze

Die Codeabnahme und die Monitorumstellung sind getrennt nachzuweisen. Ohne letztere ist FEAT-006 nicht vollständig umgesetzt. Splitvariante, neue Tokenkonfiguration und geänderte Bedeutung von /api/health sind mit diesem Plan ausdrücklich zur Freigabe vorgelegt.
