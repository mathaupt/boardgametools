# FEAT-008 – Vercel-Budget, Warnungen und Pausenverhalten

**Status:** Betriebs- und Implementierungsplan zur Prüfung; keine Umsetzungsfreigabe, kein Betrag festgelegt, keine Billingeinstellung geändert und keine Aktivierungsfreigabe.

**Ziel:** Ein vom Betreiber bestätigtes Budget für variable Vercel-Nutzung löst rechtzeitig Warnungen und ein bewusst gewähltes Begrenzungsverhalten aus.

**Architektur:** Die native Spend-Management-Funktion von Vercel übernimmt Budget und Benachrichtigung. Ein Betriebsrunbook beschreibt Umfang, verbleibende Kosten, Pausenentscheidung und Wiederaufnahme. Keine eigene Zahlungs-/Budgetengine und kein neuer öffentlicher Webhook.

**Technik:** Vercel-Team-/Billingeinstellungen, vorhandene Telemetrie und Betriebsdokumentation. Keine Appabhängigkeit und keine Datenbankmigration.

**Abarbeitung:** Nach Freigabe lesende Bestandsaufnahme, konkreten Entscheidungsdatensatz vorlegen und ausschließlich den bestätigten Umfang aktivieren. Keine automatische Delegation.

## 0. Aktualität unmittelbar vor Umsetzung prüfen

- [ ] Tatsächlichen Vercel-Tarif, Teamumfang, Abrechnungsperiode, Verbrauch und bestehenden Budgetzustand lesen.
- [ ] Seit Planerstellung veröffentlichte Features und neue Dienste/Projekte berücksichtigen; insbesondere geringere Healthlast durch FEAT-005/006 und geänderten Traffic durch FEAT-007.
- [ ] Aktuelle offizielle Budget-/Pausenregeln erneut prüfen. Alte Tarifangaben und geschätzte Kosten nicht ungeprüft übernehmen.
- [ ] Datum, Team-/Projektbezug und Ergebnis am Plan dokumentieren. Routineaktualisierungen nachführen; andere Teamprojekte, neuer Geldbetrag oder geändertes Abschaltverhalten benötigen konkrete Betreiberentscheidung.

## 1. Offizieller Funktionsumfang und Grenzen

Geprüft am 31.10.2026: [Vercel Spend Management](https://vercel.com/docs/spend-management).

Die Funktion ist tarifabhängig und benötigt Owner-/Billingrechte. Das Budget
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
wurden im Rahmen der Planerstellung nicht gelesen.

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
| docs/operations/spend-management.md | Neuer tatsächlicher Budget-/Betriebsentscheid und Runbook |
| docs/operations/cost-review.md | Neue monatliche Prüfliste mit dokumentiertem Ergebnis |
| docs/DEPLOYMENT.md | Betriebsverweis, Auswirkungen auf Web/API/iOS und Zuständigkeit |
| docs/FEATURE-BACKLOG.md, src/lib/changelog.ts | Konfigurations-/Abnahmestand und bestätigten Umfang festhalten |

Keine Billingtokens, persönlichen Telefonnummern, Rechnungsexporte oder
vollständigen Zahlungsdaten im Repository speichern.

## 4. Aufgaben

### Aufgabe 1 – Kostenbasis und vorhandene Einstellungen lesen

- [ ] Richtiges Team und tatsächliche Rolle verifizieren. Aktuelle Budgets, Benachrichtigungen, Pauseoptionen und betroffene Produktionsprojekte erfassen.
- [ ] Variablen Verbrauch getrennt von Sitzkosten, Integrationen, Datenbank/Redis und sonstigen externen Diensten betrachten. Die Budgetfunktion deckt nicht automatisch alle Lieferanten ab.
- [ ] Normalen Verbrauch nach bereits ausgerollten Health-/Firewallmaßnahmen bewerten; keine frühere Hochlast unverändert als Dauerbudget annehmen.
- [ ] Einen konkreten Budgetvorschlag mit belegter Basis, Reserve und Ausfallfolgen erstellen. Betrag und Betriebsreaktion sind die offenen Eingaben für die spätere Freigabe, keine stillen Standardwerte.
- [ ] Vor Einstellungen alle nötigen Rollen und Verantwortlichkeiten feststellen. Bei fehlendem Zugang den Entscheidungsdatensatz vorbereiten und den tatsächlichen Kontoschritt offen lassen.

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
