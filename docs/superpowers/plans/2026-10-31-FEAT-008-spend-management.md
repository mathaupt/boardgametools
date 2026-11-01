# FEAT-008 – Vercel-Budget, Warnungen und Pausenverhalten

**Status:** Lesende Vorprüfung am 01.11.2026 aktualisiert. Kein Billingzugriff auf Tarif, Budget oder Verbrauch; kein Betrag festgelegt. Keine Einstellung geändert.

**Ziel:** Ein vom Betreiber bestätigtes Budget für variable Vercel-Nutzung löst rechtzeitig Warnungen und ein bewusst gewähltes Begrenzungsverhalten aus.

**Architektur:** Die native Spend-Management-Funktion von Vercel übernimmt Budget und Benachrichtigung. Ein Betriebsrunbook beschreibt Umfang, verbleibende Kosten, Pausenentscheidung und Wiederaufnahme. Keine eigene Zahlungs-/Budgetengine und kein neuer öffentlicher Webhook.

**Technik:** Vercel-Team-/Billingeinstellungen, vorhandene Telemetrie und Betriebsdokumentation. Keine Appabhängigkeit und keine Datenbankmigration.

**Abarbeitung:** Nach Freigabe lesende Bestandsaufnahme, konkreten Entscheidungsdatensatz vorlegen und ausschließlich den bestätigten Umfang aktivieren. Keine automatische Delegation.

## 0. Aktualität unmittelbar vor Umsetzung prüfen

- [ ] Tatsächlicher Vercel-Tarif, Teamumfang, Abrechnungsperiode, Verbrauch und bestehender Budgetzustand bleiben mangels Billing-Dashboardzugriff ungeprüft. Der vorhandene Pipeline-Provider gibt ausschließlich den letzten Production-Deploymentstatus zurück.
- [x] FEAT-006-Code wurde am 01.11.2026 committed, aber der zuletzt gelesene Production-Deploy (`READY`, 21:21:57 Europe/Berlin) liegt vor diesem Commit. Die neue Healthsemantik und Trafficwirkung sind in der Kostenbasis noch nicht als produktiv anzurechnen. FEAT-007-Regel ist nicht eingerichtet.
- [x] Offizielle Vercel-Funktion am 01.11.2026 erneut geprüft; seit 23.10.2026 gibt es zusätzlich `vercel budgets` und `vercel budgets alerts` für lesende Budget-/Warnungsabfragen. Die CLI ist lokal nicht installiert. Es gibt daher keinen gelesenen Konto-/Tarif-/Verbrauchsbeleg. Quelle: [Spend Management](https://vercel.com/docs/spend-management), [Vercel CLI Spend-Management](https://vercel.com/changelog/vercel-cli-adds-spend-management).
- [x] Aktuelle Plattformgrenzen notiert: Spend Management ist für Pro und Enterprise Flexible Commitment dokumentiert und erfordert Owner-/Billingrolle. Nutzung wird teamweit oberhalb der Plancredits gezählt; Warnungen liegen standardmäßig bei 50/75/100 Prozent und die Prüfung erfolgt alle paar Minuten. Bei gewählter Pause pausieren alle Production Deployments des Teams; Wiederaufnahme ist projektweise manuell.
- [x] Vorprüfungsdatum und Live-Deploymentzeitpunkt eingetragen. Team, Betrag, Benachrichtigungsempfänger und Reaktion bleiben konkrete Betreiberentscheidungen.

## 1. Offizieller Funktionsumfang und Grenzen

Erneut geprüft am 01.11.2026: [Vercel Spend Management](https://vercel.com/docs/spend-management) und [Vercel CLI Spend-Management](https://vercel.com/changelog/vercel-cli-adds-spend-management).

Die Funktion ist für Pro und Enterprise Flexible Commitment dokumentiert und benötigt Owner-/Billingrechte. Das Budget
betrifft variable Teamnutzung; es ist kein vollständiges Rechnungsmaximum.
Benachrichtigungen erfolgen standardmäßig bei 50/75/100 Prozent. Ein Budget
allein stoppt keine Nutzung; die Pausenoption betrifft alle Produktionsprojekte
des Teams. Prüfungen erfolgen zeitversetzt, und einige laufende beziehungsweise
gespeicherte Ressourcen verursachen weiter Kosten. Ein unter bereits erreichten
Verbrauch gesetzter Betrag kann die Aktion beim nächsten Prüflauf auslösen.
Pausierte Projekte müssen einzeln wieder aufgenommen werden; eine
Budgeterhöhung allein erledigt das nicht.

Dies ist daher ein Budget mit Betriebsreaktion und Restkostenrisiko, kein
garantierter harter Kostendeckel. Die tatsächlichen Einstellungen dieses Kontos
wurden im Rahmen der Vorprüfung nicht gelesen. Seit 23.10.2026 kann die
Vercel-CLI die aktive Budgetkonfiguration und Warnhistorie anzeigen
(`vercel budgets`, `vercel budgets alerts`); die CLI ist in dieser
Arbeitsumgebung nicht installiert. Schreibbefehle (`budgets set`/`remove`)
werden nicht als Vorprüfung ausgeführt.

## 2. Vor Aktivierung zu konkretisierender Entscheidungsdatensatz

Keinen Betrag oder Empfänger erfinden. Folgende tatsächlichen Angaben in
docs/operations/spend-management.md festhalten und vor einem Write prüfen:

| Angabe | Herkunft / Entscheidung |
|---|---|
| Team, Tarif und betroffene Projekte | Tatsächliche Vercel-Konfiguration |
| Aktuelle Abrechnungsperiode und variabler Verbrauch | Billing/Usage-Ansicht |
| Normale Erwartung | Letzte drei verfügbare vollständige Perioden, sonst ausdrücklich kürzerer belegter Zeitraum |
| Freigegebenes Budget B in USD | Konkrete Betreiberentscheidung für variable Nutzung |
| Reserve R oberhalb B | Für zeitversetzte Durchsetzung und nicht abgedeckte Kosten, anhand realer Last bewerten |
| Warnempfänger | Bestätigte Betreiber-/Billingkontakte; personenbezogene Details nicht unnötig versionieren |
| Reaktion bei Budgeterreichen | Teamweite Produktionspause oder ausschließlich Alarmierung, explizit gewählt |
| Zuständigkeit und Wiederaufnahme | Erreichbarer verantwortlicher Betreiber und Stellvertretung |

- Wenn B bereits unter aktuellem Verbrauch liegt, nicht beiläufig speichern. Die unmittelbar mögliche Reaktion muss vorher akzeptiert sein.
- Auf gemeinsam genutzten Teams darf die Pause anderer Projekte nicht als reine BoardGameTools-Änderung behandelt werden.
- Ist eine Teamunterbrechung nicht akzeptabel, nur Warnungen als begrenzten Lieferumfang vorschlagen; das erfüllt keine automatische Nutzungsbegrenzung.
- Unterstützt der vorhandene Tarif die Funktion nicht, dies dokumentieren. Kein kostenpflichtiges Upgrade oder Teamumzug ohne zusätzliche ausdrückliche Entscheidung.
- Kein neuer Webhook nötig, solange native Betreiberwarnungen ausreichen.

## 3. Dateien

| Datei | Aufgabe |
|---|---|
| docs/operations/spend-management.md | Vorprüfungsstand, offene Betreiberentscheidungen und späterer Readback |
| docs/operations/cost-review.md | Monatliche Prüfliste; tatsächliche Werte bleiben bis zum Konto-Readback offen |
| docs/DEPLOYMENT.md | Betriebsverweis, Auswirkungen auf Web/API/iOS und Zuständigkeit |
| docs/FEATURE-BACKLOG.md, src/lib/changelog.ts | Konfigurations-/Abnahmestand und bestätigten Umfang festhalten |

Keine Billingtokens, persönlichen Telefonnummern, Rechnungsexporte oder
vollständigen Zahlungsdaten im Repository speichern.

## 4. Aufgaben

### Aufgabe 1 – Kostenbasis und vorhandene Einstellungen lesen

- [ ] Richtiges Team, Rolle, Budget, Warnungen, Pauseoption und betroffene Produktionsprojekte mangels Billing-Dashboardzugriff nicht verifizieren.
- [ ] Tatsächlichen variablen Verbrauch, Sitze, Integrationen, DB/Redis und externe Anbieter noch zu trennen. Spend Management deckt nicht automatisch alle Anbieter ab.
- [ ] Normalen Verbrauch nach den noch nicht ausgerollten FEAT-006-/007-Maßnahmen später neu bewerten. Vorliegende Rohlast/Schätzwerte werden nicht als Dauerbudget übernommen.
- [ ] Einen konkreten Budgetvorschlag mit belegter Basis, Reserve und Ausfallfolgen erstellen. Betrag und Betriebsreaktion sind die offenen Eingaben für die spätere Freigabe, keine stillen Standardwerte.
- [x] Bei fehlendem Billingzugang den Entscheidungsdatensatz und Monatsprüfliste in `docs/operations/` vorbereitet; keine Kontoeinstellung geändert.

### Aufgabe 2 – Warnungen und gewählte Betriebsreaktion konfigurieren

- [ ] Im bestätigten Team Settings → Billing → Spend Management öffnen und den vorherigen Zustand für den Rückweg dokumentieren.
- [ ] Das konkret genehmigte Budget B setzen; Warnschwellen und Betreiber-Benachrichtigungseinstellungen prüfen.
- [ ] Nur bei ausdrücklich akzeptierter Teamwirkung die Produktionspause einschalten. Bestätigung mit Teamname und tatsächlicher Projektliste gegen den Entscheidungsdatensatz prüfen.
- [ ] Einstellungen erneut lesen und mit B, Reaktion und Empfängerkonfiguration abgleichen. Ein gespeichertes Dokument allein ist kein Aktivierungsnachweis.
- [ ] Bestehende Präferenzen anderer Teammitglieder nicht ungefragt verändern. Keine Nachricht an Dritte über andere Tools senden.

### Aufgabe 3 – Benachrichtigung und Pausenablauf sicher prüfen

- [ ] Providerseitig vorhandene sichere Test-/Vorschaufunktionen nutzen, sofern sie beim Ausführungszeitpunkt angeboten werden. Keine nicht belegte Testfunktion voraussetzen.
- [ ] Budget nicht absichtlich unter Produktionsverbrauch setzen und keine künstlichen Kosten erzeugen, nur um eine Warnung oder Pause auszulösen.
- [ ] Konfigurative Prüfung von Warnempfänger, Schwellen und Zustellkanal dokumentieren. Falls kein sicherer Zustelltest möglich ist, tatsächliche Zustellung erst beim nächsten regulären Ereignis bestätigen und bis dahin nicht als getestet ausgeben.
- [ ] Runbook als Tischübung mit dem Betreiber durchgehen: Kostenanstieg beurteilen, Warnung zuordnen, gegebenenfalls Maßnahmen aus FEAT-007 ausführen und Auswirkungen auf Web, öffentliche Links sowie native API-Aufrufe prüfen.
- [ ] Eine echte Pausen-/Resumeprobe nur in einem isolierten Testteam und nach eigenständiger Genehmigung durchführen; kein gemeinsam genutztes Produktionsteam für diesen Test pausieren.

### Aufgabe 4 – Wiederaufnahme und regelmäßige Kontrolle

- [ ] Wiederaufnahmekriterien festhalten: Ursache begrenzt, aktueller Verbrauch und neue Reserve bewertet, Budget-/Pauseentscheidung erneut geprüft.
- [ ] Betroffene Projekte einzeln wieder aufnehmen; keine Datenbank zurücksetzen und keine Migration als vermeintliche Pausenreparatur ausführen.
- [ ] Danach getrennte Liveness-/Readinesschecks aus FEAT-006 und einen repräsentativen Web-/API-Ablauf prüfen. Bei unabhängigen Providerkosten deren Zustand zusätzlich kontrollieren.
- [ ] Monatlich und nach Tarif-/Team-/Featureänderungen Budget, Verbrauchsprognose, Reserve, Kontakte und Runbook prüfen; Ergebnis mit Datum und Verantwortlichem dokumentieren.
- [ ] Wenn die normale Last dauerhaft über dem Budget liegt, dem Betreiber einen konkreten neuen Entscheid vorlegen. Keine automatische Budgeterhöhung.

### Aufgabe 5 – Abschluss und Dokumentation

- [ ] Konkreten Konto-Readback, Entscheidungsumfang und Prüfergebnisse dokumentieren. Ungetestete echte Zustellung oder Pausenauslösung nicht als erfolgt behaupten.
- [ ] DEPLOYMENT, Backlog, Changelog und Reviewdokumentation aktualisieren. Keine OpenAPI-/Appfunktion geändert.
- [ ] Impeccable und Anwendungstests nicht anwendbar, sofern ausschließlich Plattformkonfiguration/Dokumentation geändert wird. Sicherheitsprüfung betrifft Rollen, Teamwirkung, Geheimnisse, Alarmwege und Rücknahme.
- [ ] Keine Tests schreiben, die lediglich den Inhalt des Runbooks spiegeln. Die tatsächliche Konfiguration und der geprüfte Ablauf sind der Nachweis.
- [ ] Commit und vorgeschriebene Reviewprüfungen; bestehende BUG-050/051 nicht über eine verschobene Baseline umgehen.

## 5. Abnahmegrenze

Abgeschlossen ist der tatsächlich genehmigte und aktivierte Umfang mit
bestätigten Warnwegen und dokumentierter Betriebsreaktion. Ein Alarmbudget
ohne akzeptierte Pause darf nicht als harte Ausgabenobergrenze oder als
automatische Abschaltung dokumentiert werden. Die Planerstellung legt
weder Budgetbetrag noch Empfänger noch Teamunterbrechung fest.
