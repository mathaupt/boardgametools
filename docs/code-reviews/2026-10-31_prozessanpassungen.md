# Prozessanpassungen – FEAT-003 0.50.28

- [x] Implementierungsplan und Scope Web zuerst, iOS separat eingehalten.
- [x] Vor Umsetzung Varianten mit identischen synthetischen Vorschlägen gerendert und Auswahl dokumentiert.
- [x] Test zuerst fehlschlagen lassen, danach kompakte Liste und Regressionstests umgesetzt.
- [x] 0/1/10/30 Vorschläge, lange Namen, Cover-Platzhalter, Sortierung, Gast-/Nutzerstimmen, Hell-/Dunkelmodus und 200 % Zoom geprüft.
- [x] Impeccable-Detektor auf 390 × 844 und 1440 × 900 ausgeführt; keine Befunde.
- [x] Unit-Suite, TypeScript, ESLint, Build, Security-Check und Review-Regressionsprüfung bestanden.
- [x] Feature-Backlog, Feature-Dokumentation, Konzept, FAQ, Changelog, Bugregister und Review-Dokumentation aktualisiert.
- [x] Commit `9e52e23`; erforderliche Commit-Hooks erfolgreich.

Erfolgsmessung: 680/680 Unit-Tests, Build und Regressionsevaluator bestanden.
Security-Check ohne Fehler; zwei bestehende Warnungen zu SQL- und Debug-Routen
bleiben außerhalb des FEAT-003-Umfangs dokumentiert.

## Ergänzung: Planung FEAT-009 bis FEAT-011 – 0.50.29

- [x] Eigenständige Pläne mit Quellen, Datenverträgen, Dateien, Testfällen, Schritten und Abnahmegrenzen erstellt.
- [x] Gemeinsame Mobile-APIs berücksichtigt; native Oberflächen bei FEAT-010/011 separat vorgesehen.
- [x] Abhängigkeit FEAT-010 vor FEAT-011 ausdrücklich festgelegt.
- [x] Fehler bei Objektzugehörigkeit und Entity-Verarbeitung als BUG-048/049 offen erfasst.
- [x] Datenbereinigung mit Dry-Run, Manifest, Backup, Konfliktschutz und gesonderter Produktionsfreigabe geplant.
- [x] Impeccable-, Kontrast-, Tastatur-, Screenreader-, Security- und echte Datenbankprüfungen pro Feature eingeplant.
- [x] Backlog, Changelog und Review-Dokumentation aktualisiert; lokale Verweise und Planstruktur geprüft.

Erfolgsmessung der Planung: drei vollständige verlinkte Dokumente und
Evaluator-Vorlauf 10/10. Ausführbare Features, bestandene neue Verhaltenstests
und geschlossene neue Bugs werden erst bei späterer Umsetzung dokumentiert.

Der Commit-Hook blockiert SEC-45 aufgrund bestehender Entwicklungsabhängigkeiten.
Vollständigen Registry-Audit geprüft, BUG-050/051 und Root-Cause im Regressionslog
dokumentiert. Keine Paketänderung und kein Hook-Bypass. Der erforderliche Commit
bleibt bis zur separaten Paket-/Evaluator-Korrektur offen.

## Ergänzung: Planung FEAT-012 bis FEAT-014 – 0.50.30

- [x] Pro Feature einen eigenständigen Plan mit Dateien, Testschritten und Abnahmegrenzen erstellt.
- [x] Materielle Produktfrage zu FEAT-013 gestellt und Antwort „ohne Gastwechsel“ übernommen.
- [x] Zustands-/Termin-/Identitätsverträge aus den benachbarten Plänen berücksichtigt.
- [x] Tatsächlichen Gastzugriff der BGG-Suche sowie Autorenzuordnung serverseitig mitgeplant.
- [x] BUG-052/053/054 als offen erfasst; keine UI-Klarstellung als Gastauthentifizierungsfix ausgegeben.
- [x] Impeccable, Tastatur-/Screenreaderbedienung, Kontrast, Datenkonsistenz und Security in die späteren Abnahmen aufgenommen.
- [x] Backlog, Changelog und Reviewdokumentation aktualisiert; lokale Links und Planstruktur geprüft.

Kein erneuter Commitversuch, solange BUG-050/051 ungeklärt sind. Die bereits
gespeicherte Regressionsbaseline darf nicht als Behebung dieser Befunde gelten.
Die drei Implementierungspläne sind reviewbar gespeichert; ihre Umsetzung
ist noch nicht freigegeben.

## Ergänzung: Planung FEAT-005 bis FEAT-008 – 0.50.31

- [x] Vier eigenständige Pläne mit kurzen Aktualitätschecks am Anfang erstellt.
- [x] Nutzerregel zur Planaktualität dauerhaft in AGENTS.md und Entwicklungsprozess aufgenommen, auch für ältere/freigegebene Pläne.
- [x] Routineanpassung innerhalb vorhandener Freigabe von wesentlicher Scope-/Kosten-/Berechtigungsänderung unterschieden.
- [x] Health-DB-/Auth-/Logpfade gemeinsam betrachtet und BUG-055/056 offen erfasst.
- [x] Aktuelle offizielle Vercel-Quellen für WAF, Attack Mode und Budgetbetrieb berücksichtigt.
- [x] Monitorumstellung, tatsächlichen Konfigurationsreadback, begrenzte Tests und Rollback eingeplant.
- [x] Backlog, Changelog und Reviewdokumentation aktualisiert; keine Produktiv- oder Billingänderung durchgeführt.

Die kurze Aktualitätsprüfung gehört vor jedes künftige Feature, nicht nur
vor dieses Betriebspaket. Das Planerstellungsdatum ersetzt keinen späteren
Abgleich. BUG-050 bleibt für moderate Dev-Abhängigkeiten offen; kein Hook-Bypass.

## Ergänzung: FEAT-009 Umsetzung – 0.50.32

- [x] Normalisierung und Schreib-/Ausgabepfade durch Unit-Tests (702/702), TypeScript und Build geprüft.
- [x] Swift-Vertrag und Fast-Security-Check erfolgreich; Produktionsaudit mit 0 Befunden bestätigt.
- [x] Impeccable-Detektor ohne blockierende Befunde ausgeführt.
- [ ] E2E, vollständiger Security-Check und isolierter Datenbanklauf offen; keine Testdatenbank vorhanden.
- [x] Review-Regression mit Registryzugriff bestanden (Exitcode 0); BUG-051 geschlossen, kein Hook-Bypass.
- [x] Feature-/FAQ-/Konzept-/OpenAPI-/Deployment-/Changelog-/Bug- und Review-Dokumentation aktualisiert.

Keine Produktionsbereinigung ohne gesonderte Freigabe nach geprüftem Dry-Run-Manifest
und frischem Backup. BUG-050 bleibt wegen moderater Entwicklungsbefunde offen.

## SEC-45 Commit-Blocker – 0.50.33

- [x] Ungültige npm-Auditantworten mit Tests abgewiesen; fehlende Metadaten werden nicht als Nullbefunde interpretiert.
- [x] Kompatible Audit-Updates angewendet; hoher `systeminformation`-Befund beseitigt.
- [x] Voll- und Produktionsaudit mit Registryzugriff getrennt validiert.
- [x] Regressionsevaluator mit `--fail-on-regression` erfolgreich (Exitcode 0); SEC-45 ist teilweise gelöst, keine Regression.
- [x] BUG-051 geschlossen; BUG-050 führt die moderaten/niedrigen Dev-Restbefunde weiter.

Ohne Registryzugriff meldet der Evaluator bewusst `open` und blockiert bis
eine belastbare Prüfung möglich ist.

## False Positive P2-23 und SEC-45-Nachprüfung – 0.50.34

- [x] P2-23 auf echte Fehlerantworten begrenzt; erfolgreiche `message`-Bodies
  werden nicht mehr als Error-Contract gezählt.
- [x] Drei Unit-Regressionstests für Success-, Error- und plain-message-Zeilen.
- [x] SEC-45 nach dem Sandbox-Fehllauf mit Registryzugriff verifiziert;
  22 moderate Dev-Befunde, Produktionsaudit ohne Befunde.
- [x] `review-evaluate:regression --fail-on-regression`: Exitcode 0, keine
  Regression, 10/10.

Bei nicht erreichbarer Registry bleibt SEC-45 fail-closed. Die Behebung des
falsch positiven P2-23-Findings ändert keine API-Verträge.

## FEAT-010 Abschluss – 0.50.34

- [x] Isolierte PostgreSQL-Integration und Browser-E2E gegen die implementierten Schreibsperren wiederholt.
- [x] Responsive Darstellung bei 390/1440 px, hellem/dunklem Modus und 200-%-Zoom-Äquivalent geprüft.
- [x] Impeccable-Detektor erneut ausgeführt; initiale Kontrast-, Innenabstands- und Copy-Hinweise behoben, finale Prüfung ohne Findings.
- [x] Vollständige Unit-Suite (740), TypeScript, Produktionsbuild und Lint (0 Fehler) erfolgreich.
- [x] Security-Check im Commit-Hook bestanden (0 Fehler, 2 Warnungen); Regressionsevaluator 10/10 ohne Regression, Snapshot `history/2026-10-31_2357.json`.

## FEAT-011 Web-Umsetzung – 0.50.35

- [x] Vorherigen FEAT-010-Zustandsvertrag geprüft und als Capability-/Date-only-Basis übernommen; keine parallele Client-Sperrlogik eingeführt.
- [x] Tests testgetrieben ergänzt: 763 Unit-Tests im Gesamtlauf, TypeScript und Build erfolgreich.
- [x] Isolierte PostgreSQL-/Chromium-E2E für Tastaturantwort, gespeicherten Wert und Antwort-Zielgeometrie durchgeführt.
- [x] Commit-Hook: Security-Check bestanden (0 Fehler, 2 Hinweise); Review-Evaluator Exitcode 0, Gesamtwertung 10/10, keine Regression/offenen Findings, Snapshot `history/2026-11-01_1215.json`.
- [x] Impeccable-Hookstatus geprüft und statischen Detektor ausgeführt; kein primäres Finding, ein nicht zu FEAT-011 gehörendes Größen-Advisory dokumentiert.
- [ ] Dark-Theme-Kontrast vollständig messen; BUG-039 offen lassen, bis die Messwerte belegt sind.
- [ ] VoiceOver, Fehler-/409- und Fokusretentionsverhalten manuell/E2E abnehmen; BUG-038 bis dahin in Bearbeitung.
- [ ] Öffentliche Gesamtseite bei 400-%-Zoom weiter reflowen; derzeit wird nur die Terminfläche bei 98 CSS-px ohne Überlauf geprüft.

## FEAT-011-Backlogstatus abgeglichen – 0.50.36

- [x] Veraltete Angabe „Umsetzungsfreigabe: Ausstehend“ im Detail durch erteilte Freigabe und abgeschlossene Web-Umsetzung ersetzt.
- [x] VoiceOver, vollständige Theme-Kontrastmessung und native iOS-Umsetzung als getrennte offene Abnahmen belassen.
- [x] Changelog und Feature-Dokumentationsversion aktualisiert; bestehende Review-Ergebnisse nicht als neue technische Prüfung ausgegeben.

## FEAT-011 ergänzende Abnahme – 0.50.37

- [x] Gerenderte Theme-Kontraste und responsive Gesamtseite automatisiert geprüft; niedrigster Textkontrast 5,11:1.
- [x] Stressfixture auf zehn Terminvorschläge und 50 Gäste erweitert; alle Antwortziele mindestens 44 × 44 px.
- [x] Unit-, Typecheck-, Lint-, Build- und Security-Prüfungen erneut abgeschlossen.
- [ ] Manuelle VoiceOver-Prüfung in Safari bleibt als expliziter Abnahmepunkt offen.

## FEAT-014 Web-Umsetzung – 0.50.38

- [x] Plan vor Umsetzung gegen FEAT-009, FEAT-010 und FEAT-013 abgeglichen; aktive Identität nicht dupliziert.
- [x] Such- und Detail-API mit token-/eventgebundener Capability, Rate-Limit, festem BGG-Upstream, 10-Sekunden-Limit und 2-MB-Antwortgrenze umgesetzt.
- [x] Getrennte Suchzustände, sichtbares Feldlabel, Fehlerwiederholung, Fokusverhalten und Vorschlagsmutation getestet.
- [x] Vollständige Unit-Suite (796), TypeScript, Build, Lint, Security-Check und Impeccable-Detektor erfolgreich; 10/10, SEC-45 teilweise gelöst.
- [x] OpenAPI, Featureübersicht, FAQ, Konzept, Backlog, Bugtracking, Plan und Changelog aktualisiert.
- [ ] Browser-E2E gegen isolierte PostgreSQL-Datenbank sowie visuelle 390/1440-px-, Dark-Theme- und 200-%-Zoom-Abnahme nachholen.
