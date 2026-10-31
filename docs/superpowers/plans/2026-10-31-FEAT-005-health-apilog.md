# FEAT-005 – ApiLog-Schreiblast des Health-Endpoints begrenzen

**Status:** Implementierungsplan zur Prüfung; keine Umsetzungsfreigabe.

**Ziel:** Health-Anfragen erzeugen keine Datenbank-Logwrites; die API-Monitoringauswertungen bleiben fachlich konsistent.

**Architektur:** Eine zentrale Pfadpolicy schließt den Health-Endpoint vollständig vom persistierten ApiLog aus. Die Handler-/Fehlerbehandlung bleibt erhalten. Aggregierte Anwendungsmetriken berücksichtigen dieselbe Ausschlussliste, während historische Rohlogs lesbar bleiben.

**Technik:** Next.js 16, TypeScript, Prisma/PostgreSQL, bestehender API-Logger und Vitest. Keine neue Abhängigkeit und keine Schemaänderung.

**Abarbeitung:** Nach ausdrücklicher Freigabe testgetrieben, schrittweise prüfen und committen. Keine automatische Delegation.

## 0. Aktualität unmittelbar vor Umsetzung prüfen

- [ ] Aktuellen HEAD, Arbeitsverzeichnis und seit Planerstellung umgesetzte Features prüfen; fremde Änderungen erhalten.
- [ ] api-logger.ts, Health-Routen und Monitoring-Abfragen erneut lesen. Hat FEAT-006 bereits neue Health-Pfade eingeführt, diese ausdrücklich in derselben Policy berücksichtigen.
- [ ] Ergebnis mit Datum, geprüftem Commit und Änderungen an diesem Plan festhalten: aktuell / im freigegebenen Umfang angepasst / wesentlich geändert.
- [ ] Routineanpassungen an bereits vorhandene Helfer oder Tests direkt einarbeiten. Neue Datenfreigaben, andere Logbereiche oder Umfangserweiterungen vor Umsetzung abstimmen.

Die kurze Prüfung gilt zusätzlich zur bereits erteilten Umsetzungsfreigabe; Details im verbindlichen Aktualitätsabschnitt von docs/DEVELOPMENT-PROCESS.md.

## 1. Bestand und Entscheidung

src/app/api/health/route.ts ist mit withApiLogging umschlossen. src/lib/api-logger.ts schreibt nach jeder Antwort asynchron prisma.apiLog.create, auch bei Health-Fehlern und Rate-Limit-Antworten. Der Health-Handler erzeugt daneben eigene DB-Lesezugriffe; diese gehören zu FEAT-006. Der Gesamtbefund ist BUG-056.

**Entscheidung:** Vollständig ausschließen, keine Zufallsstichprobe. Eine Stichprobe erzeugt weiterhin anfrageproportionale Writes und wäre kein belastbarer Schutz gegen eine Anfrageflut.

- Initial nur exakter Pfad /api/health einschließlich Querystring- und Slashnormalisierung.
- Keine pauschale startsWith-Ausnahme für ähnlich benannte APIs.
- Bei späterem FEAT-006 den exakten geschützten Readiness-Pfad ergänzen.
- Weder 200 noch 429/500/503 auf ausgeschlossenen Pfaden persistieren. Fehler anderer Routen weiterhin erfassen.
- Handlerantworten, Status, Header und bestehende Rate-Limits unverändert durchreichen. Keine künstlichen Wartezeiten; keine neue Response-Cachelogik.
- Keine bestehenden Logzeilen löschen. Health-Verfügbarkeit künftig über externe Monitore/Vercel-Telemetrie beobachten; diese Trennung dokumentieren.

## 2. Dateien

| Datei | Aufgabe |
|---|---|
| src/lib/api-log-policy.ts | Neue reine Ausschlussliste und Pfadprüfung |
| src/lib/api-logger.ts | Persistenz an der gemeinsamen Logfunktion unterbinden; Fehlerbehandlung erhalten |
| src/app/api/admin/monitoring/stats/route.ts | Health-Pfade aus aggregierten Anwendungsmetriken ausschließen |
| src/app/api/admin/monitoring/anomalies/route.ts | Gleiche Basisfilter für Häufigkeit, Fehler, P95 und Zeitfenster |
| src/app/api/admin/monitoring/logs/route.ts | Historische Rohlogs weiter lesbar; kein neuer Löschlauf |
| tests/unit/lib/api-logger.test.ts | Ausschlüsse und unveränderte Antworten prüfen |
| tests/unit/lib/api-log-policy.test.ts | Neue Pfad-/Grenzfalltests |
| tests/unit/api/monitoring-log-policy.test.ts | Neue gemeinsame Filter-/Metriktests |

quality/route.ts bei der Aktualitätsprüfung mitlesen; seine vorhandenen Quell-/Qualitätsscores nicht allein wegen der Logpolicy verändern.

## 3. Aufgaben

### Aufgabe 1 – Zentrale Ausschlussregel testgetrieben

- [ ] Test zuerst schreiben:

```ts
it("persistiert erfolgreiche Health-Anfragen nicht", async () => {
  const handler = vi.fn().mockResolvedValue(NextResponse.json({ status: "healthy" }));
  const wrapped = withApiLogging(handler);
  const response = await wrapped(
    new NextRequest("http://localhost/api/health?probe=1"),
    { params: Promise.resolve({}) }
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ status: "healthy" });
  expect(prisma.apiLog.create).not.toHaveBeenCalled();
  expect(auth).not.toHaveBeenCalled();
});
```

  Die bestehenden Logger-Mocks aus tests/unit/lib/api-logger.test.ts verwenden.

- [ ] Ergänzen: direkter logApiRequest-Aufruf für Health, 429/503 und unerwarteter Handlerfehler; /api/health-check und /api/events bleiben geloggt; öffentliche Tokenredaktion bleibt erhalten.
- [ ] npx vitest run tests/unit/lib/api-log-policy.test.ts tests/unit/lib/api-logger.test.ts ausführen und roten Ausgangspunkt dokumentieren.
- [ ] Folgenden gemeinsamen Vertrag implementieren:

```ts
export const API_METRICS_EXCLUDED_PATHS = ["/api/health"] as const;

export function shouldPersistApiLog(path: string): boolean {
  const pathname = new URL(path, "http://internal.invalid")
    .pathname.replace(/\/+$/, "") || "/";
  return !API_METRICS_EXCLUDED_PATHS.some((item) => item === pathname);
}
```

- [ ] logApiRequest vor jedem Prisma-Zugriff durch diese Policy beenden. withApiLogging darf die bestehende ApiError-/500-Behandlung nicht umgehen.
- [ ] Auch die Sessionauflösung für ausgeschlossene Pfade vermeiden; keine Health-Anfrage darf nur zum Logging eine Auth-Datenbankabfrage auslösen.
- [ ] Tests grün ausführen. Commit: perf: exclude health probes from persistent API logs.

### Aufgabe 2 – Monitoringmetriken konsistent halten

- [ ] Tests mit historischen Health-Zeilen plus normalen API-Zeilen schreiben: Requestzahl, Fehlerquote, P95, Endpunktliste und Anomalien basieren auf derselben Anwendungsmenge.
- [ ] Prisma-Filter um path.notIn der gemeinsamen Ausschlussliste ergänzen. SQL-Auswertungen mit Prisma.sql/Prisma.join parameterisieren; keine zusammengesetzten ungeprüften SQL-Strings.
- [ ] Jeden Nenner und jede Unterabfrage der stats-/anomalies-Routen prüfen, damit beispielsweise Fehlerzahl und Requestzahl nicht aus verschiedenen Mengen stammen.
- [ ] Rohlogsuche erhält ihren bisherigen Vertrag: alte Health-Zeilen dürfen bei gezielter Suche angezeigt werden. Keine automatische Datenbereinigung.
- [ ] Verhalten bei leerer Datenmenge testen: 0 Requests, 0 Fehlerquote und keine Division durch null.
- [ ] npx vitest run tests/unit/api/monitoring-log-policy.test.ts tests/unit/lib/api-logger.test.ts grün ausführen. Commit: fix: align API monitoring metrics with health log exclusions.

### Aufgabe 3 – Lastwirkung und Dokumentation nachweisen

- [ ] In isolierter Testumgebung 1.000 parallele Handleraufrufe mit gemocktem Handler ausführen: 0 ApiLog-Writes. Danach normale API-Requests senden und unveränderte Logfunktion nachweisen.
- [ ] Staging-Prüfung ohne Produktionslast: Health-Antworten vor/nach Änderung vergleichen; DB-Logwrites zählen und Latenzen unter denselben Bedingungen messen. Keine exakte Millisekundengleichheit behaupten.
- [ ] Admin-Monitoring mit vorhandenen und neuen Daten prüfen. Ausfallhistorie in externem Uptime-Monitor und Plattformtelemetrie als Ersatz für ApiLog dokumentieren.
- [ ] npm run test, typecheck, lint, build und security-check ausführen. Keine neue Oberfläche; Impeccable nur für eventuell tatsächlich geänderte Admin-Beschriftungen anwenden, sonst Nichtanwendbarkeit festhalten.
- [ ] docs/DEPLOYMENT.md, docs/FEATURES.md, docs/FEATURE-BACKLOG.md und src/lib/changelog.ts aktualisieren; Monitoring-Semantik ohne Änderung der API-Antwortschemata in docs/openapi.yaml beschreiben.
- [ ] BUG-056 bleibt für die eigene Health-DB-Leselast bis FEAT-006 offen; den hier erledigten Loganteil dokumentieren.
- [ ] Commit und Review-Regressionsprüfung; drei Review-Dokumente aktualisieren. BUG-050/051 nicht durch Überschreiben einer Baseline umgehen.

## 4. Abnahmegrenze

Keine persistierten Health-Logwrites bei Erfolg oder Fehler, normale API-Logs unverändert und konsistente Monitoringmetriken. DB-Leseprüfungen des Health-Handlers werden erst mit FEAT-006 reduziert beziehungsweise geschützt.
