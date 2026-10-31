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
