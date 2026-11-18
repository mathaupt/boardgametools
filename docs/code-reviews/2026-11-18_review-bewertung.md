# Review-Bewertung – FEAT-035

FEAT-035 reduziert Ablenkung in der gemeinsamen Webnavigation und gibt
Einladungsantworten einen verlässlichen, wiederherstellbaren Abschluss. Der
kontextuelle Dashboard-Einstieg lenkt bei offenen Einladungen direkt zum
Antwortbereich. Fünf häufige Bereiche bleiben direkt erreichbar; Reihen,
Statistiken und Abzeichen sind über „Mehr“ auffindbar.

| Bereich | Vorher | Nachher |
|---|---|---|
| Einladungsfehler | HTTP-Fehler ohne sichtbare Rückmeldung; Netzwerkfehler nur in Konsole | Fehlermeldung am Eintrag, gleiche Antwort wiederholbar |
| Einladungsabschluss | Keine Erfolgsbestätigung | Erfolgstoast; Eintrag wird nach erfolgreicher HTTP-Antwort entfernt |
| Dashboard-Einstieg | Statischer Planungslink | Einladungslink bei offenen Antworten, Planung sonst |
| Navigation | Acht Hauptziele direkt | Fünf Hauptziele plus zugänglicher Mehr-Bereich |
| Tastatur | Kein Mehr-Bereich | Escape schließt schrittweise und stellt den Fokus wieder her |
| Eventtexte | „Events“, „Voting“ | „Spieleabende“, „Abstimmungen“ |

Der Post-Commit-Evaluator bewertet 49 von 50 Findings als gelöst; SEC-45 bleibt
teilweise gelöst. Kein Finding ist offen, keine Regression wurde erkannt.
Der Produktionsaudit weist einen moderaten Next.js-Befund aus, separat als
BUG-088 dokumentiert. Das Update bleibt außerhalb des FEAT-035-Umfangs.
