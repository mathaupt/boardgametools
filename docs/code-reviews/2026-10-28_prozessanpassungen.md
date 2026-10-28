# Prozessanpassungen in 0.50.16

- [x] Build und explizite Datenbankmigration getrennt; keine automatische Baseline oder db push.
- [x] Sicherheitsprüfung der Produktionsabhängigkeiten als CI-Schritt ergänzt.
- [x] Node-Mindestversion und CI vereinheitlicht: Node 24; lokale Validierung mit Node 26.
- [x] Swift-Vertrags-/Kontotrennungstests ohne Simulator als macOS-CI-Job ergänzt.
- [x] Build wartet auf Unit-, Sicherheits-, Typecheck- und Swift-Prüfungen.
- [x] Fehler, Begründungen, Abnahmegrenzen und niedrige Entwicklungsrestrisiken dokumentiert.

Die CI-Datei wurde lokal geprüft, die GitHub-Jobs wurden nicht ausgelöst. Die Produktionsfreigabe bleibt ein eigenständiger Schritt mit geprüftem Backup und gegebenenfalls Testmigration.
