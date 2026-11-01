# FEAT-007 – Vercel-Firewall für den Health-Endpoint

**Status:** Lesende Vorprüfung am 01.11.2026 aktualisiert. Kein Dashboardzugriff auf Firewall/Monitore; keine Regel geändert. Veröffentlichung und Produktionsabnahme bleiben offen.

**Ziel:** Anfragefluten auf /api/health werden vor der Anwendung gedrosselt, legitime Monitore funktionieren weiter und das Vorgehen im Angriffsfall ist dokumentiert.

**Architektur:** Projektbezogene WAF-Regel mit exakt begrenztem Health-Match, zunächst beobachtend und danach drosselnd. Anwendungsseitige Schutzmaßnahmen aus FEAT-005/006 bleiben bestehen. Der Incident-Ablauf unterscheidet die gezielte Health-Regel vom weiterreichenden Attack Mode.

**Technik:** Vercel Firewall/WAF, vorhandene Uptime-Monitore und Pipelineprüfung; Betriebsdokumentation im Repository. Keine Appabhängigkeit und kein Datenbankschema.

**Abarbeitung:** Nach Freigabe in den folgenden Schritten; lesende Bestandsaufnahme und konkreten Regelvergleich vor Veröffentlichung fertigstellen. Keine automatische Delegation.

## 0. Aktualität unmittelbar vor Umsetzung prüfen

- [x] Am 01.11.2026 Code/Backlog geprüft: FEAT-005/006-Code ist in `dc1ac5a` enthalten; `/api/health` ist Prozess-Liveness, `/api/health/ready` tokengebundene DB-Readiness. Der zuletzt gelesene Production-Deploy war `READY` am 01.11.2026 21:21:57 Europe/Berlin, vor FEAT-006-Commit (`dc1ac5a`, 22:39:24); die neue Endpunktsemantik ist noch nicht als produktiv ausgerollt nachgewiesen.
- [ ] Bestehende WAF-Regeln, Tarif, Quoten, Domains/Aliase, Team und Zählerstrategie wurden mangels Vercel-Dashboardzugriff nicht geprüft. `vercel` CLI und `.vercel/project.json` fehlen. Vor jeder Veröffentlichung im verifizierten Projekt prüfen und vorhandene Regeln bevorzugen.
- [ ] Im Repository sind nur die Pipelinechecks `health` und `health-readiness` als Monitorquellen erkennbar. Externe Uptime-Provider, Intervalle, Regionen, Retryverhalten und Ausgangs-IP-Bereiche bleiben vom Betreiber-/Accountinventar abhängig.
- [x] Offizielle Vercel-WAF-Doku am 01.11.2026 erneut geprüft: Fixed Window, `Log` beobachtet ohne zu blockieren, Standardaktion 429; Fenster und Regelzahlen sind tarifabhängig. Zähler laufen regional, daher kein globales hartes IP-Limit. Quellen: [WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting), [regionale Zähler](https://vercel.com/i/rate-limiting-algorithms), [WAF-Nutzung und Preise](https://vercel.com/docs/vercel-firewall/vercel-waf/usage-and-pricing).
- [x] Ergebnis und gelesener Produktionsstatus festgehalten. Kein Vercel-Write oder Deploy vorgenommen.

## 1. Quellen und Plattformgrenzen

Stand der erneut geprüften offiziellen Quellen: 01.11.2026.

[Vercel WAF Rate Limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) beschreibt IP-basierte Fixed Windows für alle Tarife. Zähler gelten je Region; Regelzahl, Schlüssel und Kosten unterscheiden sich nach Tarif. Log beobachtet ohne zu blockieren, Default-Drosselung liefert 429. Diese Angaben vor der Umsetzung erneut prüfen.

[Vercel Attack Mode](https://vercel.com/docs/vercel-firewall/attack-mode) stellt Challenges für Browserverkehr bereit. Nicht erkannte automatisierte Dienste und eigenständige APIs können dabei scheitern. Ein öffentlicher User-Agent-String ist kein Nachweis eines vertrauenswürdigen Monitors.

Der tatsächliche Tarif und die bestehenden Kontoeinstellungen wurden bei dieser Aktualisierung nicht aus einem Vercel-Konto ausgelesen. Die Regel bleibt ein Vorschlag; vor Einführung Tarif-/Kostenwirkung, Monitor-Peaks und Domainumfang aus dem richtigen Teamkonto lesen.

## 2. Vorgeschlagene Regel

| Parameter | Planwert |
|---|---|
| Projekt | Tatsächliches BoardGameTools-Projekt; ID und Team vor Veröffentlichung verifizieren |
| Name | bgt-health-ip-rate-limit |
| Match | Pfad exakt /api/health, Methoden GET und HEAD |
| Hosts | Projektumfang einschließlich erreichbarer Aliase prüfen; keine ungeschützte alternative Produktionsdomain übersehen |
| Schlüssel | Tatsächliche Client-IP der Vercel-WAF |
| Strategie | Fixed Window, 60 Sekunden |
| Anfangswert | 30 Requests pro IP und Region je 60-Sekunden-Fenster (Vorschlag, noch nicht gemessen) |
| Einführungsmodus | Log zur Beobachtung, anschließend Default-Drosselung 429 |

30/min ist ein vorgeschlagener Startwert. FEAT-006 entfernt das frühere App-Rate-Limit vom Livenesspfad; daher ist 30/min nicht mehr mit einem Anwendungslimit abzustimmen. Der Wert gilt nur, wenn der gemessene legitime Peak einschließlich Retries höchstens 10/min pro gemeinsamer Ausgangs-IP beträgt. Sonst mindestens den dreifachen gemessenen legitimen Peak als konkreten Wert dokumentieren und vor Aktivierung prüfen.

Rate-Limit-Zähler laufen je Region. Verteilte Monitor- oder Clientanfragen können aggregiert mehr als den konfigurierten Einzelregionswert erreichen. Das ist grober Abuse-Schutz und kein globales Requestmaximum.

- Keine pauschale System-Bypassregel für alle Pfade einer Monitor-IP.
- Bevorzugt benötigen Monitore bei passendem Grenzwert keine Ausnahme. Falls erforderlich, Ausnahme ausschließlich für belegte aktuelle Provider-IPs und den Healthpfad; Wirkung auf andere WAF-Regeln prüfen.
- Nicht allein nach User-Agent, einem öffentlichen Header oder einem allgemein bekannten Monitor-Namen freigeben.
- /api/health/ready wird nicht durch diese Regel öffentlich oder tokenfrei. Seine Authentifizierung bleibt in FEAT-006.
- Da der zuletzt gelesene Produktionsdeploy vor FEAT-006 liegt, vor Regelplanung den aktuellen Livevertrag und alle externen Healthverbraucher erneut verifizieren.
- Die Regel ist kein globales Requestmaximum und kein garantierter Rechnungsdeckel.

## 3. Dateien und Nachweise

| Datei | Aufgabe |
|---|---|
| docs/operations/health-firewall.md | Sollregel, Vorprüfungsstatus, Rollout-Voraussetzungen und Rollback; tatsächliche Kontowerte bleiben offen |
| docs/DEPLOYMENT.md | Betriebsverweis, Health-/Monitorbezug und Wiederholungsprüfung |
| scripts/pipeline-checks/README.md | Bedeutung von App-Health gegenüber Edge-429/Challenge erläutern |
| docs/FEATURE-BACKLOG.md, src/lib/changelog.ts | Tatsächliche Einrichtung und Abnahmestand dokumentieren |

Keine frei erfundene vercel.json-Eigenschaft für WAF-Regeln verwenden. Ein Repositorydokument ist der Sollstand, kein Nachweis, dass die Regel im Vercel-Konto aktiviert ist. Aktuelle Konfiguration im Dashboard oder über eine dann offiziell unterstützte lesende API zurücklesen.

## 4. Aufgaben

### Aufgabe 1 – Projekt und Monitorverkehr lesend inventarisieren

- [ ] Firewallregeln, Team/Projekt/Production-Domains bleiben offen, weil kein lesender Dashboard-/Firewallzugriff vorlag.
- [x] Quellcode und Repository-Monitorprovider gelesen. Externe Uptime-Monitore, deren Telemetrie, Intervalle und IPs bleiben noch zu inventarisieren.
- [ ] Legitimen Peak pro IP einschließlich gemeinsamer NAT-Adressen und Retries bestimmen. FEAT-005-Logausschluss bedeutet, dass ApiLog hierfür keine vollständige Quelle ist.
- [x] Vorläufigen Soll-/Istvergleich und nicht freigegebenen Grenzwert in `docs/operations/health-firewall.md` festgehalten. Bestehende Regel ist nicht als fehlend oder nicht vorhanden behauptet.

### Aufgabe 2 – Regel zunächst beobachtend einführen

- [ ] Im verifizierten Projekt Firewall → Configure → passende bestehende Regel bearbeiten oder New Rule verwenden.
- [ ] Match, Schlüssel, Zeitfenster und Grenzwert aus Abschnitt 2 setzen; Aktion zunächst Log. Vorhandene Regelprioritäten und Tarifkosten prüfen.
- [ ] Review Changes mit dem dokumentierten Sollstand vergleichen. Veröffentlichung nur innerhalb des bereits freigegebenen Projekts und Umfangs; andernfalls konkrete Abweichung vorlegen.
- [ ] Danach Konfiguration zurücklesen und Logzähler an der Regel beobachten. Keine erfolgreich getestete Appantwort als Beleg einer aktiven Edge-Regel ausgeben.
- [ ] Alle echten Monitorstandorte und Pipelinechecks im Beobachtungszeitraum berücksichtigen; falsche Positivtreffer vor drosselnder Aktivierung korrigieren.
- [ ] Monitore prüfen die erwartete JSON-Healthantwort; eine Challenge-HTML-Seite mit HTTP 200 ist kein gültiges Lebenszeichen. HEAD nur für ausdrücklich reine Transportchecks verwenden.

### Aufgabe 3 – Drosselung aktivieren und schonend nachweisen

- [ ] Nach mindestens einem repräsentativen 24-Stunden-Fenster die Aktion auf Default-429 ändern und den konkreten Regeldiff veröffentlichen.
- [ ] Zuerst in einem Testprojekt mit vergleichbarer Konfiguration prüfen. Falls ein Produktionsnachweis erforderlich ist, nur einen zuvor begrenzten Test mit höchstens Grenzwert plus fünf Requests aus einer isolierten Testquelle durchführen.
- [ ] Nachweis innerhalb desselben Zählerfensters und derselben Region aufnehmen; wechselnde Regionen oder ein Fensterwechsel dürfen das erwartete Ergebnis nicht verfälschen.
- [ ] Edge-429 und Firewallcounter nachweisen sowie ausbleibende entsprechende Funktionsaufrufe im Plattformfenster prüfen. Telemetrieverzögerung berücksichtigen.
- [ ] Kontrollfälle: normaler Monitorcheck bleibt erfolgreich; /api/health-check und eine normale Appseite werden nicht von dieser Regel getroffen; geschützter Readinesspfad bleibt geschützt.
- [ ] Anschließend 24 Stunden ohne unbegründete Monitoralarme beobachten. Tatsächliche Abnahmezeiten und Ergebnisse dokumentieren; keinen Produktionsangriff simulieren.

### Aufgabe 4 – Incident- und Rollbackanleitung

- [x] Runbook für Traffic-/Regelcounter, getrennte Prozess-/DB-Healthbewertung und Rücknahme in `docs/operations/health-firewall.md` vorbereitet; konkrete Zuständigkeiten bleiben beim Betreiber.
- [ ] Für Attack Mode: Projekt → Firewall → Bot Management → Attack Mode prüfen; vor Aktivierung Auswirkungen auf native iOS-API, externe Monitore, Webhooks und Authabläufe bewerten.
- [ ] Wenn diese Clients keine Challenges bestehen und keine sichere Begrenzung möglich ist, gezielte WAF-Regel statt pauschalem Attack Mode verwenden. Kein Geheimnisbypass über öffentliche User-Agents.
- [ ] Für einen tatsächlichen Incident Aktivierungsgrund, Uhrzeit und Rücknahmekriterium festhalten; kein dauerhaftes Einschalten allein zur Abnahme dieses Features.
- [ ] Rücknahme: eigenen Regeldiff zurücksetzen beziehungsweise Aktion wieder auf Log; andere Sicherheitsregeln unverändert erhalten. Nach Incident Attack Mode bei entfallener Notwendigkeit deaktivieren und Monitore erneut prüfen.
- [ ] Runbook als Tischübung durchgehen. Konfigurationsreadback und reale Monitorchecks sind die Abnahme; keine sinnlosen Unit-Tests, die nur einen Dokumenttext spiegeln.

### Aufgabe 5 – Abschluss

- [ ] docs/DEPLOYMENT.md, Backlog, Changelog und Reviewdokumente aktualisieren. Keine OpenAPI-Vertragsänderung durch die reine WAF-Regel; 429 als Infrastrukturzustand im Betriebsvertrag erklären.
- [ ] Impeccable nicht anwendbar: keine Anwendungsoberfläche geändert. Securityprüfung umfasst Matchumfang, Ausnahmen, native Clients, Kosten, Rollen und Rollback.
- [ ] Keine fremden Teamprojekte oder Billingeinstellungen mitändern. FEAT-008 wird gesondert eingerichtet.
- [ ] Commit und Review-Regressionsprüfung gemäß Projektregeln; vorhandene BUG-050/051 nicht umgehen.

## 5. Abnahmegrenze

FEAT-007 ist erst abgeschlossen, wenn die Regel tatsächlich veröffentlicht,
zurückgelesen und mit legitimen Monitoren sowie begrenztem Drosselnachweis
geprüft ist. Ein fertiges Runbook oder eine nur beobachtende Logregel genügt nicht.
