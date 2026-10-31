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
