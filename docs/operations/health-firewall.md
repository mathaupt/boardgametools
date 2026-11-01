# Vercel-WAF für Health-Liveness

**Stand:** 01.11.2026 – lesende Vorprüfung, Regel nicht konfiguriert

## Verifizierter Iststand

- FEAT-006-Code wurde mit Commit `dc1ac5a` eingecheckt. `/api/health` ist eine datenbankfreie Prozess-Liveness; `/api/health/ready` ist ein separater tokengebundener Readiness-Check.
- Der Vercel-Pipelinecheck meldete den letzten Production-Deploy am 01.11.2026 um 21:21:57 Europe/Berlin als `READY`. Dieser Deploy liegt vor dem FEAT-006-Commit um 22:39:24. Der geänderte Livenessvertrag ist damit noch nicht als produktiv ausgerollt bestätigt.
- Im Repository sind `scripts/pipeline-checks/health.sh` und `health-readiness.sh` erkennbar. Einen externen Uptime-Monitor oder dessen Intervall, Regionen, Wiederholungen und Ausgangs-IP-Adressen weist das Repository nicht aus.
- Vercel-Tarif, Projektaliasliste, aktuelle Firewallregeln und Regelzähler wurden nicht aus dem Teamkonto gelesen. Die lokale Pipelinekonfiguration wurde nur für den lesenden Deploystatus verwendet; Tokenwerte und Projekt-ID werden nicht dokumentiert.

## Vorgeschlagene Regel – noch nicht aktiv

| Feld | Vorschlag / offene Prüfung |
|---|---|
| Pfad | Exakt `/api/health`; `/api/health/ready` bleibt außerhalb der Regel |
| Methoden | GET und HEAD, sofern Vercel und der tatsächliche Monitor dies verwenden |
| Aktion | Zuerst `Log`, danach nach Beobachtungsfenster Rate Limit mit 429 |
| Schlüssel | Quell-IP der Vercel-WAF |
| Zeitfenster | 60 Sekunden, Fixed Window |
| Grenzwert | 30 Requests je IP und Region, nur wenn echte Monitor-Peaks inklusive Retries höchstens 10/min/IP belegen; sonst neu berechnen |
| Hosts | Alle tatsächlich produktiven Aliase erfassen; keine unbeabsichtigte Umgehung über alternative Domain |

Vercel zählt Rate Limits je Region. Der Wert stellt kein globales Limit dar; verteilte Anfragen können die Summe überschreiten. `Log` blockiert keinen Verkehr, die Rate-Limit-Standardaktion ist 429. Regeln, Schlüssel und Kosten sind tarifabhängig. WAF-Rate-Limits werden nach regionaler Nutzung abgerechnet. Details: [Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [regionale Zähler](https://vercel.com/i/rate-limiting-algorithms), [WAF-Nutzung und Preise](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing).

## Vor einer Konfigurationsänderung

1. Richtiges Team und Projekt, Tarif, Domains, existierende Regeln, Prioritäten und Quoten im Vercel-Konto verifizieren.
2. Aktuellen FEAT-006-Deploy und alle Verbraucher von `/api/health` abgleichen. Externe Monitore samt Intervall, Regionen, Retries und geteilten NAT-Ausgangsadressen erfassen.
3. Mindestens 24 Stunden legitimen Peak pro Quell-IP beobachten; vorliegende Telemetrie und Beobachtungsdauer notieren.
4. Grenzwert aus der gemessenen Last ableiten und WAF-Kosten/Tarif prüfen. Den Schutzpfad exakt auf `/api/health` begrenzen; keine System- oder Pfad-übergreifende Monitor-Ausnahme hinzufügen.
5. Erst im Logmodus beobachten. Nach erfolgreichem Abgleich getrennt über Aktivierung der 429-Aktion entscheiden.

## Betriebs- und Rücknahmehinweis

Die `/api/health`-Antwort signalisiert nur Prozess-Liveness. DB-Ausfälle sind über `/api/health/ready` zu überwachen. Attack Mode kann API-Clients und automatisierte Monitore durch Challenges stören und ist kein Ersatz für die gezielte Health-Regel. Bei Fehlalarmen die eigene Regel auf `Log` zurücksetzen oder entfernen; andere Sicherheitsregeln unverändert lassen.

**Freigabe, Projekt, Regel-ID, Aktivierungszeit, Beobachtungsfenster und Abnahme:** noch offen. Dieses Dokument ist kein Nachweis einer Vercel-Konfiguration.
