# Prozessanpassungen – 05.11.2026 / FEAT-018

- [x] Unmittelbar vor Abschluss Coverage-Inventar, vollständige Testliste und aktuelle Teständerungen gegengeprüft.
- [x] Event-Voting-Sperr- und Fehlerpfade mit Charakterisierungstests erweitert.
- [x] Vollständige Coverage zweimal gemessen: zunächst zur Schwellenentscheidung, danach mit aktivem 80-%-Gate.
- [x] Globales und `src/lib/**`-Gate erst nach nachgewiesenem vollständigem Lauf auf 80/80/80/80 % gesetzt.
- [x] Keine Runtime-Dateien aus dem Coverage-Nenner entfernt.
- [x] Qualitätsmetriken, Backlog, Plan, Testing-Skill und Changelog auf Version 0.50.86 synchronisiert.
- [x] TypeScript und ESLint ausgeführt; 0 TypeScriptfehler und 0 ESLintfehler.
- [x] Security-Check bestanden; npm Registry-Audit mit gültigen Daten nach dem eingeschränkten Offlineversuch wiederholt.
- [x] Review-Regressionscheck mit Registryzugriff bestanden; SEC-45 temporären Offlinebefund dokumentiert und aufgelöst.
- [x] Änderungen mit regulären Repository-Hooks committen; lint-staged, Security-Check und Review-Regressionscheck bestanden.

## Dauerhafte Messregel

`npm run test:coverage` bleibt Abschlussprüfung jedes vollständigen Unit-Testlaufs. Das globale Gate darf nicht abgesenkt werden, um einzelne Builds zu reparieren. Sinkt eine Kennzahl unter 80 %, zuerst die Ursache (Testauslassung, geändertes Inventar oder tatsächlicher Verhaltenszweig) bestimmen und den Vertrag korrigieren.
