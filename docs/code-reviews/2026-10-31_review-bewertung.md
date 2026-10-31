# Bewertung – FEAT-003 Voting-Listen 0.50.28

| Kriterium | Vorher | Nachher |
|---|---|---|
| Übersicht bei zehn Vorschlägen, 390 px | Zwei vollständige Karten | Vier vollständige Zeilen im Erstbild |
| Detailzugang | Dialog über Spielname und „Spieldetails“ | Beides bleibt in der kompakten Zeile verfügbar |
| Abstimmung und Gaststimmen | Verschiedene Kartenlayouts | Einheitliche Zeile; Gesamtzahl und öffentliche Aufschlüsselung bleiben sichtbar |
| 200-%-Zoom | Horizontaler Überlauf und überlagerte Inhalte | Kein horizontaler Überlauf; Inhalte und Aktionen stapeln sich |
| Touch-Aktionen | Teilweise unter 44 px | Voting- und Löschziele mindestens 44 × 44 px |
| Unit-Tests | 677 bei FEAT-002 | 680 bestanden |
| Review-Evaluator | 10/10 | 10/10, keine Regressionen |

Die kompakte Variante wurde nach einem separaten codebasierten Vergleich gewählt.
Der Impeccable-Detektor meldete in den geprüften mobilen und Desktop-Renderings
keine Befunde. Diese Prüfung gilt für die geänderten Web-Votingansichten; native
iOS-Oberflächen wurden nicht geändert.

## Ergänzung: Planungsstand 0.50.29

| Kriterium | Vorher | Nachher |
|---|---|---|
| FEAT-009 | Backlog-Anforderung | Eigener Plan mit Import-/Ausgabegrenzen und kontrolliertem Datenlauf |
| FEAT-010 | UI-Befund BUG-037 | Zustandsmatrix, API-Absicherung, Legacy-/Datumsregeln und echte DB-Abnahme geplant |
| FEAT-011 | Mobile-/Kontrastbefunde | Gemeinsame Radiogruppen, responsive Terminansicht und Screenreader-Abnahme geplant |
| Erkannte Objektzugehörigkeitslücken | Nicht separat erfasst | BUG-048 offen, in FEAT-010 eingeplant |
| Erkannte Textnormalisierungslücken | Backlog ohne Bugreferenz | BUG-049 offen, in FEAT-009 eingeplant |
| Review-Evaluator | Vorlauf 10/10 | Sicherheit 9,9/10, SEC-45 teilweise gelöst; Commit wegen Paketregression blockiert |

Die Planung legt überprüfbare Grenzen fest. Die Featurefreigabe, die
vorgeschlagenen Produktregeln und der konkrete Produktions-Bereinigungslauf
sind gesonderte Entscheidungen. Funktions- und Sicherheitskorrekturen sind
mit der Erstellung der Pläne noch nicht erfolgt.

Ein vollständiger Registry-Audit bestätigt 26 Entwicklungsbefunde bei unveränderten
Paketdateien; der Produktionsaudit meldet 0. BUG-050/051 und das Regressionslog
halten Paketbefunde sowie die mögliche falsche Nullbewertung bei Auditfehlern fest.
Die Commit-Sperre bleibt bestehen; dies ändert nicht den vollständig gespeicherten Planungsstand.

## Ergänzung: Planungsstand 0.50.30

| Kriterium | Vorher | Nachher |
|---|---|---|
| FEAT-012 | Layout-/Gästelistenbefunde | Ein Teilnahmeweg, zentrale Gästedaten und messbare Layoutabnahme geplant |
| FEAT-013 | Ungeklärter Gastwechselumfang | Ausdrücklich ohne Gastwechsel bestätigt; ein UI-Actor und eine Autorenrelation geplant |
| FEAT-014 | Frühe Leere-Meldung und fehlendes Label | Suchzustände, Abbruchschutz und tokengebundener Gastzugriff geplant |
| Sicherheitsgrenze | Gast-ID ohne Besitznachweis | BUG-053 ausdrücklich offen; keine Authentifizierungszusage aus der UI ableiten |
| Review-/Auditstand | BUG-050/051 offen | Keine Korrektur oder neue erfolgreiche Evaluierung behauptet |

Die drei Pläne sind unabhängig referenzierbar, ihre Integrationen verwenden
gemeinsame Verträge. Die Produktentscheidung zu FEAT-013 ersetzt keine
Umsetzungsfreigabe. Keine Runtime-Abnahme oder Bugbehebung erfolgt.

## Ergänzung: Planungsstand 0.50.31

| Kriterium | Vorher | Nachher |
|---|---|---|
| FEAT-005 | Stichprobe/Ausschluss offen | Vollständiger Health-Logausschluss mit konsistenten Monitoringmetriken geplant |
| FEAT-006 | Cache/Split offen | DB-freie Liveness und geschützte Readiness samt Monitorrollout zur Freigabe vorgeschlagen |
| FEAT-007 | Allgemeine Firewallanforderung | Exaktes Match, Beobachtungsfenster, Monitorabgleich und begrenzter Nachweis geplant |
| FEAT-008 | Allgemeine Ausgabenobergrenze | Konkreter Betreiberentscheid mit Restkosten- und Teamwirkung vorgesehen |
| Planaktualität | Bestandsprüfung bei Planung | Zusätzlich kurzer dokumentierter Check unmittelbar vor jeder Umsetzung |

Die neuen Quellen zeigen auch Auth-/Logging-Nebenlast öffentlicher Probes.
Die Splitvariante behebt dies erst nach tatsächlicher Umsetzung und
Monitorumstellung. Plattformpläne unterscheiden Sollzustand, freizugebende
Eingaben und echten Konfigurationsnachweis; keine Einstellungen aktiviert.

## Ergänzung: FEAT-009 Umsetzung 0.50.32

| Prüfschritt | Ergebnis |
|---|---|
| Unit-Suite | 702/702 bestanden |
| TypeScript und Build | bestanden |
| iOS-Vertrag und Fast-Security-Check | bestanden |
| Produktionsabhängigkeiten | 0 Auditbefunde |
| Vollständiger Dependency-Audit | 26 Entwicklungsbefunde: 1 hoch, 23 mittel, 2 niedrig |
| Impeccable-Detektor | Keine blockierenden Befunde; drei vorhandene Typografiehinweise |
| E2E / isolierte DB / vollständiger Security-Check | Nicht ausgeführt |
| Review-Evaluator | Ergebnis wegen BUG-051 ungültig; daraus kein Score/Regression abgeleitet |

Die Bestandsbereinigung bleibt ausstehend, da keine isolierte Datenbank
konfiguriert war. Produktionsdaten wurden nicht gelesen oder geändert.

## SEC-45 Commit-Blocker behoben – 0.50.33

| Prüfschritt | Ergebnis |
|---|---|
| Audit-High im Dev-Baum | Behoben durch kompatibles Update auf systeminformation 5.33.19 |
| Vollständiger Audit | 22 moderate, 2 niedrige Dev-Befunde; keine High/Critical |
| Produktionsaudit | 0 Befunde |
| Evaluator Regressionstest | Fehlerhafte/unvollständige Auditantworten bleiben offen statt sauber |
| Regressionsevaluator mit Registryzugriff | Exitcode 0; SEC-45 teilweise gelöst, keine Regression |

Die verbleibenden moderaten Entwicklungsbefunde erfordern laut npm
Major-Upgrades. Sie bleiben dokumentiert; der Commit-Hook blockiert aktuell nicht.
Nach der Evaluator- und Dependency-Korrektur bestanden zusätzlich 706/706
Unit-Tests, TypeScript, Build und Security-Check. Lint: 0 Fehler, 651
vorhandene Warnungen in Impeccable-Skriptdateien.
